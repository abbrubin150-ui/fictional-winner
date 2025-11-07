/**
 * Timeline Manager (Sprint 3)
 *
 * מנהל ציר זמן ועקביות טמפורלית בנרטיב
 *
 * תכונות:
 * - ניהול טיימליינים מרובים (main, flashback, flash-forward, alternate)
 * - זיהוי פרדוקסים טמפורליים
 * - בדיקת עקביות נוכחות דמויות
 * - תמיכה ב-flashback ו-flash-forward
 * - ולידציה של רצף אירועים
 */

import { GraphDB } from './GraphDB';

export type TimelineType = 'main' | 'flashback' | 'flash-forward' | 'alternate' | 'dream' | 'parallel';

export interface TimePoint {
  sceneId: string;
  timestamp: number; // Relative time in story (e.g., minutes, days, arbitrary units)
  timelineId: string;
  description?: string;
  metadata?: {
    dayInStory?: number;
    timeOfDay?: string; // e.g., "morning", "afternoon", "night"
    location?: string;
  };
}

export interface Timeline {
  id: string;
  name: string;
  type: TimelineType;
  timePoints: TimePoint[];
  parentTimelineId?: string; // For flashbacks/flash-forwards reference
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    description?: string;
  };
}

export interface TemporalIssue {
  type: 'paradox' | 'sequence_violation' | 'character_presence' | 'timeline_overlap' | 'orphaned_timepoint';
  severity: 'error' | 'warning';
  message: string;
  affectedScenes: string[];
  affectedCharacters?: string[];
  timelineIds?: string[];
}

export interface TemporalReport {
  consistent: boolean;
  issues: TemporalIssue[];
  warnings: string[];
  stats: {
    timelinesChecked: number;
    timePointsChecked: number;
    scenesInTimelines: number;
  };
}

export class TimelineManager {
  private timelines: Map<string, Timeline>;
  private sceneToTimeline: Map<string, string[]>; // Scene can be in multiple timelines

  constructor() {
    this.timelines = new Map();
    this.sceneToTimeline = new Map();
  }

