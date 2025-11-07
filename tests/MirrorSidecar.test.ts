/**
 * Tests for MirrorSidecar - Fixed version
 */

import { MirrorSidecar } from '../src/managers/MirrorSidecar';
import { GraphDB } from '../src/core/GraphDB';
import { Scene } from '../src/core/Scene';
import { Character } from '../src/core/Character';

describe('MirrorSidecar', () => {
  let sidecar: MirrorSidecar;
  let graphA: GraphDB;
  let graphB: GraphDB;

  beforeEach(() => {
    sidecar = new MirrorSidecar({
      autoSyncThreshold: 30,
      conflictStrategy: 'manual',
    });
    graphA = new GraphDB();
    graphB = new GraphDB();
  });

  afterEach(() => {
    sidecar.shutdown();
  });

  describe('Drift Calculation', () => {
    test('should calculate zero drift for identical graphs', () => {
      const scene1A = graphA.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const scene1B = new Scene(scene1A.id, 'Scene 1', 'Test', 'Test', 'Test', 10);
      graphB.addScene(scene1B);

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      expect(drift.driftScore).toBe(0);
      expect(drift.differences.length).toBe(0);
    });

    test('should detect added scenes', () => {
      graphA.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      expect(drift.driftScore).toBeGreaterThan(0);
      const addedScenes = drift.differences.filter(d => d.type === 'scene_removed');
      expect(addedScenes.length).toBe(1);
    });

    test('should detect removed scenes', () => {
      graphB.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      expect(drift.driftScore).toBeGreaterThan(0);
      const removedScenes = drift.differences.filter(d => d.type === 'scene_added');
      expect(removedScenes.length).toBe(1);
    });

    test('should detect modified scenes', () => {
      const sceneA = graphA.createScene({
        title: 'Scene 1',
        premise: 'Original',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const sceneB = new Scene(sceneA.id, 'Scene 1', 'Modified', 'Test', 'Test', 10);
      graphB.addScene(sceneB);

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      expect(drift.driftScore).toBeGreaterThan(0);
      const modifiedScenes = drift.differences.filter(d => d.type === 'scene_modified');
      expect(modifiedScenes.length).toBe(1);
    });

    test('should detect arc differences', () => {
      const scene1 = graphA.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const arc = graphA.createArc('Test Arc');
      arc.addScene(scene1.id);

      // GraphB has same scene but no arc
      const scene1B = new Scene(scene1.id, 'Scene 1', 'Test', 'Test', 'Test', 10);
      graphB.addScene(scene1B);

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      const arcDiffs = drift.differences.filter(d => d.type === 'arc_changed');
      expect(arcDiffs.length).toBeGreaterThan(0);
    });

    test('should detect character differences', () => {
      const charA = graphA.createCharacter({
        name: 'John',
        description: 'Protagonist',
        role: 'protagonist',
        traits: [],
        relationships: [],
        scenePresence: [],
      });

      // GraphB has same character with different description
      const charB = new Character(charA.id, 'John', 'Different Description', 'protagonist');
      graphB.addCharacter(charB);

      const drift = sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      const charDiffs = drift.differences.filter(d => d.type === 'character_changed');
      expect(charDiffs.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-sync Threshold', () => {
    test('should recommend auto-sync for low drift', () => {
      const testSidecar = new MirrorSidecar({ autoSyncThreshold: 50 });

      const drift = testSidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');
      drift.driftScore = 20;

      expect(testSidecar.shouldAutoSync(drift)).toBe(true);
      testSidecar.shutdown();
    });

    test('should not recommend auto-sync for high drift', () => {
      const testSidecar = new MirrorSidecar({ autoSyncThreshold: 30 });

      const drift = testSidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');
      drift.driftScore = 50;

      expect(testSidecar.shouldAutoSync(drift)).toBe(false);
      testSidecar.shutdown();
    });
  });

  describe('Synchronization', () => {
    test('should sync added scenes from source to target', async () => {
      const sceneA = graphA.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const report = await sidecar.synchronize(graphA, graphB, 'branchA', 'branchB');

      expect(report.changes.scenesAdded).toBe(1);
      expect(graphB.getScene(sceneA.id)).toBeDefined();
    });

    test('should detect conflicts when syncing', async () => {
      const sceneA = graphA.createScene({
        title: 'Scene 1',
        premise: 'Version A',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const sceneB = new Scene(sceneA.id, 'Scene 1', 'Version B', 'Test', 'Test', 10);
      graphB.addScene(sceneB);

      const report = await sidecar.synchronize(graphA, graphB, 'branchA', 'branchB');

      expect(report.conflicts.length).toBeGreaterThan(0);
    });

    test('should reduce drift after sync', async () => {
      graphA.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const report = await sidecar.synchronize(graphA, graphB, 'branchA', 'branchB');

      expect(report.driftAfter).toBeLessThan(report.driftBefore);
    });
  });

  describe('Drift History', () => {
    test('should track drift history', () => {
      sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');
      sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      const history = sidecar.getDriftHistory('branchA', 'branchB');

      expect(history.length).toBe(2);
    });

    test('should clear drift history', () => {
      sidecar.calculateDrift(graphA, graphB, 'branchA', 'branchB');

      sidecar.clearHistory();

      const history = sidecar.getDriftHistory('branchA', 'branchB');
      expect(history.length).toBe(0);
    });
  });
});
