/**
 * Snapshot Manager (Sprint 2)
 *
 * מנהל Snapshots אוטומטיים לפני פעולות קריטיות
 * מאפשר rollback במקרה של שגיאה
 */

import { GraphDB, GraphSnapshot } from './GraphDB';

export interface SnapshotMetadata {
  id: string;
  timestamp: Date;
  reason: string;
  witness?: string;
  operation?: string;
  automatic: boolean;
}

export interface StoredSnapshot {
  metadata: SnapshotMetadata;
  snapshot: GraphSnapshot;
}

export class SnapshotManager {
  private snapshots: StoredSnapshot[];
  private maxSnapshots: number;
  private autoSnapshotEnabled: boolean;

  constructor(maxSnapshots: number = 10) {
    this.snapshots = [];
    this.maxSnapshots = maxSnapshots;
    this.autoSnapshotEnabled = true;
  }

  /**
   * יצירת Snapshot אוטומטי לפני פעולה קריטית
   *
   * @param graph - GraphDB instance
   * @param operation - שם הפעולה
   * @param witness - עד לפעולה (אופציונלי)
   */
  createAutoSnapshot(
    graph: GraphDB,
    operation: string,
    witness?: string
  ): SnapshotMetadata {
    if (!this.autoSnapshotEnabled) {
      throw new Error('Automatic snapshots are disabled');
    }

    const metadata: SnapshotMetadata = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      reason: `Automatic snapshot before ${operation}`,
      witness,
      operation,
      automatic: true,
    };

    const snapshot = graph.createSnapshot();

    this.storeSnapshot({ metadata, snapshot });

    return metadata;
  }

  /**
   * יצירת Snapshot ידני
   *
   * @param graph - GraphDB instance
   * @param reason - סיבה ליצירת ה-Snapshot
   * @param witness - עד (אופציונלי)
   */
  createManualSnapshot(
    graph: GraphDB,
    reason: string,
    witness?: string
  ): SnapshotMetadata {
    const metadata: SnapshotMetadata = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      reason,
      witness,
      automatic: false,
    };

    const snapshot = graph.createSnapshot();

    this.storeSnapshot({ metadata, snapshot });

    return metadata;
  }

  /**
   * שחזור מ-Snapshot
   *
   * @param snapshotId - ID של ה-Snapshot
   * @param graph - GraphDB instance
   */
  rollback(snapshotId: string, graph: GraphDB): void {
    const stored = this.snapshots.find((s) => s.metadata.id === snapshotId);

    if (!stored) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    graph.loadSnapshot(stored.snapshot);
  }

  /**
   * שחזור ל-Snapshot האחרון
   *
   * @param graph - GraphDB instance
   */
  rollbackToLast(graph: GraphDB): SnapshotMetadata | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    this.rollback(lastSnapshot.metadata.id, graph);

    return lastSnapshot.metadata;
  }

  /**
   * שחזור ל-Snapshot לפי אינדקס (0 = הכי ישן, -1 = הכי חדש)
   *
   * @param index - אינדקס ה-Snapshot
   * @param graph - GraphDB instance
   */
  rollbackToIndex(index: number, graph: GraphDB): SnapshotMetadata {
    if (index < 0) {
      index = this.snapshots.length + index;
    }

    if (index < 0 || index >= this.snapshots.length) {
      throw new Error(`Snapshot index ${index} out of bounds`);
    }

    const snapshot = this.snapshots[index];
    this.rollback(snapshot.metadata.id, graph);

    return snapshot.metadata;
  }

  /**
   * אחסון Snapshot עם ניהול גודל מקסימלי
   */
  private storeSnapshot(stored: StoredSnapshot): void {
    this.snapshots.push(stored);

    // מחיקת Snapshots ישנים אם עברנו את המקסימום
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * יצירת ID ייחודי ל-Snapshot
   */
  private generateSnapshotId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `snapshot-${timestamp}-${random}`;
  }

  /**
   * קבלת כל ה-Snapshots
   */
  listSnapshots(): SnapshotMetadata[] {
    return this.snapshots.map((s) => s.metadata);
  }

  /**
   * קבלת Snapshot לפי ID
   */
  getSnapshot(snapshotId: string): StoredSnapshot | undefined {
    return this.snapshots.find((s) => s.metadata.id === snapshotId);
  }

  /**
   * מחיקת Snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    const index = this.snapshots.findIndex((s) => s.metadata.id === snapshotId);

    if (index === -1) {
      return false;
    }

    this.snapshots.splice(index, 1);
    return true;
  }

  /**
   * מחיקת כל ה-Snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * קבלת מספר ה-Snapshots
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * הפעלה/כיבוי של Snapshots אוטומטיים
   */
  setAutoSnapshotEnabled(enabled: boolean): void {
    this.autoSnapshotEnabled = enabled;
  }

  /**
   * האם Snapshots אוטומטיים מופעלים?
   */
  isAutoSnapshotEnabled(): boolean {
    return this.autoSnapshotEnabled;
  }

  /**
   * עדכון מספר Snapshots מקסימלי
   */
  setMaxSnapshots(max: number): void {
    if (max < 1) {
      throw new Error('Max snapshots must be at least 1');
    }

    this.maxSnapshots = max;

    // מחיקת Snapshots עודפים
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * קבלת מספר Snapshots מקסימלי
   */
  getMaxSnapshots(): number {
    return this.maxSnapshots;
  }
}
