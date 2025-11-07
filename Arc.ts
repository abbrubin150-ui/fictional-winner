/**
 * Arc - קשת עלילתית המחברת מספר סצנות
 *
 * Arc מייצג רצף של סצנות שמתארות התפתחות עלילתית אחת.
 * כל Arc מכיל:
 * - id: מזהה ייחודי
 * - intent: הכוונה העלילתית (מה ה-Arc משיג)
 * - scenes: רשימת ID-ים של סצנות לפי סדר
 * - aridFlow: מבנה A.R.I.D-5 (Sprint 3)
 */

export type AridPhase = 'anchor' | 'rise' | 'impact' | 'descent';

export interface AridBeat {
  phase: AridPhase;
  sceneId: string;
  description: string;
  timestamp: Date;
}

export interface AridFlow {
  anchor: string[]; // Scene IDs for establishing the arc
  rise: string[]; // Scene IDs for building tension
  impact: string[]; // Scene IDs for climax
  descent: string[]; // Scene IDs for resolution
  fiveBeat?: {
    beat1: string; // Opening - establish status quo
    beat2: string; // Inciting incident - disruption
    beat3: string; // Midpoint - point of no return
    beat4: string; // Crisis - dark night of the soul
    beat5: string; // Resolution - new equilibrium
  };
}

export interface ArcData {
  id: string;
  intent: string;
  scenes: string[];
  aridFlow?: AridFlow;
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
  aridFlow?: AridFlow;
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
   * יצירת A.R.I.D Flow למבנה הקשת
   */
  initializeAridFlow(): void {
    this.aridFlow = {
      anchor: [],
      rise: [],
      impact: [],
      descent: [],
    };
    this.metadata.updatedAt = new Date();
  }

  /**
   * הוספת סצנה לפאזה ב-A.R.I.D Flow
   */
  addToAridPhase(phase: AridPhase, sceneId: string): void {
    if (!this.aridFlow) {
      this.initializeAridFlow();
    }

    if (!this.scenes.includes(sceneId)) {
      throw new Error(`Scene ${sceneId} is not part of this arc`);
    }

    if (!this.aridFlow![phase].includes(sceneId)) {
      this.aridFlow![phase].push(sceneId);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הסרת סצנה מפאזה ב-A.R.I.D Flow
   */
  removeFromAridPhase(phase: AridPhase, sceneId: string): void {
    if (!this.aridFlow) return;

    const index = this.aridFlow[phase].indexOf(sceneId);
    if (index > -1) {
      this.aridFlow[phase].splice(index, 1);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * הגדרת Five-Beat Structure
   */
  setFiveBeat(beat1: string, beat2: string, beat3: string, beat4: string, beat5: string): void {
    if (!this.aridFlow) {
      this.initializeAridFlow();
    }

    // Validate all beats are in scenes
    const beats = [beat1, beat2, beat3, beat4, beat5];
    for (const beat of beats) {
      if (!this.scenes.includes(beat)) {
        throw new Error(`Scene ${beat} is not part of this arc`);
      }
    }

    this.aridFlow!.fiveBeat = { beat1, beat2, beat3, beat4, beat5 };
    this.metadata.updatedAt = new Date();
  }

  /**
   * בדיקת תקינות A.R.I.D Flow
   */
  validateAridFlow(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.aridFlow) {
      return { valid: true, errors }; // Optional feature
    }

    // Check that all ARID scenes are in the arc
    const allAridScenes = [
      ...this.aridFlow.anchor,
      ...this.aridFlow.rise,
      ...this.aridFlow.impact,
      ...this.aridFlow.descent,
    ];

    for (const sceneId of allAridScenes) {
      if (!this.scenes.includes(sceneId)) {
        errors.push(`ARID Flow references scene ${sceneId} not in arc`);
      }
    }

    // Check five-beat if defined
    if (this.aridFlow.fiveBeat) {
      const beats = Object.values(this.aridFlow.fiveBeat);
      for (const beat of beats) {
        if (!this.scenes.includes(beat)) {
          errors.push(`Five-beat references scene ${beat} not in arc`);
        }
      }

      // Check that beats are in temporal order
      const beatIndices = beats.map(b => this.scenes.indexOf(b));
      for (let i = 1; i < beatIndices.length; i++) {
        if (beatIndices[i] <= beatIndices[i - 1]) {
          errors.push('Five-beat structure must follow scene order');
          break;
        }
      }
    }

    // Validate that phases follow logical order
    if (this.aridFlow.anchor.length > 0 && this.aridFlow.impact.length > 0) {
      const firstAnchor = this.scenes.indexOf(this.aridFlow.anchor[0]);
      const firstImpact = this.scenes.indexOf(this.aridFlow.impact[0]);
      if (firstImpact <= firstAnchor) {
        errors.push('Impact phase should come after Anchor phase');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
      aridFlow: this.aridFlow,
      metadata: this.metadata,
    };
  }

  /**
   * יצירת Arc מ-JSON
   */
  static fromJSON(data: ArcData): Arc {
    const arc = new Arc(data.id, data.intent);
    arc.scenes = data.scenes || [];
    arc.aridFlow = data.aridFlow;

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
