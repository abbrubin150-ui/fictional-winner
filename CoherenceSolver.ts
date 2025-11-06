/**
 * Coherence Solver (Sprint 2)
 *
 * SAT-based solver לבדיקת קוהרנטיות נרטיבית
 *
 * מבצע בדיקות:
 * - זיהוי תלויות מעגליות בגרף
 * - בדיקת עקביות קשרים (כל link מצביע לסצנה קיימת)
 * - וולידציה בסיסית של מבנה הגרף
 */

import { GraphDB } from './GraphDB';

export interface CoherenceReport {
  coherent: boolean;
  issues: CoherenceIssue[];
  warnings: string[];
  stats: {
    scenesChecked: number;
    arcsChecked: number;
    linksChecked: number;
  };
}

export interface CoherenceIssue {
  type: 'circular_dependency' | 'broken_link' | 'orphaned_scene' | 'timeline_conflict';
  severity: 'error' | 'warning';
  message: string;
  affectedScenes: string[];
}

export class CoherenceSolver {
  private visited: Set<string>;
  private recursionStack: Set<string>;

  constructor() {
    this.visited = new Set();
    this.recursionStack = new Set();
  }

  /**
   * בדיקת קוהרנטיות של גרף סצנות
   *
   * @param graph - GraphDB instance
   * @returns דוח קוהרנטיות מפורט
   */
  checkCoherence(graph: GraphDB): CoherenceReport {
    const issues: CoherenceIssue[] = [];
    const warnings: string[] = [];

    const scenes = graph.getAllScenes();
    const arcs = graph.getAllArcs();

    // 1. בדיקת תלויות מעגליות
    const cycles = this.detectCircularDependencies(graph);
    for (const cycle of cycles) {
      issues.push({
        type: 'circular_dependency',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        affectedScenes: cycle,
      });
    }

    // 2. בדיקת קישורים שבורים
    const brokenLinks = this.detectBrokenLinks(graph);
    for (const { sceneId, brokenLinkId } of brokenLinks) {
      issues.push({
        type: 'broken_link',
        severity: 'error',
        message: `Scene "${sceneId}" links to non-existent scene "${brokenLinkId}"`,
        affectedScenes: [sceneId, brokenLinkId],
      });
    }

    // 3. בדיקת סצנות יתומות (לא משתתפות באף Arc)
    const orphanedScenes = this.detectOrphanedScenes(graph);
    if (orphanedScenes.length > 0) {
      warnings.push(`Found ${orphanedScenes.length} orphaned scenes not in any Arc: ${orphanedScenes.join(', ')}`);
    }

    // 4. בדיקת Arcs ריקים
    const emptyArcs = arcs.filter(arc => arc.scenes.length === 0);
    if (emptyArcs.length > 0) {
      warnings.push(`Found ${emptyArcs.length} empty arcs: ${emptyArcs.map(a => a.id).join(', ')}`);
    }

    const coherent = issues.filter(i => i.severity === 'error').length === 0;

    return {
      coherent,
      issues,
      warnings,
      stats: {
        scenesChecked: scenes.length,
        arcsChecked: arcs.length,
        linksChecked: scenes.reduce((sum, s) => sum + s.links.length, 0),
      },
    };
  }

  /**
   * זיהוי תלויות מעגליות בגרף
   * משתמש באלגוריתם DFS עם recursion stack
   *
   * @param graph - GraphDB instance
   * @returns מערך של מחזורים, כל מחזור הוא מערך של Scene IDs
   */
  detectCircularDependencies(graph: GraphDB): string[][] {
    const cycles: string[][] = [];
    this.visited = new Set();
    this.recursionStack = new Set();

    const scenes = graph.getAllScenes();

    for (const scene of scenes) {
      if (!this.visited.has(scene.id)) {
        const cycle = this.dfsDetectCycle(scene.id, graph, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  /**
   * DFS רקורסיבי לזיהוי מחזורים
   */
  private dfsDetectCycle(sceneId: string, graph: GraphDB, path: string[]): string[] {
    this.visited.add(sceneId);
    this.recursionStack.add(sceneId);
    path.push(sceneId);

    const scene = graph.getScene(sceneId);
    if (!scene) {
      this.recursionStack.delete(sceneId);
      return [];
    }

    // בדיקת כל הקישורים מהסצנה הנוכחית
    for (const linkedSceneId of scene.links) {
      if (!this.visited.has(linkedSceneId)) {
        const cycle = this.dfsDetectCycle(linkedSceneId, graph, [...path]);
        if (cycle.length > 0) {
          this.recursionStack.delete(sceneId);
          return cycle;
        }
      } else if (this.recursionStack.has(linkedSceneId)) {
        // מצאנו מחזור!
        const cycleStartIndex = path.indexOf(linkedSceneId);
        const cycle = path.slice(cycleStartIndex);
        cycle.push(linkedSceneId); // לסגור את המחזור
        this.recursionStack.delete(sceneId);
        return cycle;
      }
    }

    this.recursionStack.delete(sceneId);
    return [];
  }

  /**
   * זיהוי קישורים שבורים (links לסצנות שלא קיימות)
   */
  private detectBrokenLinks(graph: GraphDB): Array<{ sceneId: string; brokenLinkId: string }> {
    const brokenLinks: Array<{ sceneId: string; brokenLinkId: string }> = [];
    const scenes = graph.getAllScenes();

    for (const scene of scenes) {
      for (const linkId of scene.links) {
        const linkedScene = graph.getScene(linkId);
        if (!linkedScene) {
          brokenLinks.push({
            sceneId: scene.id,
            brokenLinkId: linkId,
          });
        }
      }
    }

    return brokenLinks;
  }

  /**
   * זיהוי סצנות יתומות שלא משתתפות באף Arc
   */
  private detectOrphanedScenes(graph: GraphDB): string[] {
    const scenes = graph.getAllScenes();
    const arcs = graph.getAllArcs();

    const scenesInArcs = new Set<string>();
    for (const arc of arcs) {
      for (const sceneId of arc.scenes) {
        scenesInArcs.add(sceneId);
      }
    }

    const orphaned: string[] = [];
    for (const scene of scenes) {
      if (!scenesInArcs.has(scene.id)) {
        orphaned.push(scene.id);
      }
    }

    return orphaned;
  }

  /**
   * בדיקת עקביות זמנים (placeholder לעתיד)
   * כרגע מחזיר true תמיד, יורחב ב-Sprint 3 עם Timeline Manager
   */
  validateTimeline(_graph: GraphDB): boolean {
    // TODO Sprint 3: Implement timeline consistency checking
    // - Check for temporal paradoxes
    // - Validate flashback/flash-forward sequences
    // - Ensure character presence consistency
    return true;
  }

  /**
   * ניקוי מצב פנימי (לשימוש בין בדיקות)
   */
  reset(): void {
    this.visited.clear();
    this.recursionStack.clear();
  }
}