  /**
   * יצירת טיימליין חדש
   */
  createTimeline(
    id: string,
    name: string,
    type: TimelineType = 'main',
    parentTimelineId?: string
  ): Timeline {
    if (this.timelines.has(id)) {
      throw new Error(`Timeline with id "${id}" already exists`);
    }

    const timeline: Timeline = {
      id,
      name,
      type,
      timePoints: [],
      parentTimelineId,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    this.timelines.set(id, timeline);
    return timeline;
  }

  /**
   * הוספת נקודת זמן לטיימליין
   */
  addTimePoint(timelineId: string, timePoint: TimePoint): void {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline "${timelineId}" not found`);
    }

    // Check if scene already exists in this timeline
    const existingIndex = timeline.timePoints.findIndex(tp => tp.sceneId === timePoint.sceneId);
    if (existingIndex >= 0) {
      throw new Error(`Scene "${timePoint.sceneId}" already exists in timeline "${timelineId}"`);
    }

    timeline.timePoints.push(timePoint);

    // Sort by timestamp
    timeline.timePoints.sort((a, b) => a.timestamp - b.timestamp);

    // Update scene-to-timeline mapping
    const timelineIds = this.sceneToTimeline.get(timePoint.sceneId) || [];
    if (!timelineIds.includes(timelineId)) {
      timelineIds.push(timelineId);
      this.sceneToTimeline.set(timePoint.sceneId, timelineIds);
    }

    if (timeline.metadata) {
      timeline.metadata.updatedAt = new Date();
    }
  }

  /**
   * הסרת נקודת זמן מטיימליין
   */
  removeTimePoint(timelineId: string, sceneId: string): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return false;
    }

    const index = timeline.timePoints.findIndex(tp => tp.sceneId === sceneId);
    if (index < 0) {
      return false;
    }

    timeline.timePoints.splice(index, 1);

    // Update scene-to-timeline mapping
    const timelineIds = this.sceneToTimeline.get(sceneId);
    if (timelineIds) {
      const tlIndex = timelineIds.indexOf(timelineId);
      if (tlIndex >= 0) {
        timelineIds.splice(tlIndex, 1);
        if (timelineIds.length === 0) {
          this.sceneToTimeline.delete(sceneId);
        }
      }
    }

    if (timeline.metadata) {
      timeline.metadata.updatedAt = new Date();
    }

    return true;
  }

  /**
   * קבלת טיימליין לפי ID
   */
  getTimeline(timelineId: string): Timeline | undefined {
    return this.timelines.get(timelineId);
  }

  /**
   * קבלת כל הטיימליינים
   */
  getAllTimelines(): Timeline[] {
    return Array.from(this.timelines.values());
  }

  /**
   * קבלת טיימליינים בהם סצנה מופיעה
   */
  getTimelinesForScene(sceneId: string): string[] {
    return this.sceneToTimeline.get(sceneId) || [];
  }

  /**
   * בדיקת עקביות טמפורלית מלאה
   */
  validateTemporalConsistency(graph: GraphDB): TemporalReport {
    const issues: TemporalIssue[] = [];
    const warnings: string[] = [];

    const timelines = Array.from(this.timelines.values());
    let totalTimePoints = 0;
    const scenesInTimelines = new Set<string>();

    for (const timeline of timelines) {
      totalTimePoints += timeline.timePoints.length;
      timeline.timePoints.forEach(tp => scenesInTimelines.add(tp.sceneId));

      // 1. בדיקת רצף סצנות בטיימליין
      const sequenceIssues = this.validateTimelineSequence(timeline, graph);
      issues.push(...sequenceIssues);

      // 2. בדיקת נוכחות דמויות
      const characterIssues = this.validateCharacterPresenceInTimeline(timeline, graph);
      issues.push(...characterIssues);

      // 3. בדיקת פרדוקסים טמפורליים
      const paradoxes = this.detectTemporalParadoxes(timeline, graph);
      issues.push(...paradoxes);
    }

    // 4. בדיקת סצנות ללא טיימליין
    const orphanedScenes = this.detectOrphanedScenes(graph);
    if (orphanedScenes.length > 0) {
      warnings.push(`Found ${orphanedScenes.length} scenes without timeline assignment: ${orphanedScenes.join(', ')}`);
    }

    // 5. בדיקת חפיפות בין טיימליינים
    const overlapIssues = this.detectTimelineOverlaps();
    issues.push(...overlapIssues);

    const consistent = issues.filter(i => i.severity === 'error').length === 0;

    return {
      consistent,
      issues,
      warnings,
      stats: {
        timelinesChecked: timelines.length,
        timePointsChecked: totalTimePoints,
        scenesInTimelines: scenesInTimelines.size,
      },
    };
  }

  /**
   * בדיקת רצף סצנות בטיימליין
   * מוודא שהסדר הלוגי נשמר
   */
  private validateTimelineSequence(timeline: Timeline, graph: GraphDB): TemporalIssue[] {
    const issues: TemporalIssue[] = [];

    for (let i = 0; i < timeline.timePoints.length; i++) {
      const timePoint = timeline.timePoints[i];
      const scene = graph.getScene(timePoint.sceneId);

      if (!scene) {
        issues.push({
          type: 'orphaned_timepoint',
          severity: 'error',
          message: `Timeline "${timeline.name}" references non-existent scene "${timePoint.sceneId}"`,
          affectedScenes: [timePoint.sceneId],
          timelineIds: [timeline.id],
        });
        continue;
      }

      // Check if timestamps are strictly increasing
      if (i > 0) {
        const prevTimePoint = timeline.timePoints[i - 1];
        if (timePoint.timestamp <= prevTimePoint.timestamp) {
          issues.push({
            type: 'sequence_violation',
            severity: 'warning',
            message: `Timeline "${timeline.name}": Scene "${timePoint.sceneId}" has same or earlier timestamp than previous scene "${prevTimePoint.sceneId}"`,
            affectedScenes: [prevTimePoint.sceneId, timePoint.sceneId],
            timelineIds: [timeline.id],
          });
        }
      }

      // Check if scene links respect temporal order
      for (const linkId of scene.links) {
        const linkTimePoint = timeline.timePoints.find(tp => tp.sceneId === linkId);
        if (linkTimePoint && linkTimePoint.timestamp < timePoint.timestamp) {
          issues.push({
            type: 'sequence_violation',
            severity: 'warning',
            message: `Scene "${scene.id}" links to earlier scene "${linkId}" in timeline "${timeline.name}"`,
            affectedScenes: [scene.id, linkId],
            timelineIds: [timeline.id],
          });
        }
      }
    }

    return issues;
  }

  /**
   * בדיקת עקביות נוכחות דמויות בטיימליין
   * מוודא שדמות לא מופיעה בשני מקומות בו-זמנית
   */
  private validateCharacterPresenceInTimeline(timeline: Timeline, graph: GraphDB): TemporalIssue[] {
    const issues: TemporalIssue[] = [];
    const characterTimestamps = new Map<string, number[]>();

    // Collect all character appearances with timestamps
    for (const timePoint of timeline.timePoints) {
      const scene = graph.getScene(timePoint.sceneId);
      if (!scene) continue;

      for (const characterId of scene.characterPresence) {
        if (!characterTimestamps.has(characterId)) {
          characterTimestamps.set(characterId, []);
        }
        characterTimestamps.get(characterId)!.push(timePoint.timestamp);
      }
    }

    // Check for impossible simultaneous appearances
    for (const [characterId, _timestamps] of characterTimestamps) {
      const character = graph.getCharacter(characterId);
      if (!character) continue;

      // Check if character appears at same timestamp in different scenes
      const timestampScenes = new Map<number, string[]>();
      for (const timePoint of timeline.timePoints) {
        const scene = graph.getScene(timePoint.sceneId);
        if (scene && scene.characterPresence.includes(characterId)) {
          if (!timestampScenes.has(timePoint.timestamp)) {
            timestampScenes.set(timePoint.timestamp, []);
          }
          timestampScenes.get(timePoint.timestamp)!.push(timePoint.sceneId);
        }
      }

      for (const [timestamp, sceneIds] of timestampScenes) {
        if (sceneIds.length > 1) {
          issues.push({
            type: 'character_presence',
            severity: 'error',
            message: `Character "${character.name}" appears in multiple scenes at timestamp ${timestamp} in timeline "${timeline.name}": ${sceneIds.join(', ')}`,
            affectedScenes: sceneIds,
            affectedCharacters: [characterId],
            timelineIds: [timeline.id],
          });
        }
      }
    }

    return issues;
  }

  /**
   * זיהוי פרדוקסים טמפורליים
   * בודק עקביות בין flashbacks, flash-forwards ו-main timeline
   */
  private detectTemporalParadoxes(timeline: Timeline, graph: GraphDB): TemporalIssue[] {
    const issues: TemporalIssue[] = [];

    // If this is a flashback/flash-forward, check consistency with parent
    if (timeline.parentTimelineId) {
      const parentTimeline = this.timelines.get(timeline.parentTimelineId);
      if (!parentTimeline) {
        issues.push({
          type: 'paradox',
          severity: 'error',
          message: `Timeline "${timeline.name}" references non-existent parent timeline "${timeline.parentTimelineId}"`,
          affectedScenes: [],
          timelineIds: [timeline.id],
        });
      } else {
        // Check for contradictions between timelines
        const contradictions = this.findTimelineContradictions(timeline, parentTimeline, graph);
        issues.push(...contradictions);
      }
    }

    return issues;
  }

  /**
   * זיהוי סתירות בין טיימליינים
   */
  private findTimelineContradictions(
    timeline: Timeline,
    parentTimeline: Timeline,
    graph: GraphDB
  ): TemporalIssue[] {
    const issues: TemporalIssue[] = [];

    // Check if character states are consistent
    for (const timePoint of timeline.timePoints) {
      const scene = graph.getScene(timePoint.sceneId);
      if (!scene) continue;

      for (const characterId of scene.characterPresence) {
        const character = graph.getCharacter(characterId);
        if (!character) continue;

        // Check if character should logically exist at this time
        // (This is a simplified check - real implementation would need more context)
        const parentTimePoints = parentTimeline.timePoints.filter(tp => {
          const parentScene = graph.getScene(tp.sceneId);
          return parentScene && parentScene.characterPresence.includes(characterId);
        });

        // For flashbacks, check if character should exist at this earlier time
        if (timeline.type === 'flashback') {
          const earliestParentTime = Math.min(...parentTimePoints.map(tp => tp.timestamp));
          const latestFlashbackTime = Math.max(...timeline.timePoints.map(tp => tp.timestamp));

          if (latestFlashbackTime > earliestParentTime && parentTimePoints.length === 0) {
            issues.push({
              type: 'paradox',
              severity: 'warning',
              message: `Flashback timeline "${timeline.name}" shows character "${character.name}" but they don't appear in main timeline`,
              affectedScenes: [timePoint.sceneId],
              affectedCharacters: [characterId],
              timelineIds: [timeline.id, parentTimeline.id],
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * זיהוי חפיפות בין טיימליינים
   */
  private detectTimelineOverlaps(): TemporalIssue[] {
    const issues: TemporalIssue[] = [];
    const timelines = Array.from(this.timelines.values());

    // Check for duplicate scene assignments in same timeline type
    for (let i = 0; i < timelines.length; i++) {
      for (let j = i + 1; j < timelines.length; j++) {
        const tl1 = timelines[i];
        const tl2 = timelines[j];

        // Only check overlaps for timelines of same type
        if (tl1.type !== tl2.type) continue;

        const scenes1 = new Set(tl1.timePoints.map(tp => tp.sceneId));
        const scenes2 = new Set(tl2.timePoints.map(tp => tp.sceneId));

        const overlap = Array.from(scenes1).filter(id => scenes2.has(id));

        if (overlap.length > 0) {
          issues.push({
            type: 'timeline_overlap',
            severity: 'warning',
            message: `Timelines "${tl1.name}" and "${tl2.name}" have overlapping scenes: ${overlap.join(', ')}`,
            affectedScenes: overlap,
            timelineIds: [tl1.id, tl2.id],
          });
        }
      }
    }

    return issues;
  }

  /**
   * זיהוי סצנות ללא טיימליין
   */
  private detectOrphanedScenes(graph: GraphDB): string[] {
    const allScenes = graph.getAllScenes();
    const scenesInTimelines = new Set<string>();

    for (const timeline of this.timelines.values()) {
      for (const timePoint of timeline.timePoints) {
        scenesInTimelines.add(timePoint.sceneId);
      }
    }

    return allScenes
      .filter(scene => !scenesInTimelines.has(scene.id))
      .map(scene => scene.id);
  }

  /**
   * מחיקת טיימליין
   */
  deleteTimeline(timelineId: string): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return false;
    }

    // Remove scene-to-timeline mappings
    for (const timePoint of timeline.timePoints) {
      const timelineIds = this.sceneToTimeline.get(timePoint.sceneId);
      if (timelineIds) {
        const index = timelineIds.indexOf(timelineId);
        if (index >= 0) {
          timelineIds.splice(index, 1);
          if (timelineIds.length === 0) {
            this.sceneToTimeline.delete(timePoint.sceneId);
          }
        }
      }
    }

    this.timelines.delete(timelineId);
    return true;
  }

  /**
   * ניקוי כל הטיימליינים
   */
  clear(): void {
    this.timelines.clear();
    this.sceneToTimeline.clear();
  }

  /**
   * קבלת סטטיסטיקות
   */
  getStats(): {
    totalTimelines: number;
    totalTimePoints: number;
    timelinesByType: Record<TimelineType, number>;
  } {
    const timelinesByType: Record<TimelineType, number> = {
      main: 0,
      flashback: 0,
      'flash-forward': 0,
      alternate: 0,
      dream: 0,
      parallel: 0,
    };

    let totalTimePoints = 0;

    for (const timeline of this.timelines.values()) {
      timelinesByType[timeline.type]++;
      totalTimePoints += timeline.timePoints.length;
    }

    return {
      totalTimelines: this.timelines.size,
      totalTimePoints,
      timelinesByType,
    };
  }
}
