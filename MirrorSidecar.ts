/**
 * Mirror Sidecar (Sprint 3)
 *
 * מערכת Mirror-Drift לניהול התפצלויות וסנכרון בין ענפים
 *
 * מבוסס על הרעיון שענפים שונים הם "מראות" זה של זה,
 * ומדידת ה-drift (סטייה) ביניהם מאפשרת החלטות מושכלות על מיזוג
 *
 * תכונות:
 * - חישוב Mirror-Drift בין שני ענפים
 * - בקרת מיזוג מבוססת סף drift
 * - סנכרון אוטומטי או ידני
 * - זיהוי והצעת פתרונות לקונפליקטים
 * - ניטור real-time של drift
 */

import { GraphDB } from './GraphDB';
import { Scene } from './Scene';
import { Arc } from './Arc';
import { Character } from './Character';

export interface MirrorDrift {
  branchA: string;
  branchB: string;
  driftScore: number; // 0-100, where 0 = identical, 100 = completely different
  timestamp: Date;
  differences: DriftDifference[];
  metadata?: {
    calculatedBy?: string;
    notes?: string;
  };
}

export interface DriftDifference {
  type: 'scene_added' | 'scene_removed' | 'scene_modified' | 'arc_changed' | 'character_changed' | 'structure_changed';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  affectedIds: string[];
  suggestedResolution?: string;
}

export interface MirrorConflict {
  id: string;
  type: 'scene_conflict' | 'arc_conflict' | 'character_conflict' | 'link_conflict';
  description: string;
  branchA: {
    name: string;
    value: any;
  };
  branchB: {
    name: string;
    value: any;
  };
  resolution?: 'keep_a' | 'keep_b' | 'merge' | 'manual';
  resolved: boolean;
}

export interface SyncReport {
  success: boolean;
  conflicts: MirrorConflict[];
  changes: {
    scenesAdded: number;
    scenesRemoved: number;
    scenesModified: number;
    arcsModified: number;
    charactersModified: number;
  };
  driftBefore: number;
  driftAfter: number;
}

export interface MirrorConfig {
  autoSyncThreshold: number; // Drift threshold for automatic sync (0-100)
  conflictStrategy: 'manual' | 'prefer_source' | 'prefer_target' | 'newest_wins';
  monitoringInterval?: number; // Milliseconds between drift checks
}

export class MirrorSidecar {
  private config: MirrorConfig;
  private driftHistory: Map<string, MirrorDrift[]>; // Key: "branchA-branchB"
  private activeMonitors: Map<string, NodeJS.Timeout>;

  constructor(config?: Partial<MirrorConfig>) {
    this.config = {
      autoSyncThreshold: 30, // Default: auto-sync if drift < 30%
      conflictStrategy: 'manual',
      monitoringInterval: 60000, // 1 minute
      ...config,
    };
    this.driftHistory = new Map();
    this.activeMonitors = new Map();
  }

