/**
 * GraphDB - בסיס נתונים גרפי בזיכרון ל-Scenes ו-Arcs
 * 
 * מנהל את כל הסצנות והקשתות העלילתיות,
 * תומך ב-CRUD operations ושמירה/טעינה מקובץ
 */

import { Scene, SceneData } from './Scene';
import { Arc, ArcData } from './Arc';

export interface GraphSnapshot {
  scenes: SceneData[];
  arcs: ArcData[];
  metadata: {
    version: string;
    timestamp: Date;
    checksum?: string;
  };
}

export class GraphDB {
  private scenes: Map<string, Scene>;
  private arcs: Map<string, Arc>;
  private version: string;

  constructor() {
    this.scenes = new Map();
    this.arcs = new Map();
    this.version = '2025.11.1';
  }

  // ============ SCENE OPERATIONS ============

  /**
   * יצירת סצנה חדשה
   */
  createScene(data: Omit<SceneData, 'id'>): Scene {
    const id = this.generateId('scene');
    const scene = new Scene(
      id,
      data.title,
      data.premise,
      data.why,
      data.how,
      data.cost
    );

    const validation = scene.validate();
    if (!validation.valid) {
      throw new Error(`Invalid scene: ${validation.errors.join(', ')}`);
    }

    this.scenes.set(id, scene);
    return scene;
  }

  /**
   * שליפת סצנה לפי ID
   */
  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  /**
   * שליפת כל הסצנות
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * עדכון סצנה
   */
  updateScene(id: string, updates: Partial<SceneData>): Scene {
    const scene = this.scenes.get(id);
    if (!scene) {
      throw new Error(`Scene ${id} not found`);
    }

    scene.update(updates);

    const validation = scene.validate();
    if (!validation.valid) {
      throw new Error(`Invalid scene update: ${validation.errors.join(', ')}`);
    }

    return scene;
  }

  /**
   * מחיקת סצנה
   * גם מסיר את הסצנה מכל ה-Arcs שמכילים אותה
   */
  deleteScene(id: string): boolean {
    const scene = this.scenes.get(id);
    if (!scene) {
      return false;
    }

    // הסרה מכל ה-Arcs
    for (const arc of this.arcs.values()) {
      arc.removeScene(id);
    }

    return this.scenes.delete(id);
  }

  // ============ ARC OPERATIONS ============

  /**
   * יצירת Arc חדש
   */
  createArc(intent: string): Arc {
    const id = this.generateId('arc');
    const arc = new Arc(id, intent);
    this.arcs.set(id, arc);
    return arc;
  }

  /**
   * שליפת Arc לפי ID
   */
  getArc(id: string): Arc | undefined {
    return this.arcs.get(id);
  }

  /**
   * שליפת כל ה-Arcs
   */
  getAllArcs(): Arc[] {
    return Array.from(this.arcs.values());
  }

  /**
   * עדכון Arc
   */
  updateArc(id: string, updates: Partial<ArcData>): Arc {
    const arc = this.arcs.get(id);
    if (!arc) {
      throw new Error(`Arc ${id} not found`);
    }

    if (updates.intent) arc.updateIntent(updates.intent);
    if (updates.scenes) arc.scenes = updates.scenes;
    if (updates.metadata?.status) arc.updateStatus(updates.metadata.status);

    const validation = arc.validate();
    if (!validation.valid) {
      throw new Error(`Invalid arc update: ${validation.errors.join(', ')}`);
    }

    return arc;
  }

  /**
   * מחיקת Arc
   */
  deleteArc(id: string): boolean {
    return this.arcs.delete(id);
  }

  /**
   * הוספת סצנה ל-Arc
   */
  addSceneToArc(arcId: string, sceneId: string, position?: number): void {
    const arc = this.arcs.get(arcId);
    if (!arc) {
      throw new Error(`Arc ${arcId} not found`);
    }

    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    arc.addScene(sceneId, position);
  }

  // ============ GRAPH ANALYSIS ============

  /**
   * מציאת כל הסצנות המקושרות לסצנה מסוימת
   */
  getConnectedScenes(sceneId: string): Scene[] {
    const scene = this.scenes.get(sceneId);
    if (!scene) return [];

    return scene.links
      .map((linkId) => this.scenes.get(linkId))
      .filter((s): s is Scene => s !== undefined);
  }

  /**
   * מציאת כל ה-Arcs שמכילים סצנה מסוימת
   */
  getArcsContainingScene(sceneId: string): Arc[] {
    return Array.from(this.arcs.values()).filter((arc) =>
      arc.scenes.includes(sceneId)
    );
  }

  /**
   * חישוב עלות כוללת של כל ה-Arcs
   */
  getTotalCost(): number {
    return Array.from(this.scenes.values()).reduce(
      (total, scene) => total + scene.cost,
      0
    );
  }

  // ============ SNAPSHOT & PERSISTENCE ============

  /**
   * יצירת Snapshot של הגרף הנוכחי
   */
  createSnapshot(): GraphSnapshot {
    return {
      scenes: Array.from(this.scenes.values()).map((s) => s.toJSON()),
      arcs: Array.from(this.arcs.values()).map((a) => a.toJSON()),
      metadata: {
        version: this.version,
        timestamp: new Date(),
      },
    };
  }

  /**
   * שחזור מ-Snapshot
   */
  loadSnapshot(snapshot: GraphSnapshot): void {
    this.scenes.clear();
    this.arcs.clear();

    // טעינת סצנות
    for (const sceneData of snapshot.scenes) {
      const scene = Scene.fromJSON(sceneData);
      this.scenes.set(scene.id, scene);
    }

    // טעינת Arcs
    for (const arcData of snapshot.arcs) {
      const arc = Arc.fromJSON(arcData);
      this.arcs.set(arc.id, arc);
    }
  }

  /**
   * ניקוי הגרף
   */
  clear(): void {
    this.scenes.clear();
    this.arcs.clear();
  }

  // ============ UTILITIES ============

  /**
   * יצירת ID ייחודי
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * סטטיסטיקות גרף
   */
  getStats(): {
    sceneCount: number;
    arcCount: number;
    totalCost: number;
    avgScenePerArc: number;
  } {
    const sceneCount = this.scenes.size;
    const arcCount = this.arcs.size;
    const totalCost = this.getTotalCost();
    
    let totalScenes = 0;
    for (const arc of this.arcs.values()) {
      totalScenes += arc.scenes.length;
    }
    const avgScenePerArc = arcCount > 0 ? totalScenes / arcCount : 0;

    return {
      sceneCount,
      arcCount,
      totalCost,
      avgScenePerArc,
    };
  }
}
