/**
 * CoherenceSolver Unit Tests
 *
 * Tests for circular dependency detection, broken links, and coherence checking
 */

import { CoherenceSolver } from '../src/utils/CoherenceSolver';
import { GraphDB } from '../src/core/GraphDB';

describe('CoherenceSolver', () => {
  let solver: CoherenceSolver;
  let graph: GraphDB;

  beforeEach(() => {
    solver = new CoherenceSolver();
    graph = new GraphDB();
  });

  describe('checkCoherence', () => {
    it('should pass for empty graph', () => {
      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(true);
      expect(report.issues).toHaveLength(0);
      expect(report.stats.scenesChecked).toBe(0);
    });

    it('should pass for valid graph with no cycles', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First scene',
        why: 'Setup',
        how: 'Intro',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second scene',
        why: 'Development',
        how: 'Action',
        cost: 2.0,
      });

      scene1.addLink(scene2.id);

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(true);
      expect(report.issues).toHaveLength(0);
      expect(report.stats.scenesChecked).toBe(2);
      expect(report.stats.linksChecked).toBe(1);
    });

    it('should detect circular dependencies', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      // Create circular dependency
      scene1.addLink(scene2.id);
      scene2.addLink(scene1.id);

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);

      const circularIssue = report.issues.find(
        (i) => i.type === 'circular_dependency'
      );
      expect(circularIssue).toBeDefined();
      expect(circularIssue?.severity).toBe('error');
    });

    it('should detect broken links', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      // Add link to non-existent scene
      scene1.addLink('non-existent-id');

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(false);

      const brokenLinkIssue = report.issues.find(
        (i) => i.type === 'broken_link'
      );
      expect(brokenLinkIssue).toBeDefined();
      expect(brokenLinkIssue?.severity).toBe('error');
      expect(brokenLinkIssue?.affectedScenes).toContain(scene1.id);
      expect(brokenLinkIssue?.affectedScenes).toContain('non-existent-id');
    });

    it('should warn about orphaned scenes', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Orphaned scene',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      // Scene not in any arc
      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(true); // Orphaned is warning, not error
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.warnings[0]).toContain('orphaned');
      expect(report.warnings[0]).toContain(scene1.id);
    });

    it('should warn about empty arcs', () => {
      graph.createArc('Empty arc intent');

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(true); // Empty arc is warning, not error
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.warnings[0]).toContain('empty arcs');
    });

    it('should handle complex graph with multiple issues', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      // Circular dependency
      scene1.addLink(scene2.id);
      scene2.addLink(scene1.id);

      // Broken link
      scene1.addLink('non-existent');

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(false);
      expect(report.issues.length).toBeGreaterThanOrEqual(2);

      const hasCircular = report.issues.some(
        (i) => i.type === 'circular_dependency'
      );
      const hasBroken = report.issues.some(
        (i) => i.type === 'broken_link'
      );

      expect(hasCircular).toBe(true);
      expect(hasBroken).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should return empty array for acyclic graph', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene2.id);

      const cycles = solver.detectCircularDependencies(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should detect simple two-node cycle', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene2.id);
      scene2.addLink(scene1.id);

      const cycles = solver.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);

      const cycle = cycles[0];
      expect(cycle).toContain(scene1.id);
      expect(cycle).toContain(scene2.id);
    });

    it('should detect self-loop', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Self-loop',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene1.id);

      const cycles = solver.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);

      const cycle = cycles[0];
      expect(cycle).toContain(scene1.id);
    });

    it('should detect three-node cycle', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene3 = graph.createScene({
        title: 'Scene 3',
        premise: 'Third',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene2.id);
      scene2.addLink(scene3.id);
      scene3.addLink(scene1.id);

      const cycles = solver.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);

      const cycle = cycles[0];
      expect(cycle).toContain(scene1.id);
      expect(cycle).toContain(scene2.id);
      expect(cycle).toContain(scene3.id);
    });

    it('should handle disconnected components', () => {
      // Component 1: A -> B (no cycle)
      const sceneA = graph.createScene({
        title: 'Scene A',
        premise: 'A',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const sceneB = graph.createScene({
        title: 'Scene B',
        premise: 'B',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      sceneA.addLink(sceneB.id);

      // Component 2: C -> D -> C (cycle)
      const sceneC = graph.createScene({
        title: 'Scene C',
        premise: 'C',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const sceneD = graph.createScene({
        title: 'Scene D',
        premise: 'D',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      sceneC.addLink(sceneD.id);
      sceneD.addLink(sceneC.id);

      const cycles = solver.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);

      // Should only detect cycle in component 2
      const cycle = cycles[0];
      expect(cycle).toContain(sceneC.id);
      expect(cycle).toContain(sceneD.id);
    });
  });

  describe('validateTimeline', () => {
    it('should return true (placeholder implementation)', () => {
      graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const result = solver.validateTimeline(graph);

      expect(result).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear internal state', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene2.id);
      scene2.addLink(scene1.id);

      // First check
      solver.detectCircularDependencies(graph);

      // Reset
      solver.reset();

      // Should work again after reset
      const cycles = solver.detectCircularDependencies(graph);
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('integration with arcs', () => {
    it('should not warn about scenes in arcs', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      const arc = graph.createArc('Main story arc');
      arc.addScene(scene1.id);

      const report = solver.checkCoherence(graph);

      expect(report.coherent).toBe(true);
      expect(report.warnings).toHaveLength(0); // No orphaned warning
    });

    it('should provide accurate statistics', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'First',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Second',
        why: 'Test',
        how: 'Test',
        cost: 1.0,
      });

      scene1.addLink(scene2.id);

      const arc = graph.createArc('Main arc');
      arc.addScene(scene1.id);
      arc.addScene(scene2.id);

      const report = solver.checkCoherence(graph);

      expect(report.stats.scenesChecked).toBe(2);
      expect(report.stats.arcsChecked).toBe(1);
      expect(report.stats.linksChecked).toBe(1);
    });
  });
});
