/**
 * GraphDB - בסיס נתונים גרפי בזיכרון ל-Scenes ו-Arcs
 * 
 * מנהל את כל הסצנות והקשתות העלילתיות,
 * תומך ב-CRUD operations ושמירה/טעינה מקובץ
 */

import { Scene, SceneData } from './Scene';
import { Arc, ArcData } from './Arc';
import { Character, CharacterData } from './Character';
import { Artifact, ArtifactData } from './Artifact';
import { CoherenceSolver, CoherenceReport } from '../utils/CoherenceSolver';

export interface GraphSnapshot {
  scenes: SceneData[];
  arcs: ArcData[];
  characters: CharacterData[];
  artifacts?: ArtifactData[];
  metadata: {
    version: string;
    timestamp: Date;
    checksum?: string;
  };
}

export class GraphDB {
  private scenes: Map<string, Scene>;
  private arcs: Map<string, Arc>;
  private characters: Map<string, Character>;
  private artifacts: Map<string, Artifact>;
  private version: string;

  constructor() {
    this.scenes = new Map();
    this.arcs = new Map();
    this.characters = new Map();
    this.artifacts = new Map();
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

    // Set optional fields if provided
    if (data.links) {
      scene.links = data.links;
    }
    if (data.characterPresence) {
      scene.characterPresence = data.characterPresence;
    }

    const validation = scene.validate();
    if (!validation.valid) {
      throw new Error(`Invalid scene: ${validation.errors.join(', ')}`);
    }

    this.scenes.set(id, scene);
    return scene;
  }

  /**
   * הוספת סצנה קיימת לגרף
   */
  addScene(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      throw new Error(`Scene with id ${scene.id} already exists`);
    }

    const validation = scene.validate();
    if (!validation.valid) {
      throw new Error(`Invalid scene: ${validation.errors.join(', ')}`);
    }

    this.scenes.set(scene.id, scene);
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
   * גם מסיר את הסצנה מכל ה-Arcs שמכילים אותה ומכל הדמויות
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

