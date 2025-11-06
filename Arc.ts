/**
 * Arc - קשת עלילתית המחברת מספר סצנות
 * 
 * Arc מייצג רצף של סצנות שמתארות התפתחות עלילתית אחת.
 * כל Arc מכיל:
 * - id: מזהה ייחודי
 * - intent: הכוונה העלילתית (מה ה-Arc משיג)
 * - scenes: רשימת ID-ים של סצנות לפי סדר
 */

export interface ArcData {
  id: string;
  intent: string;
  scenes: string[];
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    status?: 'draft' | 'active' | 'completed' | 'archived';
    priority?: number;
  };
}

export class Arc {
  id: string;
  intent: string;
  scenes: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    priority: number;
  };

  constructor(id: string, intent: string) {
    this.id = id;
    this.intent = intent;
    this.scenes = [];
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      priority: 0,
    };
  }

  /**
   * הוספת סצנה ל-Arc
   * @param sceneId - ID של הסצנה להוספה
   * @param position - מיקום בסדר (אופציונלי, ברירת מחדל: סוף)
   */
  addScene(sceneId: string, position?: number): void {
    if (this.scenes.includes(sceneId)) {
      throw new Error(`Scene ${sceneId} already exists in Arc ${this.id}`);
    }

    if (position !== undefined && position >= 0 && position <= this.scenes.length) {
      this.scenes.splice(position, 0, sceneId);
    } else {
      this.scenes.push(sceneId);
    }

    this.metadata.updatedAt = new Date();
  }

  /**
   * הסרת סצנה מ-Arc
   */
  removeScene(sceneId: string): boolean {
    const index = this.scenes.indexOf(sceneId);
    if (index > -1) {
      this.scenes.splice(index, 1);
      this.metadata.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * שינוי סדר סצנות
   * @param fromIndex - מיקום מקור
   * @param toIndex - מיקום יעד
   */
  reorderScene(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.scenes.length ||
      toIndex < 0 ||
      toIndex >= this.scenes.length
    ) {
      throw new Error('Invalid scene indices');
    }

    const [removed] = this.scenes.splice(fromIndex, 1);
    this.scenes.splice(toIndex, 0, removed);
    this.metadata.updatedAt = new Date();
  }

  /**
   * עדכון intent
   */
  updateIntent(newIntent: string): void {
    this.intent = newIntent;
    this.metadata.updatedAt = new Date();
  }

  /**
   * עדכון סטטוס
   */
  updateStatus(status: 'draft' | 'active' | 'completed' | 'archived'): void {
    this.metadata.status = status;
    this.metadata.updatedAt = new Date();
  }

  /**
   * בדיקת תקינות
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id || this.id.trim() === '') {
      errors.push('Arc must have a valid ID');
    }
    if (!this.intent || this.intent.trim() === '') {
      errors.push('Arc must have an intent');
    }
    if (this.scenes.length === 0) {
      errors.push('Arc must contain at least one scene');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * חישוב עלות כוללת של ה-Arc
   * (דורש גישה ל-Scene objects, מוחזר כ-placeholder)
   */
  getTotalCost(sceneMap?: Map<string, any>): number {
    if (!sceneMap) return 0;
    
    return this.scenes.reduce((total, sceneId) => {
      const scene = sceneMap.get(sceneId);
      return total + (scene?.cost || 0);
    }, 0);
  }

  /**
   * המרה ל-JSON
   */
  toJSON(): ArcData {
    return {
      id: this.id,
      intent: this.intent,
      scenes: this.scenes,
      metadata: this.metadata,
    };
  }

  /**
   * יצירת Arc מ-JSON
   */
  static fromJSON(data: ArcData): Arc {
    const arc = new Arc(data.id, data.intent);
    arc.scenes = data.scenes || [];
    
    if (data.metadata) {
      arc.metadata = {
        ...data.metadata,
        createdAt: new Date(data.metadata.createdAt),
        updatedAt: new Date(data.metadata.updatedAt),
        status: data.metadata.status || 'draft',
        priority: data.metadata.priority || 0,
      };
    }

    return arc;
  }
}
