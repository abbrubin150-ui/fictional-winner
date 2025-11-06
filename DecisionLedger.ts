/**
 * DecisionLedger - יומן החלטות עם Witness חתום
 * 
 * רושם כל החלטה קריטית במערכת עם:
 * - החלטה (EXECUTE/ROLLBACK/STOP)
 * - רציונל (למה ההחלטה התקבלה)
 * - Witness (עד מוסרי שחתם על ההחלטה)
 * - תוקף (expiry)
 */

export type DecisionType = 'EXECUTE' | 'ROLLBACK' | 'STOP' | 'MERGE' | 'BRANCH';

export interface DecisionEntry {
  id: string;
  decision: DecisionType;
  rationale: string;
  witness: string;
  timestamp: Date;
  expiry?: Date;
  context?: {
    action?: string;
    sceneId?: string;
    arcId?: string;
    deltaRate?: number;
    mirrorDrift?: number;
  };
  metadata?: {
    signature?: string;
    verified?: boolean;
  };
}

export class DecisionLedger {
  private entries: DecisionEntry[];
  private witnessRegistry: Map<string, string>; // witness name -> role/description

  constructor() {
    this.entries = [];
    this.witnessRegistry = new Map();
    
    // רישום Witnesses ברירת מחדל
    this.registerWitness('Role Model a', 'Moral witness and ethical anchor');
    this.registerWitness('∴Auditor', 'Runtime auditor and control system');
  }

  /**
   * רישום Witness חדש
   */
  registerWitness(name: string, description: string): void {
    this.witnessRegistry.set(name, description);
  }

  /**
   * בדיקה אם Witness רשום
   */
  isWitnessRegistered(name: string): boolean {
    return this.witnessRegistry.has(name);
  }

  /**
   * יצירת החלטה חדשה
   */
  recordDecision(
    decision: DecisionType,
    rationale: string,
    witness: string,
    context?: DecisionEntry['context'],
    expiryDays?: number
  ): DecisionEntry {
    // בדיקת Witness
    if (!this.isWitnessRegistered(witness)) {
      throw new Error(`Witness "${witness}" is not registered`);
    }

    // חישוב תוקף
    const expiry = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : undefined;

    const entry: DecisionEntry = {
      id: this.generateDecisionId(),
      decision,
      rationale,
      witness,
      timestamp: new Date(),
      expiry,
      context,
      metadata: {
        verified: true,
      },
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * שליפת החלטה לפי ID
   */
  getDecision(id: string): DecisionEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  /**
   * שליפת כל ההחלטות
   */
  getAllDecisions(): DecisionEntry[] {
    return [...this.entries];
  }

  /**
   * סינון החלטות לפי סוג
   */
  getDecisionsByType(type: DecisionType): DecisionEntry[] {
    return this.entries.filter((e) => e.decision === type);
  }

  /**
   * סינון החלטות לפי Witness
   */
  getDecisionsByWitness(witness: string): DecisionEntry[] {
    return this.entries.filter((e) => e.witness === witness);
  }

  /**
   * שליפת החלטות פעילות (לא פג תוקפן)
   */
  getActiveDecisions(): DecisionEntry[] {
    const now = new Date();
    return this.entries.filter(
      (e) => !e.expiry || e.expiry > now
    );
  }

  /**
   * שליפת החלטות שפג תוקפן
   */
  getExpiredDecisions(): DecisionEntry[] {
    const now = new Date();
    return this.entries.filter(
      (e) => e.expiry && e.expiry <= now
    );
  }

  /**
   * ביטול/עדכון החלטה
   * רק אם ה-Witness שחתם מאשר
   */
  updateDecision(
    id: string,
    witness: string,
    updates: Partial<Pick<DecisionEntry, 'rationale' | 'expiry' | 'context'>>
  ): DecisionEntry {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) {
      throw new Error(`Decision ${id} not found`);
    }

    if (entry.witness !== witness) {
      throw new Error(`Only witness "${entry.witness}" can update this decision`);
    }

    if (updates.rationale) entry.rationale = updates.rationale;
    if (updates.expiry) entry.expiry = updates.expiry;
    if (updates.context) {
      entry.context = { ...entry.context, ...updates.context };
    }

    return entry;
  }

  /**
   * ניקוי החלטות שפג תוקפן
   */
  cleanExpiredDecisions(): number {
    const before = this.entries.length;
    const now = new Date();
    this.entries = this.entries.filter(
      (e) => !e.expiry || e.expiry > now
    );
    return before - this.entries.length;
  }

  /**
   * בדיקת תקינות: האם יש STOP פעיל?
   */
  hasActiveStop(): boolean {
    return this.getActiveDecisions().some((e) => e.decision === 'STOP');
  }

  /**
   * בדיקת ΔDIA_Rate מהחלטות אחרונות
   */
  getRecentDeltaRate(withinMinutes: number = 60): number[] {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    
    return this.entries
      .filter((e) => e.timestamp >= cutoff && e.context?.deltaRate !== undefined)
      .map((e) => e.context!.deltaRate!);
  }

  /**
   * סטטיסטיקות
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
    byType: Record<DecisionType, number>;
    byWitness: Record<string, number>;
  } {
    const active = this.getActiveDecisions().length;
    const expired = this.getExpiredDecisions().length;

    const byType: Record<string, number> = {};
    const byWitness: Record<string, number> = {};

    for (const entry of this.entries) {
      byType[entry.decision] = (byType[entry.decision] || 0) + 1;
      byWitness[entry.witness] = (byWitness[entry.witness] || 0) + 1;
    }

    return {
      total: this.entries.length,
      active,
      expired,
      byType: byType as Record<DecisionType, number>,
      byWitness,
    };
  }

  /**
   * ייצוא ל-YAML format
   */
  exportToYAML(): string {
    const lines: string[] = [];
    
    for (const entry of this.entries) {
      lines.push(`- id: ${entry.id}`);
      lines.push(`  decision: ${entry.decision}`);
      lines.push(`  rationale: "${entry.rationale}"`);
      lines.push(`  witness: "${entry.witness}"`);
      lines.push(`  timestamp: ${entry.timestamp.toISOString()}`);
      if (entry.expiry) {
        lines.push(`  expiry: ${entry.expiry.toISOString()}`);
      }
      if (entry.context) {
        lines.push(`  context:`);
        for (const [key, value] of Object.entries(entry.context)) {
          lines.push(`    ${key}: ${value}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * יצירת Decision ID
   */
  private generateDecisionId(): string {
    const count = this.entries.length + 1;
    return `L-${String(count).padStart(4, '0')}`;
  }

  /**
   * ניקוי הלוג
   */
  clear(): void {
    this.entries = [];
  }
}