  /**
   * חישוב Mirror-Drift בין שני GraphDB instances
   * מחזיר ציון drift מ-0 (זהה) ל-100 (שונה לחלוטין)
   */
  calculateDrift(graphA: GraphDB, graphB: GraphDB, branchNameA: string, branchNameB: string): MirrorDrift {
    const differences: DriftDifference[] = [];
    let totalDrift = 0;

    // 1. Compare scenes
    const scenesA = new Map(graphA.getAllScenes().map(s => [s.id, s]));
    const scenesB = new Map(graphB.getAllScenes().map(s => [s.id, s]));

    // Scenes only in A (removed from B)
    for (const [id, scene] of scenesA) {
      if (!scenesB.has(id)) {
        differences.push({
          type: 'scene_removed',
          severity: 'moderate',
          description: `Scene "${scene.title}" (${id}) exists in ${branchNameA} but not in ${branchNameB}`,
          affectedIds: [id],
          suggestedResolution: `Consider adding scene to ${branchNameB} or removing from ${branchNameA}`,
        });
        totalDrift += 5;
      }
    }

    // Scenes only in B (added to B)
    for (const [id, scene] of scenesB) {
      if (!scenesA.has(id)) {
        differences.push({
          type: 'scene_added',
          severity: 'moderate',
          description: `Scene "${scene.title}" (${id}) exists in ${branchNameB} but not in ${branchNameA}`,
          affectedIds: [id],
          suggestedResolution: `Consider adding scene to ${branchNameA}`,
        });
        totalDrift += 5;
      }
    }

    // Modified scenes
    for (const [id, sceneA] of scenesA) {
      const sceneB = scenesB.get(id);
      if (sceneB) {
        const sceneDrift = this.compareScenes(sceneA, sceneB);
        if (sceneDrift.isDifferent) {
          differences.push({
            type: 'scene_modified',
            severity: sceneDrift.severity,
            description: `Scene "${sceneA.title}" differs: ${sceneDrift.differences.join(', ')}`,
            affectedIds: [id],
            suggestedResolution: 'Review changes and merge manually',
          });
          totalDrift += sceneDrift.severity === 'major' ? 3 : sceneDrift.severity === 'moderate' ? 2 : 1;
        }
      }
    }

    // 2. Compare arcs
    const arcsA = new Map(graphA.getAllArcs().map(a => [a.id, a]));
    const arcsB = new Map(graphB.getAllArcs().map(a => [a.id, a]));

    for (const [id, arcA] of arcsA) {
      const arcB = arcsB.get(id);
      if (!arcB) {
        differences.push({
          type: 'arc_changed',
          severity: 'moderate',
          description: `Arc "${arcA.intent}" (${id}) exists in ${branchNameA} but not in ${branchNameB}`,
          affectedIds: [id],
        });
        totalDrift += 5;
      } else if (arcA.intent !== arcB.intent || JSON.stringify(arcA.scenes) !== JSON.stringify(arcB.scenes)) {
        differences.push({
          type: 'arc_changed',
          severity: 'moderate',
          description: `Arc "${arcA.intent}" has different structure between branches`,
          affectedIds: [id],
        });
        totalDrift += 3;
      }
    }

    for (const [id, arcB] of arcsB) {
      if (!arcsA.has(id)) {
        differences.push({
          type: 'arc_changed',
          severity: 'moderate',
          description: `Arc "${arcB.intent}" (${id}) exists in ${branchNameB} but not in ${branchNameA}`,
          affectedIds: [id],
        });
        totalDrift += 5;
      }
    }

    // 3. Compare characters
    const charsA = new Map(graphA.getAllCharacters().map(c => [c.id, c]));
    const charsB = new Map(graphB.getAllCharacters().map(c => [c.id, c]));

    for (const [id, charA] of charsA) {
      const charB = charsB.get(id);
      if (!charB) {
        differences.push({
          type: 'character_changed',
          severity: 'moderate',
          description: `Character "${charA.name}" (${id}) exists in ${branchNameA} but not in ${branchNameB}`,
          affectedIds: [id],
        });
        totalDrift += 4;
      } else {
        const charDrift = this.compareCharacters(charA, charB);
        if (charDrift > 0) {
          differences.push({
            type: 'character_changed',
            severity: charDrift > 2 ? 'major' : 'minor',
            description: `Character "${charA.name}" has different properties between branches`,
            affectedIds: [id],
          });
          totalDrift += charDrift;
        }
      }
    }

    for (const [id, charB] of charsB) {
      if (!charsA.has(id)) {
        differences.push({
          type: 'character_changed',
          severity: 'moderate',
          description: `Character "${charB.name}" (${id}) exists in ${branchNameB} but not in ${branchNameA}`,
          affectedIds: [id],
        });
        totalDrift += 4;
      }
    }

    // Normalize drift score to 0-100
    const driftScore = Math.min(100, totalDrift);

    const drift: MirrorDrift = {
      branchA: branchNameA,
      branchB: branchNameB,
      driftScore,
      timestamp: new Date(),
      differences,
    };

    // Store in history
    const key = `${branchNameA}-${branchNameB}`;
    if (!this.driftHistory.has(key)) {
      this.driftHistory.set(key, []);
    }
    this.driftHistory.get(key)!.push(drift);

    return drift;
  }

