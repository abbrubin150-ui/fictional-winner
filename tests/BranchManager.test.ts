/**
 * BranchManager Unit Tests
 *
 * Tests for branch creation, switching, merging, and conflict detection
 */

import { BranchManager } from '../src/managers/BranchManager';
import { GraphDB } from '../src/core/GraphDB';

describe('BranchManager', () => {
  let branchManager: BranchManager;
  let graph: GraphDB;

  beforeEach(() => {
    branchManager = new BranchManager();
    graph = new GraphDB();
  });

  describe('initialization', () => {
    it('should create main branch on initialization', () => {
      expect(branchManager.branchExists('main')).toBe(true);
      expect(branchManager.getCurrentBranchName()).toBe('main');
    });

    it('should protect main branch', () => {
      const mainBranch = branchManager.getBranch('main');
      expect(mainBranch?.protected).toBe(true);
    });
  });

  describe('createBranch', () => {
    it('should create a new branch from current state', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const branch = branchManager.createBranch('feature-1', graph, 'Test branch');

      expect(branch.name).toBe('feature-1');
      expect(branch.parent).toBe('main');
      expect(branch.protected).toBe(false);
      expect(branch.snapshot.scenes.length).toBe(1);
      expect(branch.snapshot.scenes[0].id).toBe(scene1.id);
    });

    it('should throw error if branch already exists', () => {
      branchManager.createBranch('feature-1', graph);

      expect(() => {
        branchManager.createBranch('feature-1', graph);
      }).toThrow('Branch "feature-1" already exists');
    });

    it('should not allow creating branch named "main"', () => {
      expect(() => {
        branchManager.createBranch('main', graph);
      }).toThrow('Cannot create branch named "main"');
    });
  });

  describe('switchBranch', () => {
    it('should switch to another branch', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.createBranch('feature-1', graph);

      // Add another scene in main
      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      // Switch to feature-1 (should only have scene1)
      branchManager.switchBranch('feature-1', graph);

      expect(branchManager.getCurrentBranchName()).toBe('feature-1');
      expect(graph.getAllScenes().length).toBe(1);
      expect(graph.getAllScenes()[0].id).toBe(scene1.id);
    });

    it('should throw error if branch does not exist', () => {
      expect(() => {
        branchManager.switchBranch('non-existent', graph);
      }).toThrow('Branch "non-existent" not found');
    });
  });

  describe('saveBranch', () => {
    it('should save changes to current branch', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.createBranch('feature-1', graph);
      branchManager.switchBranch('feature-1', graph);

      // Add a new scene
      graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.saveBranch(graph);

      const branch = branchManager.getBranch('feature-1');
      expect(branch?.snapshot.scenes.length).toBe(2);
    });
  });

  describe('mergeBranch', () => {
    it('should merge branch without conflicts', () => {
      // Create initial scene in main
      graph.createScene({
        title: 'Scene 1',
        premise: 'Main',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.saveBranch(graph);

      // Create feature branch
      branchManager.createBranch('feature-1', graph);
      branchManager.switchBranch('feature-1', graph);

      // Add scene in feature branch
      graph.createScene({
        title: 'Scene 2',
        premise: 'Feature',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.saveBranch(graph);

      // Switch back to main and merge
      branchManager.switchBranch('main', graph);
      const result = branchManager.mergeBranch('feature-1', graph);

      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBe(0);
      expect(graph.getAllScenes().length).toBe(2);
    });

    it('should detect conflicts when same scene is modified', () => {
      // Create scene in main
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Original',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      branchManager.saveBranch(graph);

      // Create feature branch and modify scene
      branchManager.createBranch('feature-1', graph);
      branchManager.switchBranch('feature-1', graph);

      const sceneInFeature = graph.getScene(scene1.id);
      sceneInFeature?.update({ premise: 'Modified in feature' });
      branchManager.saveBranch(graph);

      // Switch to main and modify the same scene
      branchManager.switchBranch('main', graph);
      const sceneInMain = graph.getScene(scene1.id);
      sceneInMain?.update({ premise: 'Modified in main' });
      branchManager.saveBranch(graph);

      // Try to merge - should have conflict
      const result = branchManager.mergeBranch('feature-1', graph);

      expect(result.success).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].type).toBe('scene_modified');
    });

    it('should throw error if source branch does not exist', () => {
      expect(() => {
        branchManager.mergeBranch('non-existent', graph);
      }).toThrow('Source branch "non-existent" not found');
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch', () => {
      branchManager.createBranch('feature-1', graph);

      expect(branchManager.branchExists('feature-1')).toBe(true);

      branchManager.deleteBranch('feature-1');

      expect(branchManager.branchExists('feature-1')).toBe(false);
    });

    it('should not delete protected branch', () => {
      expect(() => {
        branchManager.deleteBranch('main');
      }).toThrow('Cannot delete protected branch "main"');
    });

    it('should not delete current branch', () => {
      branchManager.createBranch('feature-1', graph);
      branchManager.switchBranch('feature-1', graph);

      expect(() => {
        branchManager.deleteBranch('feature-1');
      }).toThrow('Cannot delete the current branch');
    });

    it('should throw error if branch does not exist', () => {
      expect(() => {
        branchManager.deleteBranch('non-existent');
      }).toThrow('Branch "non-existent" not found');
    });
  });

  describe('listBranches', () => {
    it('should list all branches', () => {
      branchManager.createBranch('feature-1', graph);
      branchManager.createBranch('feature-2', graph);

      const branches = branchManager.listBranches();

      expect(branches.length).toBe(3); // main + feature-1 + feature-2
      expect(branches.map((b) => b.name)).toContain('main');
      expect(branches.map((b) => b.name)).toContain('feature-1');
      expect(branches.map((b) => b.name)).toContain('feature-2');
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch', () => {
      const current = branchManager.getCurrentBranch();

      expect(current?.name).toBe('main');
    });

    it('should update when switching branches', () => {
      branchManager.createBranch('feature-1', graph);
      branchManager.switchBranch('feature-1', graph);

      const current = branchManager.getCurrentBranch();

      expect(current?.name).toBe('feature-1');
    });
  });
});