    // הסרה מכל הדמויות שמופיעות בסצנה
    for (const characterId of scene.characterPresence) {
      const character = this.characters.get(characterId);
      if (character) {
        character.removeScenePresence(id);
      }
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
   * הוספת Arc קיים לגרף
   */
  addArc(arc: Arc): void {
    if (this.arcs.has(arc.id)) {
      throw new Error(`Arc with id ${arc.id} already exists`);
    }

    const validation = arc.validate();
    if (!validation.valid) {
      throw new Error(`Invalid arc: ${validation.errors.join(', ')}`);
    }

    this.arcs.set(arc.id, arc);
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

  // ============ CHARACTER OPERATIONS ============

  /**
   * יצירת דמות חדשה
   */
  createCharacter(data: Omit<CharacterData, 'id'>): Character {
    const id = this.generateId('char');
    const character = new Character(
      id,
      data.name,
      data.description,
      data.role
    );

    // Apply optional fields
    if (data.traits) character.traits = data.traits;
    if (data.relationships) character.relationships = data.relationships;
    if (data.scenePresence) character.scenePresence = data.scenePresence;
    if (data.arcData) character.arcData = data.arcData;

    const validation = character.validate();
    if (!validation.valid) {
      throw new Error(`Invalid character: ${validation.errors.join(', ')}`);
    }

    this.characters.set(id, character);
    return character;
  }

  /**
   * הוספת דמות קיימת לגרף
   */
  addCharacter(character: Character): void {
    if (this.characters.has(character.id)) {
      throw new Error(`Character with id ${character.id} already exists`);
    }

    const validation = character.validate();
    if (!validation.valid) {
      throw new Error(`Invalid character: ${validation.errors.join(', ')}`);
    }

    this.characters.set(character.id, character);
  }

  /**
   * שליפת דמות לפי ID
   */
  getCharacter(id: string): Character | undefined {
    return this.characters.get(id);
  }

  /**
   * שליפת כל הדמויות
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  /**
   * עדכון דמות
   */
  updateCharacter(id: string, updates: Partial<CharacterData>): Character {
    const character = this.characters.get(id);
    if (!character) {
      throw new Error(`Character ${id} not found`);
    }

    character.update(updates);

    const validation = character.validate();
    if (!validation.valid) {
      throw new Error(`Invalid character update: ${validation.errors.join(', ')}`);
    }

    return character;
  }

  /**
   * מחיקת דמות
   * גם מסיר את הדמות מכל הסצנות בהן היא מופיעה
   */
  deleteCharacter(id: string): boolean {
    const character = this.characters.get(id);
    if (!character) {
      return false;
    }

    // הסרת הדמות מכל הסצנות
    for (const sceneId of character.scenePresence) {
      const scene = this.scenes.get(sceneId);
      if (scene) {
        scene.removeCharacter(id);
      }
    }

    // הסרת כל הקשרים עם דמויות אחרות
    for (const otherCharacter of this.characters.values()) {
      otherCharacter.removeRelationship(id);
    }

    return this.characters.delete(id);
  }

  /**
   * הוספת דמות לסצנה
   */
  addCharacterToScene(characterId: string, sceneId: string): void {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    // Bidirectional relationship
    character.addScenePresence(sceneId);
    scene.addCharacter(characterId);
  }

  /**
   * הסרת דמות מסצנה
   */
  removeCharacterFromScene(characterId: string, sceneId: string): void {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    // Bidirectional relationship
    character.removeScenePresence(sceneId);
    scene.removeCharacter(characterId);
  }

  /**
   * קבלת כל הדמויות בסצנה מסוימת
   */
  getCharactersInScene(sceneId: string): Character[] {
    return Array.from(this.characters.values()).filter((char) =>
      char.isInScene(sceneId)
    );
  }

  /**
   * קבלת כל הסצנות בהן דמות מסוימת מופיעה
   */
  getScenesWithCharacter(characterId: string): Scene[] {
    const character = this.characters.get(characterId);
    if (!character) return [];

    return character.scenePresence
      .map((sceneId) => this.scenes.get(sceneId))
      .filter((s): s is Scene => s !== undefined);
  }

  /**
   * יצירת קשר בין שתי דמויות
   */
  createRelationship(
    characterId1: string,
    characterId2: string,
    relationship: { type: any; description?: string; strength: number }
  ): void {
    const char1 = this.characters.get(characterId1);
    const char2 = this.characters.get(characterId2);

    if (!char1 || !char2) {
      throw new Error('Both characters must exist');
    }

    char1.addRelationship({
      characterId: characterId2,
      ...relationship,
    });
  }

  // ============ ARTIFACT OPERATIONS ============

  /**
   * הוספת Artifact קיים לגרף
   */
  addArtifact(artifact: Artifact): void {
    if (this.artifacts.has(artifact.id)) {
      throw new Error(`Artifact with id ${artifact.id} already exists`);
    }

    const validation = artifact.validate();
    if (!validation.valid) {
      throw new Error(`Invalid artifact: ${validation.errors.join(', ')}`);
    }

    this.artifacts.set(artifact.id, artifact);
  }

  /**
   * שליפת Artifact לפי ID
   */
  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * שליפת כל ה-Artifacts
   */
  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * עדכון Artifact
   */
  updateArtifact(id: string, updates: Partial<Omit<Artifact, 'id' | 'metadata'>>): Artifact {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      throw new Error(`Artifact ${id} not found`);
    }

    artifact.update(updates);

    const validation = artifact.validate();
    if (!validation.valid) {
      throw new Error(`Invalid artifact update: ${validation.errors.join(', ')}`);
    }

    return artifact;
  }

  /**
   * מחיקת Artifact
   */
  deleteArtifact(id: string): boolean {
    return this.artifacts.delete(id);
  }

  /**
   * מחיקת כל ה-Artifacts הקשורים לסצנה מסוימת
   */
  deleteArtifactsContainingScene(sceneId: string): number {
    let deletedCount = 0;
    for (const [id, artifact] of this.artifacts.entries()) {
      if (artifact.source.sceneIds?.includes(sceneId)) {
        this.artifacts.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * מחיקת כל ה-Artifacts הקשורים ל-Arc מסוים
   */
  deleteArtifactsContainingArc(arcId: string): number {
    let deletedCount = 0;
    for (const [id, artifact] of this.artifacts.entries()) {
      if (artifact.source.arcIds?.includes(arcId)) {
        this.artifacts.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * מחיקת כל ה-Artifacts הקשורים לדמות מסוימת
   */
  deleteArtifactsContainingCharacter(characterId: string): number {
    let deletedCount = 0;
    for (const [id, artifact] of this.artifacts.entries()) {
      if (artifact.source.characterIds?.includes(characterId)) {
        this.artifacts.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * שליפת כל ה-Artifacts שמכילים סצנה מסוימת
   */
  getArtifactsContainingScene(sceneId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter((artifact) =>
      artifact.source.sceneIds?.includes(sceneId)
    );
  }

  /**
   * שליפת כל ה-Artifacts שמכילים Arc מסוים
   */
  getArtifactsContainingArc(arcId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter((artifact) =>
      artifact.source.arcIds?.includes(arcId)
    );
  }

  /**
   * שליפת כל ה-Artifacts שמכילים דמות מסוימת
   */
  getArtifactsContainingCharacter(characterId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter((artifact) =>
      artifact.source.characterIds?.includes(characterId)
    );
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
      characters: Array.from(this.characters.values()).map((c) => c.toJSON()),
      artifacts: Array.from(this.artifacts.values()).map((a) => a.toJSON()),
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
    this.characters.clear();
    this.artifacts.clear();

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

    // טעינת דמויות
    if (snapshot.characters) {
      for (const characterData of snapshot.characters) {
        const character = Character.fromJSON(characterData);
        this.characters.set(character.id, character);
      }
    }

    // טעינת Artifacts
    if (snapshot.artifacts) {
      for (const artifactData of snapshot.artifacts) {
        const artifact = Artifact.fromJSON(artifactData);
        this.artifacts.set(artifact.id, artifact);
      }
    }
  }

  /**
   * ניקוי הגרף
   */
  clear(): void {
    this.scenes.clear();
    this.arcs.clear();
    this.characters.clear();
    this.artifacts.clear();
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
    characterCount: number;
    artifactCount: number;
    totalCost: number;
    avgScenePerArc: number;
  } {
    const sceneCount = this.scenes.size;
    const arcCount = this.arcs.size;
    const characterCount = this.characters.size;
    const artifactCount = this.artifacts.size;
    const totalCost = this.getTotalCost();

    let totalScenes = 0;
    for (const arc of this.arcs.values()) {
      totalScenes += arc.scenes.length;
    }
    const avgScenePerArc = arcCount > 0 ? totalScenes / arcCount : 0;

    return {
      sceneCount,
      arcCount,
      characterCount,
      artifactCount,
      totalCost,
      avgScenePerArc,
    };
  }

  // ============ COHERENCE CHECKING ============

  /**
   * בדיקת קוהרנטיות הגרף
   * מחזיר דוח מפורט על בעיות ואזהרות
   */
  checkCoherence(): CoherenceReport {
    const solver = new CoherenceSolver();
    return solver.checkCoherence(this);
  }

  /**
   * האם הגרף קוהרנטי?
   * @returns true אם אין שגיאות קריטיות
   */
  isCoherent(): boolean {
    const report = this.checkCoherence();
    return report.coherent;
  }

  /**
   * קבלת רשימת בעיות בגרף
   * @returns מערך של בעיות קוהרנטיות
   */
  getCoherenceIssues(): CoherenceReport {
    return this.checkCoherence();
  }
}
