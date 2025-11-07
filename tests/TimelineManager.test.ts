/**
 * Tests for TimelineManager
 */

import { TimelineManager, TimePoint } from '../src/managers/TimelineManager';
import { GraphDB } from '../src/core/GraphDB';

describe('TimelineManager', () => {
  let manager: TimelineManager;
  let graph: GraphDB;

  beforeEach(() => {
    manager = new TimelineManager();
    graph = new GraphDB();
  });

  describe('Timeline Creation', () => {
    test('should create a new timeline', () => {
      const timeline = manager.createTimeline('tl1', 'Main Timeline', 'main');

      expect(timeline.id).toBe('tl1');
      expect(timeline.name).toBe('Main Timeline');
      expect(timeline.type).toBe('main');
      expect(timeline.timePoints).toEqual([]);
    });

    test('should throw error for duplicate timeline ID', () => {
      manager.createTimeline('tl1', 'Timeline 1', 'main');

      expect(() => {
        manager.createTimeline('tl1', 'Timeline 2', 'main');
      }).toThrow('Timeline with id "tl1" already exists');
    });

    test('should create flashback timeline with parent', () => {
      manager.createTimeline('main', 'Main', 'main');
      const flashback = manager.createTimeline('fb1', 'Flashback', 'flashback', 'main');

      expect(flashback.parentTimelineId).toBe('main');
      expect(flashback.type).toBe('flashback');
    });
  });

  describe('Time Point Management', () => {
    test('should add time point to timeline', () => {
      const timeline = manager.createTimeline('tl1', 'Main', 'main');
      const timePoint: TimePoint = {
        sceneId: 'scene1',
        timestamp: 100,
        timelineId: 'tl1',
      };

      manager.addTimePoint('tl1', timePoint);

      expect(timeline.timePoints.length).toBe(1);
      expect(timeline.timePoints[0].sceneId).toBe('scene1');
    });

    test('should sort time points by timestamp', () => {
      manager.createTimeline('tl1', 'Main', 'main');

      manager.addTimePoint('tl1', { sceneId: 'scene3', timestamp: 300, timelineId: 'tl1' });
      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });
      manager.addTimePoint('tl1', { sceneId: 'scene2', timestamp: 200, timelineId: 'tl1' });

      const timeline = manager.getTimeline('tl1')!;
      expect(timeline.timePoints[0].sceneId).toBe('scene1');
      expect(timeline.timePoints[1].sceneId).toBe('scene2');
      expect(timeline.timePoints[2].sceneId).toBe('scene3');
    });

    test('should throw error for duplicate scene in timeline', () => {
      manager.createTimeline('tl1', 'Main', 'main');
      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });

      expect(() => {
        manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 200, timelineId: 'tl1' });
      }).toThrow('Scene "scene1" already exists in timeline "tl1"');
    });

    test('should remove time point from timeline', () => {
      manager.createTimeline('tl1', 'Main', 'main');
      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });

      const removed = manager.removeTimePoint('tl1', 'scene1');

      expect(removed).toBe(true);
      const timeline = manager.getTimeline('tl1')!;
      expect(timeline.timePoints.length).toBe(0);
    });

    test('should track scene to timeline mapping', () => {
      manager.createTimeline('tl1', 'Timeline 1', 'main');
      manager.createTimeline('tl2', 'Timeline 2', 'alternate');

      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });
      manager.addTimePoint('tl2', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl2' });

      const timelines = manager.getTimelinesForScene('scene1');
      expect(timelines).toContain('tl1');
      expect(timelines).toContain('tl2');
    });
  });

  describe('Temporal Validation', () => {
    test('should validate coherent timeline', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Beginning',
        why: 'Setup',
        how: 'Dialogue',
        cost: 10,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Middle',
        why: 'Development',
        how: 'Action',
        cost: 15,
      });

      manager.createTimeline('main', 'Main', 'main');
      manager.addTimePoint('main', { sceneId: scene1.id, timestamp: 100, timelineId: 'main' });
      manager.addTimePoint('main', { sceneId: scene2.id, timestamp: 200, timelineId: 'main' });

      const report = manager.validateTemporalConsistency(graph);

      expect(report.consistent).toBe(true);
      expect(report.issues.length).toBe(0);
    });

    test('should detect non-existent scene in timeline', () => {
      manager.createTimeline('main', 'Main', 'main');
      manager.addTimePoint('main', { sceneId: 'nonexistent', timestamp: 100, timelineId: 'main' });

      const report = manager.validateTemporalConsistency(graph);

      expect(report.consistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0].type).toBe('orphaned_timepoint');
    });

    test('should detect character appearing in multiple scenes at same timestamp', () => {
      const char = graph.createCharacter({
        name: 'John',
        description: 'Protagonist',
        role: 'protagonist',
      
        traits: [],
        relationships: [],
        scenePresence: [],
      });

      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Location A',
        why: 'Setup',
        how: 'Dialogue',
        cost: 10,
        characterPresence: [char.id],
      });

      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Location B',
        why: 'Setup',
        how: 'Dialogue',
        cost: 10,
        characterPresence: [char.id],
      });

      // Update character presence
      char.addScenePresence(scene1.id);
      char.addScenePresence(scene2.id);

      manager.createTimeline('main', 'Main', 'main');
      manager.addTimePoint('main', { sceneId: scene1.id, timestamp: 100, timelineId: 'main' });
      manager.addTimePoint('main', { sceneId: scene2.id, timestamp: 100, timelineId: 'main' }); // Same timestamp!

      const report = manager.validateTemporalConsistency(graph);

      expect(report.consistent).toBe(false);
      const presenceIssues = report.issues.filter(i => i.type === 'character_presence');
      expect(presenceIssues.length).toBeGreaterThan(0);
    });

    test('should warn about scenes without timeline', () => {
      graph.createScene({
        title: 'Orphan Scene',
        premise: 'No timeline',
        why: 'Test',
        how: 'Test',
        cost: 5,
      });

      manager.createTimeline('main', 'Main', 'main');

      const report = manager.validateTemporalConsistency(graph);

      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.warnings[0]).toContain('without timeline assignment');
    });

    test('should detect timeline overlaps', () => {
      const scene = graph.createScene({
        title: 'Shared Scene',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      manager.createTimeline('tl1', 'Timeline 1', 'main');
      manager.createTimeline('tl2', 'Timeline 2', 'main');

      manager.addTimePoint('tl1', { sceneId: scene.id, timestamp: 100, timelineId: 'tl1' });
      manager.addTimePoint('tl2', { sceneId: scene.id, timestamp: 100, timelineId: 'tl2' });

      const report = manager.validateTemporalConsistency(graph);

      const overlapIssues = report.issues.filter(i => i.type === 'timeline_overlap');
      expect(overlapIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Timeline Deletion', () => {
    test('should delete timeline', () => {
      manager.createTimeline('tl1', 'Timeline 1', 'main');
      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });

      const deleted = manager.deleteTimeline('tl1');

      expect(deleted).toBe(true);
      expect(manager.getTimeline('tl1')).toBeUndefined();
    });

    test('should update scene mapping when deleting timeline', () => {
      manager.createTimeline('tl1', 'Timeline 1', 'main');
      manager.addTimePoint('tl1', { sceneId: 'scene1', timestamp: 100, timelineId: 'tl1' });

      manager.deleteTimeline('tl1');

      const timelines = manager.getTimelinesForScene('scene1');
      expect(timelines.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should calculate timeline statistics', () => {
      manager.createTimeline('main', 'Main', 'main');
      manager.createTimeline('fb1', 'Flashback', 'flashback');
      manager.createTimeline('ff1', 'Flash-forward', 'flash-forward');

      manager.addTimePoint('main', { sceneId: 'scene1', timestamp: 100, timelineId: 'main' });
      manager.addTimePoint('main', { sceneId: 'scene2', timestamp: 200, timelineId: 'main' });
      manager.addTimePoint('fb1', { sceneId: 'scene3', timestamp: 50, timelineId: 'fb1' });

      const stats = manager.getStats();

      expect(stats.totalTimelines).toBe(3);
      expect(stats.totalTimePoints).toBe(3);
      expect(stats.timelinesByType.main).toBe(1);
      expect(stats.timelinesByType.flashback).toBe(1);
      expect(stats.timelinesByType['flash-forward']).toBe(1);
    });
  });

  describe('Clear', () => {
    test('should clear all timelines', () => {
      manager.createTimeline('tl1', 'Timeline 1', 'main');
      manager.createTimeline('tl2', 'Timeline 2', 'alternate');

      manager.clear();

      expect(manager.getAllTimelines().length).toBe(0);
      expect(manager.getStats().totalTimelines).toBe(0);
    });
  });
});