  /**
   * השוואת שתי סצנות
   */
  private compareScenes(sceneA: Scene, sceneB: Scene): {
    isDifferent: boolean;
    severity: 'minor' | 'moderate' | 'major';
    differences: string[];
  } {
    const differences: string[] = [];

    if (sceneA.title !== sceneB.title) differences.push('title');
    if (sceneA.premise !== sceneB.premise) differences.push('premise');
    if (sceneA.why !== sceneB.why) differences.push('why');
    if (sceneA.how !== sceneB.how) differences.push('how');
    if (sceneA.cost !== sceneB.cost) differences.push('cost');
    if (JSON.stringify(sceneA.links) !== JSON.stringify(sceneB.links)) differences.push('links');
    if (JSON.stringify(sceneA.characterPresence) !== JSON.stringify(sceneB.characterPresence)) {
      differences.push('characters');
    }

    const isDifferent = differences.length > 0;
    const severity = differences.length > 3 ? 'major' : differences.length > 1 ? 'moderate' : 'minor';

    return { isDifferent, severity, differences };
  }

  /**
   * השוואת שתי דמויות
   */
  private compareCharacters(charA: Character, charB: Character): number {
    let drift = 0;

    if (charA.name !== charB.name) drift += 2;
    if (charA.description !== charB.description) drift += 1;
    if (charA.role !== charB.role) drift += 1;
    if (JSON.stringify(charA.traits) !== JSON.stringify(charB.traits)) drift += 1;
    if (JSON.stringify(charA.relationships) !== JSON.stringify(charB.relationships)) drift += 2;
    if (JSON.stringify(charA.scenePresence) !== JSON.stringify(charB.scenePresence)) drift += 1;

    return drift;
  }

  /**
   * בדיקה אם יש לבצע סנכרון אוטומטי
   */
  shouldAutoSync(drift: MirrorDrift): boolean {
    return drift.driftScore < this.config.autoSyncThreshold;
  }

  /**
   * סנכרון בין שני גרפים
   * מנסה למזג שינויים מ-source ל-target
   */
  async synchronize(
    sourceGraph: GraphDB,
    targetGraph: GraphDB,
    sourceBranch: string,
    targetBranch: string
  ): Promise<SyncReport> {
    const driftBefore = this.calculateDrift(sourceGraph, targetGraph, sourceBranch, targetBranch);
    const conflicts: MirrorConflict[] = [];
    const changes = {
      scenesAdded: 0,
      scenesRemoved: 0,
      scenesModified: 0,
      arcsModified: 0,
      charactersModified: 0,
    };

    // Process differences based on strategy
    for (const diff of driftBefore.differences) {
      try {
        switch (diff.type) {
          case 'scene_added':
            await this.syncSceneAddition(sourceGraph, targetGraph, diff, conflicts);
            changes.scenesAdded++;
            break;

          case 'scene_removed':
            await this.syncSceneRemoval(sourceGraph, targetGraph, diff, conflicts);
            changes.scenesRemoved++;
            break;

          case 'scene_modified':
            await this.syncSceneModification(sourceGraph, targetGraph, diff, conflicts);
            changes.scenesModified++;
            break;

          case 'arc_changed':
            await this.syncArcChange(sourceGraph, targetGraph, diff, conflicts);
            changes.arcsModified++;
            break;

          case 'character_changed':
            await this.syncCharacterChange(sourceGraph, targetGraph, diff, conflicts);
            changes.charactersModified++;
            break;
        }
      } catch (error) {
        console.error(`Error syncing ${diff.type}:`, error);
      }
    }

    const driftAfter = this.calculateDrift(sourceGraph, targetGraph, sourceBranch, targetBranch);

    return {
      success: conflicts.filter(c => !c.resolved).length === 0,
      conflicts,
      changes,
      driftBefore: driftBefore.driftScore,
      driftAfter: driftAfter.driftScore,
    };
  }

