/**
 * Character - ייצוג דמות בסיפור
 *
 * כל דמות מכילה:
 * - id: מזהה ייחודי
 * - name: שם הדמות
 * - description: תיאור הדמות
 * - role: תפקיד בסיפור (protagonist, antagonist, supporting, etc.)
 * - traits: תכונות אופי
 * - relationships: קשרים עם דמויות אחרות
 * - scenePresence: סצנות בהן הדמות מופיעה
 * - arcData: מידע על קשת האופי
 */

export type CharacterRole =
  | 'protagonist'
  | 'antagonist'
  | 'supporting'
  | 'mentor'
  | 'foil'
  | 'comic-relief'
  | 'love-interest'
  | 'other';

export type RelationType =
  | 'ally'
  | 'enemy'
  | 'family'
  | 'romantic'
  | 'mentor-student'
  | 'rival'
  | 'neutral';

export interface Relationship {
  characterId: string;
  type: RelationType;
  description?: string;
  strength: number; // 1-10 scale
}

export interface CharacterArc {
  startingState: string;
  currentState?: string;
  desiredEndState: string;
  turningPoints: Array<{
    sceneId: string;
    description: string;
    timestamp: Date;
  }>;
}

export interface CharacterData {
  id: string;
  name: string;
  description: string;
  role: CharacterRole;
  traits: string[];
  relationships: Relationship[];
  scenePresence: string[];
  arcData?: CharacterArc;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };
}

export class Character {
  id: string;
  name: string;
  description: string;
  role: CharacterRole;
  traits: string[];
  relationships: Relationship[];
  scenePresence: string[];
  arcData?: CharacterArc;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };

  constructor(
    id: string,
    name: string,
    description: string,
    role: CharacterRole = 'other'
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.role = role;
    this.traits = [];
    this.relationships = [];
    this.scenePresence = [];
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * הוספת תכונת אופי
   */
  addTrait(trait: string): void {
    if (!this.traits.includes(trait)) {
      this.traits.push(trait);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הסרת תכונת אופי
   */
  removeTrait(trait: string): void {
    const index = this.traits.indexOf(trait);
    if (index > -1) {
      this.traits.splice(index, 1);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הוספת קשר עם דמות אחרת
   */
  addRelationship(relationship: Relationship): void {
    // Remove existing relationship with same character if exists
    this.relationships = this.relationships.filter(
      r => r.characterId !== relationship.characterId
    );
    this.relationships.push(relationship);
    this.metadata.updatedAt = new Date();
  }

  /**
   * הסרת קשר עם דמות
   */
  removeRelationship(characterId: string): void {
    this.relationships = this.relationships.filter(
      r => r.characterId !== characterId
    );
    this.metadata.updatedAt = new Date();
  }

  /**
   * עדכון קשר קיים
   */
  updateRelationship(characterId: string, updates: Partial<Relationship>): void {
    const relationship = this.relationships.find(r => r.characterId === characterId);
    if (relationship) {
      Object.assign(relationship, updates);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הוספת נוכחות בסצנה
   */
  addScenePresence(sceneId: string): void {
    if (!this.scenePresence.includes(sceneId)) {
      this.scenePresence.push(sceneId);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הסרת נוכחות בסצנה
   */
  removeScenePresence(sceneId: string): void {
    const index = this.scenePresence.indexOf(sceneId);
    if (index > -1) {
      this.scenePresence.splice(index, 1);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * בדיקה אם הדמות מופיעה בסצנה
   */
  isInScene(sceneId: string): boolean {
    return this.scenePresence.includes(sceneId);
  }

  /**
   * יצירת או עדכון קשת אופי
   */
  setArc(arc: CharacterArc): void {
    this.arcData = arc;
    this.metadata.updatedAt = new Date();
  }

  /**
   * הוספת נקודת מפנה בקשת האופי
   */
  addTurningPoint(sceneId: string, description: string): void {
    if (!this.arcData) {
      throw new Error('Character arc must be initialized before adding turning points');
    }
    this.arcData.turningPoints.push({
      sceneId,
      description,
      timestamp: new Date(),
    });
    this.metadata.updatedAt = new Date();
  }

  /**
   * עדכון מצב נוכחי בקשת האופי
   */
  updateArcState(currentState: string): void {
    if (!this.arcData) {
      throw new Error('Character arc must be initialized before updating state');
    }
    this.arcData.currentState = currentState;
    this.metadata.updatedAt = new Date();
  }

  /**
   * עדכון תוכן הדמות
   */
  update(updates: Partial<CharacterData>): void {
    if (updates.name) this.name = updates.name;
    if (updates.description) this.description = updates.description;
    if (updates.role) this.role = updates.role;
    if (updates.traits) this.traits = updates.traits;
    if (updates.relationships) this.relationships = updates.relationships;
    if (updates.scenePresence) this.scenePresence = updates.scenePresence;
    if (updates.arcData) this.arcData = updates.arcData;

    this.metadata.updatedAt = new Date();
  }

  /**
   * בדיקת תקינות בסיסית
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id || this.id.trim() === '') {
      errors.push('Character must have a valid ID');
    }
    if (!this.name || this.name.trim() === '') {
      errors.push('Character must have a name');
    }
    if (!this.description || this.description.trim() === '') {
      errors.push('Character must have a description');
    }

    // Validate relationship strengths
    for (const rel of this.relationships) {
      if (rel.strength < 1 || rel.strength > 10) {
        errors.push(`Relationship with ${rel.characterId} has invalid strength (must be 1-10)`);
      }
    }

    // Validate arc data if present
    if (this.arcData) {
      if (!this.arcData.startingState || this.arcData.startingState.trim() === '') {
        errors.push('Character arc must have a starting state');
      }
      if (!this.arcData.desiredEndState || this.arcData.desiredEndState.trim() === '') {
        errors.push('Character arc must have a desired end state');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * קבלת סטטיסטיקות על הדמות
   */
  getStats(): {
    sceneCount: number;
    relationshipCount: number;
    traitCount: number;
    turningPointCount: number;
  } {
    return {
      sceneCount: this.scenePresence.length,
      relationshipCount: this.relationships.length,
      traitCount: this.traits.length,
      turningPointCount: this.arcData?.turningPoints.length || 0,
    };
  }

  /**
   * המרה ל-JSON
   */
  toJSON(): CharacterData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      role: this.role,
      traits: this.traits,
      relationships: this.relationships,
      scenePresence: this.scenePresence,
      arcData: this.arcData,
      metadata: this.metadata,
    };
  }

  /**
   * יצירת Character מ-JSON
   */
  static fromJSON(data: CharacterData): Character {
    const character = new Character(
      data.id,
      data.name,
      data.description,
      data.role
    );

    if (data.traits) {
      character.traits = data.traits;
    }
    if (data.relationships) {
      character.relationships = data.relationships;
    }
    if (data.scenePresence) {
      character.scenePresence = data.scenePresence;
    }
    if (data.arcData) {
      character.arcData = {
        ...data.arcData,
        turningPoints: data.arcData.turningPoints.map(tp => ({
          ...tp,
          timestamp: new Date(tp.timestamp),
        })),
      };
    }
    if (data.metadata) {
      character.metadata = {
        ...data.metadata,
        createdAt: new Date(data.metadata.createdAt),
        updatedAt: new Date(data.metadata.updatedAt),
      };
    }

    return character;
  }
}
