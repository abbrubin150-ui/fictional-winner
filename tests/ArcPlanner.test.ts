/**
 * Tests for ArcPlanner with A.R.I.D-5 Flow
 */

import { ArcPlanner, ArcTemplate } from '../ArcPlanner';
import { Arc } from '../Arc';
import { GraphDB } from '../GraphDB';

describe('ArcPlanner', () => {
  let planner: ArcPlanner;
  let graph: GraphDB;

  beforeEach(() => {
    planner = new ArcPlanner();
    graph = new GraphDB();
  });

  describe('Template Management', () => {
    test('should have default templates', () => {
      const templates = planner.getAllTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.name === 'hero-journey')).toBe(true);
      expect(templates.some(t => t.name === 'three-act')).toBe(true);
    });

    test('should get template by name', () => {
      const template = planner.getTemplate('hero-journey');

      expect(template).toBeDefined();
      expect(template?.name).toBe('hero-journey');
    });

    test('should add custom template', () => {
      const customTemplate: ArcTemplate = {
        name: 'custom',
        description: 'Custom template',
        suggestedStructure: {
          anchor: [],
          rise: [],
          impact: [],
          descent: [],
        },
        sceneCount: {
          min: 5,
          max: 10,
          anchor: 1,
          rise: 2,
          impact: 1,
          descent: 1,
        },
        pacing: {
          anchorPercent: 20,
          risePercent: 40,
          impactPercent: 20,
          descentPercent: 20,
        },
      };

      planner.addTemplate(customTemplate);

      const retrieved = planner.getTemplate('custom');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('custom');
    });
  });

  describe('Arc Creation from Template', () => {
    test('should create arc from hero-journey template', () => {
      const scenes = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
      const arc = planner.createFromTemplate('arc1', 'Hero Journey', 'hero-journey', scenes);

      expect(arc.id).toBe('arc1');
      expect(arc.intent).toBe('Hero Journey');
      expect(arc.scenes.length).toBe(8);
      expect(arc.aridFlow).toBeDefined();
      expect(arc.aridFlow?.anchor.length).toBeGreaterThan(0);
      expect(arc.aridFlow?.rise.length).toBeGreaterThan(0);
      expect(arc.aridFlow?.impact.length).toBeGreaterThan(0);
      expect(arc.aridFlow?.descent.length).toBeGreaterThan(0);
    });

    test('should throw error for non-existent template', () => {
      expect(() => {
        planner.createFromTemplate('arc1', 'Test', 'nonexistent', ['s1', 's2']);
      }).toThrow('Template "nonexistent" not found');
    });

    test('should throw error for too few scenes', () => {
      expect(() => {
        planner.createFromTemplate('arc1', 'Test', 'hero-journey', ['s1', 's2']);
      }).toThrow('requires at least');
    });

    test('should set five-beat structure automatically', () => {
      const scenes = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
      const arc = planner.createFromTemplate('arc1', 'Test', 'hero-journey', scenes);

      expect(arc.aridFlow?.fiveBeat).toBeDefined();
      expect(arc.aridFlow?.fiveBeat?.beat1).toBe('s1');
      expect(arc.aridFlow?.fiveBeat?.beat5).toBe('s8');
    });
  });

  describe('Arc Analysis', () => {
    test('should analyze complete arc positively', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3', 's4', 's5'];
      arc.initializeAridFlow();
      arc.addToAridPhase('anchor', 's1');
      arc.addToAridPhase('rise', 's2');
      arc.addToAridPhase('rise', 's3');
      arc.addToAridPhase('impact', 's4');
      arc.addToAridPhase('descent', 's5');
      arc.setFiveBeat('s1', 's2', 's3', 's4', 's5');

      const analysis = planner.analyzeArc(arc);

      expect(analysis.score).toBeGreaterThan(70);
      expect(analysis.structure.isComplete).toBe(true);
      expect(analysis.strengths.length).toBeGreaterThan(0);
    });

    test('should detect missing ARID flow', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3'];

      const analysis = planner.analyzeArc(arc);

      expect(analysis.score).toBeLessThan(70);
      expect(analysis.weaknesses.some(w => w.includes('ARID Flow'))).toBe(true);
    });

    test('should detect missing phases', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3'];
      arc.initializeAridFlow();
      arc.addToAridPhase('anchor', 's1');
      // Missing rise, impact, descent

      const analysis = planner.analyzeArc(arc);

      expect(analysis.structure.hasAnchor).toBe(true);
      expect(analysis.structure.hasRise).toBe(false);
      expect(analysis.structure.hasImpact).toBe(false);
      expect(analysis.structure.hasDescent).toBe(false);
      expect(analysis.weaknesses.length).toBeGreaterThan(0);
    });

    test('should detect unbalanced pacing', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
      arc.initializeAridFlow();

      // Unbalanced: too much anchor, not enough else
      arc.addToAridPhase('anchor', 's1');
      arc.addToAridPhase('anchor', 's2');
      arc.addToAridPhase('anchor', 's3');
      arc.addToAridPhase('anchor', 's4');
      arc.addToAridPhase('anchor', 's5');
      arc.addToAridPhase('rise', 's6');
      arc.addToAridPhase('impact', 's7');
      arc.addToAridPhase('descent', 's8');

      const analysis = planner.analyzeArc(arc);

      expect(analysis.pacing.isBalanced).toBe(false);
      expect(analysis.weaknesses.some(w => w.includes('unbalanced'))).toBe(true);
    });

    test('should warn about very few scenes', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2'];
      arc.initializeAridFlow();

      const analysis = planner.analyzeArc(arc);

      expect(analysis.weaknesses.some(w => w.includes('very few scenes'))).toBe(true);
    });

    test('should warn about too many scenes', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = Array.from({ length: 30 }, (_, i) => `s${i + 1}`);
      arc.initializeAridFlow();

      const analysis = planner.analyzeArc(arc);

      expect(analysis.weaknesses.some(w => w.includes('many scenes'))).toBe(true);
    });

    test('should analyze link coherence with graph', () => {
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Test',
        why: 'Test',
        how: 'Test',
        cost: 10,
      });

      scene1.addLink(scene2.id);

      const arc = new Arc('arc1', 'Test Arc');
      arc.addScene(scene1.id);
      arc.addScene(scene2.id);
      arc.initializeAridFlow();
      arc.addToAridPhase('anchor', scene1.id);
      arc.addToAridPhase('rise', scene2.id);

      const analysis = planner.analyzeArc(arc, graph);

      expect(analysis.strengths.some(s => s.includes('coherent'))).toBe(true);
    });
  });

  describe('Template Recommendation', () => {
    test('should recommend template based on arc structure', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = Array.from({ length: 10 }, (_, i) => `s${i + 1}`);
      arc.initializeAridFlow();

      // Distribute to match hero-journey
      arc.addToAridPhase('anchor', 's1');
      arc.addToAridPhase('anchor', 's2');
      for (let i = 3; i <= 6; i++) {
        arc.addToAridPhase('rise', `s${i}`);
      }
      arc.addToAridPhase('impact', 's7');
      arc.addToAridPhase('impact', 's8');
      arc.addToAridPhase('descent', 's9');
      arc.addToAridPhase('descent', 's10');

      const recommendation = planner.recommendTemplate(arc);

      expect(recommendation).toBeDefined();
      expect(recommendation?.template.name).toBeTruthy();
      expect(recommendation?.matchScore).toBeGreaterThan(0);
    });

    test('should return null for arc without scenes', () => {
      const arc = new Arc('arc1', 'Test Arc');

      const recommendation = planner.recommendTemplate(arc);

      expect(recommendation).toBeNull();
    });
  });

  describe('Arc Visualization', () => {
    test('should visualize arc structure', () => {
      const arc = new Arc('arc1', 'Hero Story');
      arc.scenes = ['s1', 's2', 's3', 's4', 's5'];
      arc.initializeAridFlow();
      arc.addToAridPhase('anchor', 's1');
      arc.addToAridPhase('rise', 's2');
      arc.addToAridPhase('rise', 's3');
      arc.addToAridPhase('impact', 's4');
      arc.addToAridPhase('descent', 's5');
      arc.setFiveBeat('s1', 's2', 's3', 's4', 's5');

      const viz = planner.visualizeArc(arc);

      expect(viz).toContain('ARC VISUALIZATION');
      expect(viz).toContain('Hero Story');
      expect(viz).toContain('ANCHOR');
      expect(viz).toContain('RISE');
      expect(viz).toContain('IMPACT');
      expect(viz).toContain('DESCENT');
      expect(viz).toContain('FIVE-BEAT STRUCTURE');
    });

    test('should handle arc without ARID flow', () => {
      const arc = new Arc('arc1', 'Test Arc');

      const viz = planner.visualizeArc(arc);

      expect(viz).toContain('does not have ARID Flow');
    });
  });

  describe('Pacing Calculation', () => {
    test('should calculate balanced pacing', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = Array.from({ length: 10 }, (_, i) => `s${i + 1}`);
      arc.initializeAridFlow();

      arc.addToAridPhase('anchor', 's1');
      arc.addToAridPhase('anchor', 's2');
      arc.addToAridPhase('rise', 's3');
      arc.addToAridPhase('rise', 's4');
      arc.addToAridPhase('rise', 's5');
      arc.addToAridPhase('rise', 's6');
      arc.addToAridPhase('impact', 's7');
      arc.addToAridPhase('impact', 's8');
      arc.addToAridPhase('descent', 's9');
      arc.addToAridPhase('descent', 's10');

      const analysis = planner.analyzeArc(arc);

      expect(analysis.pacing.anchorPercent).toBeCloseTo(20, 0);
      expect(analysis.pacing.risePercent).toBeCloseTo(40, 0);
      expect(analysis.pacing.impactPercent).toBeCloseTo(20, 0);
      expect(analysis.pacing.descentPercent).toBeCloseTo(20, 0);
      expect(analysis.pacing.isBalanced).toBe(true);
    });
  });

  describe('ARID Flow Validation', () => {
    test('should validate scenes are in arc', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2'];
      arc.initializeAridFlow();

      expect(() => {
        arc.addToAridPhase('anchor', 's3'); // s3 not in arc
      }).toThrow('not part of this arc');
    });

    test('should validate five-beat scenes are in arc', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3'];

      expect(() => {
        arc.setFiveBeat('s1', 's2', 's3', 's4', 's5'); // s4, s5 not in arc
      }).toThrow('not part of this arc');
    });

    test('should validate five-beat order', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3', 's4', 's5'];
      arc.initializeAridFlow();

      // Set beats in wrong order (s5 before s4)
      arc.setFiveBeat('s1', 's2', 's3', 's5', 's4');

      const validation = arc.validateAridFlow();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('order'))).toBe(true);
    });

    test('should validate phase order', () => {
      const arc = new Arc('arc1', 'Test Arc');
      arc.scenes = ['s1', 's2', 's3'];
      arc.initializeAridFlow();

      // Impact before anchor
      arc.addToAridPhase('impact', 's1');
      arc.addToAridPhase('anchor', 's2');

      const validation = arc.validateAridFlow();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('after'))).toBe(true);
    });
  });
});
