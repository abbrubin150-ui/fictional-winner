/**
 * SnapshotManager Unit Tests
 *
 * Tests for automatic snapshots, rollback, and snapshot management
 */

import { SnapshotManager } from '../src/managers/SnapshotManager';
import { GraphDB } from '../src/core/GraphDB';

describe('SnapshotManager', () => {
  let snapshotManager: SnapshotManager;
  let graph: GraphDB;

  beforeEach(() => {
    snapshotManager = new SnapshotManager(5);
    graph = new GraphDB();
  });

  describe('createAutoSnapshot', () => {
    it('should create automatic snapshot', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const metadata = snapshotManager.createAutoSnapshot(
        graph,
        'deleteScene',
        'TestWitness'
      );

      expect(metadata.automatic).toBe(true);
      expect(metadata.operation).toBe('deleteScene');
      expect(metadata.witness).toBe('TestWitness');
      expect(metadata.reason).toContain('deleteScene');
      expect(snapshotManager.getSnapshotCount()).toBe(1);
    });

    it('should throw error if auto snapshots disabled', () => {
      snapshotManager.setAutoSnapshotEnabled(false);

      expect(() => {
        snapshotManager.createAutoSnapshot(graph, 'test');
      }).toThrow('Automatic snapshots are disabled');
    });
  });

  describe('createManualSnapshot', () => {
    it('should create manual snapshot', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const metadata = snapshotManager.createManualSnapshot(
        graph,
        'Before major refactor',
        'Developer'
      );

      expect(metadata.automatic).toBe(false);
      expect(metadata.reason).toBe('Before major refactor');
      expect(metadata.witness).toBe('Developer');
      expect(snapshotManager.getSnapshotCount()).toBe(1);
    });
  });

  describe('rollback', () => {
    it('should rollback to specific snapshot', () => {
      // Create scene 1
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const snapshot1 = snapshotManager.createManualSnapshot(graph, 'After scene 1');

      // Create scene 2
      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      expect(graph.getAllScenes().length).toBe(2);

      // Rollback to snapshot1 (should only have 1 scene)
      snapshotManager.rollback(snapshot1.id, graph);

      expect(graph.getAllScenes().length).toBe(1);
      expect(graph.getAllScenes()[0].title).toBe('Scene 1');
    });

    it('should throw error if snapshot not found', () => {
      expect(() => {
        snapshotManager.rollback('non-existent', graph);
      }).toThrow('Snapshot non-existent not found');
    });
  });

  describe('rollbackToLast', () => {
    it('should rollback to last snapshot', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      snapshotManager.createManualSnapshot(graph, 'Snapshot 1');

      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      expect(graph.getAllScenes().length).toBe(2);

      const metadata = snapshotManager.rollbackToLast(graph);

      expect(metadata).not.toBeNull();
      expect(metadata?.reason).toBe('Snapshot 1');
      expect(graph.getAllScenes().length).toBe(1);
    });

    it('should return null if no snapshots exist', () => {
      const result = snapshotManager.rollbackToLast(graph);

      expect(result).toBeNull();
    });
  });

  describe('rollbackToIndex', () => {
    it('should rollback to snapshot by index', () => {
      // Create 3 snapshots
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      snapshotManager.createManualSnapshot(graph, 'Snapshot 1');

      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      snapshotManager.createManualSnapshot(graph, 'Snapshot 2');

      // Rollback to first snapshot
      const metadata = snapshotManager.rollbackToIndex(0, graph);

      expect(metadata.reason).toBe('Snapshot 1');
      expect(graph.getAllScenes().length).toBe(1);
    });

    it('should support negative indices', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      snapshotManager.createManualSnapshot(graph, 'Snapshot 1');

      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      snapshotManager.createManualSnapshot(graph, 'Snapshot 2');

      // Rollback to last snapshot using -1
      snapshotManager.rollbackToIndex(-1, graph);

      expect(graph.getAllScenes().length).toBe(2);
    });

    it('should throw error for invalid index', () => {
      expect(() => {
        snapshotManager.rollbackToIndex(10, graph);
      }).toThrow('Snapshot index 10 out of bounds');
    });
  });

  describe('listSnapshots', () => {
    it('should list all snapshots', () => {
      snapshotManager.createManualSnapshot(graph, 'Snapshot 1');
      snapshotManager.createManualSnapshot(graph, 'Snapshot 2');

      const snapshots = snapshotManager.listSnapshots();

      expect(snapshots.length).toBe(2);
      expect(snapshots[0].reason).toBe('Snapshot 1');
      expect(snapshots[1].reason).toBe('Snapshot 2');
    });
  });

  describe('maxSnapshots', () => {
    it('should limit number of snapshots', () => {
      const manager = new SnapshotManager(3);

      for (let i = 1; i <= 5; i++) {
        manager.createManualSnapshot(graph, `Snapshot ${i}`);
      }

      expect(manager.getSnapshotCount()).toBe(3);

      const snapshots = manager.listSnapshots();
      expect(snapshots[0].reason).toBe('Snapshot 3');
      expect(snapshots[2].reason).toBe('Snapshot 5');
    });

    it('should update max snapshots and cleanup', () => {
      for (let i = 1; i <= 5; i++) {
        snapshotManager.createManualSnapshot(graph, `Snapshot ${i}`);
      }

      expect(snapshotManager.getSnapshotCount()).toBe(5);

      snapshotManager.setMaxSnapshots(3);

      expect(snapshotManager.getSnapshotCount()).toBe(3);
    });

    it('should throw error for invalid max snapshots', () => {
      expect(() => {
        snapshotManager.setMaxSnapshots(0);
      }).toThrow('Max snapshots must be at least 1');
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete specific snapshot', () => {
      const metadata = snapshotManager.createManualSnapshot(graph, 'Test');

      expect(snapshotManager.getSnapshotCount()).toBe(1);

      const result = snapshotManager.deleteSnapshot(metadata.id);

      expect(result).toBe(true);
      expect(snapshotManager.getSnapshotCount()).toBe(0);
    });

    it('should return false for non-existent snapshot', () => {
      const result = snapshotManager.deleteSnapshot('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('clearSnapshots', () => {
    it('should clear all snapshots', () => {
      snapshotManager.createManualSnapshot(graph, 'Snapshot 1');
      snapshotManager.createManualSnapshot(graph, 'Snapshot 2');

      expect(snapshotManager.getSnapshotCount()).toBe(2);

      snapshotManager.clearSnapshots();

      expect(snapshotManager.getSnapshotCount()).toBe(0);
    });
  });

  describe('autoSnapshotEnabled', () => {
    it('should enable/disable auto snapshots', () => {
      expect(snapshotManager.isAutoSnapshotEnabled()).toBe(true);

      snapshotManager.setAutoSnapshotEnabled(false);

      expect(snapshotManager.isAutoSnapshotEnabled()).toBe(false);

      snapshotManager.setAutoSnapshotEnabled(true);

      expect(snapshotManager.isAutoSnapshotEnabled()).toBe(true);
    });
  });

  describe('getSnapshot', () => {
    it('should retrieve specific snapshot', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const metadata = snapshotManager.createManualSnapshot(graph, 'Test');
      const stored = snapshotManager.getSnapshot(metadata.id);

      expect(stored).toBeDefined();
      expect(stored?.metadata.id).toBe(metadata.id);
      expect(stored?.snapshot.scenes.length).toBe(1);
    });

    it('should return undefined for non-existent snapshot', () => {
      const stored = snapshotManager.getSnapshot('non-existent');

      expect(stored).toBeUndefined();
    });
  });
});
