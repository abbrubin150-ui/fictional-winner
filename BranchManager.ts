/**
 * Branch Manager (Sprint 2)
 *
 * מנהל Branches של הגרף, מאפשר:
 * - יצירת ענפים חדשים מהמצב הנוכחי
 * - מעבר בין ענפים
 * - מיזוג ענפים (עם זיהוי קונפליקטים)
 * - הגנה על ה-main branch
 */

import { GraphDB, GraphSnapshot } from './GraphDB';

export interface Branch {
  name: string;
  snapshot: GraphSnapshot;
  createdAt: Date;
  parent?: string;
  protected: boolean;
  metadata: {
    description?: string;
    author?: string;
    tags?: string[];
  };
}

export interface MergeConflict {
  type: 'scene_modified' | 'scene_deleted' | 'arc_modified' | 'arc_deleted';
  entityId: string;
  message: string;
}

export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergedSnapshot?: GraphSnapshot;
}

export class BranchManager {
  private branches: Map<string, Branch>;
  private currentBranch: string;

  constructor() {
    this.branches = new Map();
    this.currentBranch = 'main';

    // יצירת main branch
    this.createMainBranch();
  }

  /**
   * יצירת main branch מוגן
   */
  private createMainBranch(): void {
    const mainBranch: Branch = {
      name: 'main',
      snapshot: {
        scenes: [],
        arcs: [],
        metadata: {
          version: '2025.11.1',
          timestamp: new Date(),
        },
      },
      createdAt: new Date(),
      protected: true,
      metadata: {
        description: 'Main protected branch',
      },
    };

    this.branches.set('main', mainBranch);
  }

  /**
   * יצירת Branch חדש מהמצב הנוכחי
   *
   * @param name - שם ה-Branch
   * @param graph - GraphDB instance
   * @param description - תיאור אופציונלי
   */
  createBranch(name: string, graph: GraphDB, description?: string): Branch {
    if (name === 'main') {
      throw new Error('Cannot create branch named "main" - reserved name');
    }

    if (this.branches.has(name)) {
      throw new Error(`Branch "${name}" already exists`);
    }

    const snapshot = graph.createSnapshot();

    const branch: Branch = {
      name,
      snapshot,
      createdAt: new Date(),
      parent: this.currentBranch,
      protected: false,
      metadata: {
        description,
      },
    };

    this.branches.set(name, branch);
    return branch;
  }

  /**
   * מעבר ל-Branch אחר
   *
   * @param name - שם ה-Branch
   * @param graph - GraphDB instance
   */
  switchBranch(name: string, graph: GraphDB): void {
    const branch = this.branches.get(name);
    if (!branch) {
      throw new Error(`Branch "${name}" not found`);
    }

    // טעינת ה-Snapshot של ה-Branch
    graph.loadSnapshot(branch.snapshot);
    this.currentBranch = name;
  }

  /**
   * שמירת השינויים ב-Branch הנוכחי
   *
   * @param graph - GraphDB instance
   */
  saveBranch(graph: GraphDB): void {
    const branch = this.branches.get(this.currentBranch);
    if (!branch) {
      throw new Error(`Current branch "${this.currentBranch}" not found`);
    }

    // עדכון ה-Snapshot
    branch.snapshot = graph.createSnapshot();
  }

  /**
   * מיזוג Branch ל-Branch הנוכחי
   *
   * @param sourceBranchName - שם ה-Branch למיזוג
   * @param graph - GraphDB instance
   * @returns תוצאת המיזוג
   */
  mergeBranch(sourceBranchName: string, graph: GraphDB): MergeResult {
    const sourceBranch = this.branches.get(sourceBranchName);
    if (!sourceBranch) {
      throw new Error(`Source branch "${sourceBranchName}" not found`);
    }

    const targetBranch = this.branches.get(this.currentBranch);
    if (!targetBranch) {
      throw new Error(`Target branch "${this.currentBranch}" not found`);
    }

    // זיהוי קונפליקטים
    const conflicts = this.detectConflicts(sourceBranch, targetBranch);

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
      };
    }

    // מיזוג פשוט - העתקת כל הסצנות וה-Arcs מה-source
    const mergedSnapshot: GraphSnapshot = {
      scenes: [...sourceBranch.snapshot.scenes],
      arcs: [...sourceBranch.snapshot.arcs],
      metadata: {
        version: targetBranch.snapshot.metadata.version,
        timestamp: new Date(),
      },
    };

    // טעינת ה-Snapshot הממוזג
    graph.loadSnapshot(mergedSnapshot);

    // שמירה ב-Branch הנוכחי
    this.saveBranch(graph);

    return {
      success: true,
      conflicts: [],
      mergedSnapshot,
    };
  }

  /**
   * זיהוי קונפליקטים בין שני Branches
   */
  private detectConflicts(source: Branch, target: Branch): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    // בדיקת סצנות ששונו בשני ה-Branches
    const sourceScenes = new Map(source.snapshot.scenes.map((s) => [s.id, s]));
    const targetScenes = new Map(target.snapshot.scenes.map((s) => [s.id, s]));

    for (const [sceneId, sourceScene] of sourceScenes) {
      const targetScene = targetScenes.get(sceneId);
      if (targetScene) {
        // בדיקה אם השתנה
        if (JSON.stringify(sourceScene) !== JSON.stringify(targetScene)) {
          conflicts.push({
            type: 'scene_modified',
            entityId: sceneId,
            message: `Scene "${sceneId}" was modified in both branches`,
          });
        }
      }
    }

    // בדיקת סצנות שנמחקו
    for (const [sceneId] of targetScenes) {
      if (!sourceScenes.has(sceneId)) {
        conflicts.push({
          type: 'scene_deleted',
          entityId: sceneId,
          message: `Scene "${sceneId}" exists in target but not in source`,
        });
      }
    }

    // בדיקה דומה ל-Arcs
    const sourceArcs = new Map(source.snapshot.arcs.map((a) => [a.id, a]));
    const targetArcs = new Map(target.snapshot.arcs.map((a) => [a.id, a]));

    for (const [arcId, sourceArc] of sourceArcs) {
      const targetArc = targetArcs.get(arcId);
      if (targetArc) {
        if (JSON.stringify(sourceArc) !== JSON.stringify(targetArc)) {
          conflicts.push({
            type: 'arc_modified',
            entityId: arcId,
            message: `Arc "${arcId}" was modified in both branches`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * מחיקת Branch
   *
   * @param name - שם ה-Branch למחיקה
   */
  deleteBranch(name: string): void {
    const branch = this.branches.get(name);
    if (!branch) {
      throw new Error(`Branch "${name}" not found`);
    }

    if (branch.protected) {
      throw new Error(`Cannot delete protected branch "${name}"`);
    }

    if (name === this.currentBranch) {
      throw new Error('Cannot delete the current branch');
    }

    this.branches.delete(name);
  }

  /**
   * קבלת רשימת כל ה-Branches
   */
  listBranches(): Branch[] {
    return Array.from(this.branches.values());
  }

  /**
   * קבלת Branch נוכחי
   */
  getCurrentBranch(): Branch | undefined {
    return this.branches.get(this.currentBranch);
  }

  /**
   * קבלת שם ה-Branch הנוכחי
   */
  getCurrentBranchName(): string {
    return this.currentBranch;
  }

  /**
   * האם Branch קיים?
   */
  branchExists(name: string): boolean {
    return this.branches.has(name);
  }

  /**
   * קבלת Branch לפי שם
   */
  getBranch(name: string): Branch | undefined {
    return this.branches.get(name);
  }
}