  /**
   * סנכרון הוספת סצנה
   */
  private async syncSceneAddition(
    sourceGraph: GraphDB,
    targetGraph: GraphDB,
    diff: DriftDifference,
    conflicts: MirrorConflict[]
  ): Promise<void> {
    const sceneId = diff.affectedIds[0];
    const scene = sourceGraph.getScene(sceneId);

    if (!scene) return;

    // Check if target already has a different scene with same ID
    if (targetGraph.getScene(sceneId)) {
      conflicts.push({
        id: `scene-conflict-${sceneId}`,
        type: 'scene_conflict',
        description: `Scene ID ${sceneId} exists in both branches with different content`,
        branchA: { name: 'source', value: scene },
        branchB: { name: 'target', value: targetGraph.getScene(sceneId) },
        resolved: false,
      });
      return;
    }

    // Add scene to target
    targetGraph.addScene(Scene.fromJSON(scene.toJSON()));
  }

  /**
   * סנכרון הסרת סצנה
   */
  private async syncSceneRemoval(
    _sourceGraph: GraphDB,
    targetGraph: GraphDB,
    diff: DriftDifference,
    conflicts: MirrorConflict[]
  ): Promise<void> {
    const sceneId = diff.affectedIds[0];
    const scene = targetGraph.getScene(sceneId);

    if (!scene) return;

    // Check if scene is still referenced
    const arcs = targetGraph.getAllArcs().filter(arc => arc.scenes.includes(sceneId));
    if (arcs.length > 0) {
      conflicts.push({
        id: `scene-removal-conflict-${sceneId}`,
        type: 'scene_conflict',
        description: `Scene ${sceneId} is referenced by ${arcs.length} arc(s)`,
        branchA: { name: 'source', value: null },
        branchB: { name: 'target', value: scene },
        resolution: 'manual',
        resolved: false,
      });
      return;
    }

    // Safe to remove
    targetGraph.deleteScene(sceneId);
  }

  /**
   * סנכרון שינוי סצנה
   */
  private async syncSceneModification(
    sourceGraph: GraphDB,
    targetGraph: GraphDB,
    diff: DriftDifference,
    conflicts: MirrorConflict[]
  ): Promise<void> {
    const sceneId = diff.affectedIds[0];
    const sourceScene = sourceGraph.getScene(sceneId);
    const targetScene = targetGraph.getScene(sceneId);

    if (!sourceScene || !targetScene) return;

    // Check if both have been modified since last sync
    if (
      sourceScene.metadata.updatedAt > targetScene.metadata.updatedAt &&
      this.config.conflictStrategy === 'newest_wins'
    ) {
      targetGraph.updateScene(sceneId, sourceScene.toJSON());
    } else if (this.config.conflictStrategy === 'prefer_source') {
      targetGraph.updateScene(sceneId, sourceScene.toJSON());
    } else {
      conflicts.push({
        id: `scene-mod-conflict-${sceneId}`,
        type: 'scene_conflict',
        description: `Scene ${sceneId} modified in both branches`,
        branchA: { name: 'source', value: sourceScene },
        branchB: { name: 'target', value: targetScene },
        resolved: false,
      });
    }
  }

