/**
 * Scene - ייצוג סצנה בגרף העלילה
 * 
 * כל סצנה מכילה:
 * - id: מזהה ייחודי
 * - title: כותרת הסצנה
 * - premise: הנחת יסוד (מה קורה)
 * - why: למה הסצנה הזו קיימת (מטרה נרטיבית)
 * - how: איך הסצנה מתבצעת (ביצוע טכני)
 * - cost: עלות נרטיבית (complexity/risk)
 * - links: קישורים לסצנות אחרות
 */

export interface SceneData {
  id: string;
  title: string;
  premise: string;
  why: string;
  how: string;
  cost: number;
  links?: string[];
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };
}

export class Scene {
  id: string;
  title: string;
  premise: string;
  why: string;
  how: string;
  cost: number;
  links: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };

  constructor(
    id: string,
    title: string,
    premise: string,
    why: string,
    how: string,
    cost: number
  ) {
    this.id = id;
    this.title = title;
    this.premise = premise;
    this.why = why;
    this.how = how;
    this.cost = cost;
    this.links = [];
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * הוספת קישור לסצנה אחרת
   */
  addLink(targetSceneId: string): void {
    if (!this.links.includes(targetSceneId)) {
      this.links.push(targetSceneId);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הסרת קישור
   */
  removeLink(targetSceneId: string): void {
    const index = this.links.indexOf(targetSceneId);
    if (index > -1) {
      this.links.splice(index, 1);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * עדכון תוכן הסצנה
   */
  update(updates: Partial<SceneData>): void {
    if (updates.title) this.title = updates.title;
    if (updates.premise) this.premise = updates.premise;
    if (updates.why) this.why = updates.why;
    if (updates.how) this.how = updates.how;
    if (updates.cost !== undefined) this.cost = updates.cost;
    if (updates.links) this.links = updates.links;
    
    this.metadata.updatedAt = new Date();
  }

  /**
   * בדיקת תקינות בסיסית
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id || this.id.trim() === '') {
      errors.push('Scene must have a valid ID');
    }
    if (!this.title || this.title.trim() === '') {
      errors.push('Scene must have a title');
    }
    if (!this.premise || this.premise.trim() === '') {
      errors.push('Scene must have a premise');
    }
    if (this.cost < 0) {
      errors.push('Scene cost cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * המרה ל-JSON
   */
  toJSON(): SceneData {
    return {
      id: this.id,
      title: this.title,
      premise: this.premise,
      why: this.why,
      how: this.how,
      cost: this.cost,
      links: this.links,
      metadata: this.metadata,
    };
  }

  /**
   * יצירת Scene מ-JSON
   */
  static fromJSON(data: SceneData): Scene {
    const scene = new Scene(
      data.id,
      data.title,
      data.premise,
      data.why,
      data.how,
      data.cost
    );
    
    if (data.links) {
      scene.links = data.links;
    }
    if (data.metadata) {
      scene.metadata = {
        ...data.metadata,
        createdAt: new Date(data.metadata.createdAt),
        updatedAt: new Date(data.metadata.updatedAt),
      };
    }

    return scene;
  }
}