  /**
   * סנכרון שינוי Arc
   */
  private async syncArcChange(
    sourceGraph: GraphDB,
    targetGraph: GraphDB,
    diff: DriftDifference,
    conflicts: MirrorConflict[]
  ): Promise<void> {
    const arcId = diff.affectedIds[0];
    const sourceArc = sourceGraph.getArc(arcId);

    if (!sourceArc) {
      // Arc was removed from source
      targetGraph.deleteArc(arcId);
      return;
    }

    const targetArc = targetGraph.getArc(arcId);
    if (!targetArc) {
      // Arc doesn't exist in target, add it
      targetGraph.addArc(Arc.fromJSON(sourceArc.toJSON()));
    } else {
      // Arc exists in both, check for conflicts
      if (this.config.conflictStrategy === 'prefer_source') {
        targetGraph.updateArc(arcId, sourceArc.toJSON());
      } else {
        conflicts.push({
          id: `arc-conflict-${arcId}`,
          type: 'arc_conflict',
          description: `Arc ${arcId} differs between branches`,
          branchA: { name: 'source', value: sourceArc },
          branchB: { name: 'target', value: targetArc },
          resolved: false,
        });
      }
    }
  }

  /**
   * סנכרון שינוי דמות
   */
  private async syncCharacterChange(
    sourceGraph: GraphDB,
    targetGraph: GraphDB,
    diff: DriftDifference,
    conflicts: MirrorConflict[]
  ): Promise<void> {
    const charId = diff.affectedIds[0];
    const sourceChar = sourceGraph.getCharacter(charId);

    if (!sourceChar) {
      // Character was removed from source
      targetGraph.deleteCharacter(charId);
      return;
    }

    const targetChar = targetGraph.getCharacter(charId);
    if (!targetChar) {
      // Character doesn't exist in target, add it
      targetGraph.addCharacter(Character.fromJSON(sourceChar.toJSON()));
    } else {
      // Character exists in both
      if (this.config.conflictStrategy === 'prefer_source') {
        targetGraph.updateCharacter(charId, sourceChar.toJSON());
      } else {
        conflicts.push({
          id: `char-conflict-${charId}`,
          type: 'character_conflict',
          description: `Character ${charId} differs between branches`,
          branchA: { name: 'source', value: sourceChar },
          branchB: { name: 'target', value: targetChar },
          resolved: false,
        });
      }
    }
  }

  /**
   * התחלת ניטור real-time של drift
   */
  startMonitoring(
    graphA: GraphDB,
    graphB: GraphDB,
    branchNameA: string,
    branchNameB: string,
    callback: (drift: MirrorDrift) => void
  ): string {
    const monitorId = `${branchNameA}-${branchNameB}`;

    if (this.activeMonitors.has(monitorId)) {
      this.stopMonitoring(monitorId);
    }

    const interval = setInterval(() => {
      const drift = this.calculateDrift(graphA, graphB, branchNameA, branchNameB);
      callback(drift);

      // Auto-sync if below threshold
      if (this.shouldAutoSync(drift)) {
        this.synchronize(graphA, graphB, branchNameA, branchNameB).catch(console.error);
      }
    }, this.config.monitoringInterval);

    this.activeMonitors.set(monitorId, interval);
    return monitorId;
  }

  /**
   * עצירת ניטור
   */
  stopMonitoring(monitorId: string): void {
    const interval = this.activeMonitors.get(monitorId);
    if (interval) {
      clearInterval(interval);
      this.activeMonitors.delete(monitorId);
    }
  }

  /**
   * קבלת היסטוריית drift
   */
  getDriftHistory(branchA: string, branchB: string): MirrorDrift[] {
    const key = `${branchA}-${branchB}`;
    return this.driftHistory.get(key) || [];
  }

  /**
   * ניקוי היסטוריה
   */
  clearHistory(): void {
    this.driftHistory.clear();
  }

  /**
   * ניקוי והפסקת כל המוניטורים
   */
  shutdown(): void {
    for (const [monitorId] of this.activeMonitors) {
      this.stopMonitoring(monitorId);
    }
  }
}
