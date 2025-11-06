/**
 * PCS API Server
 * 
 * REST API for Plot Control System
 * Endpoints for Scenes, Arcs, and Decision Ledger
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GraphDB } from '../core/GraphDB';
import { DecisionLedger, DecisionType } from '../ledger/DecisionLedger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize core systems
const graphDB = new GraphDB();
const ledger = new DecisionLedger();

// Record initialization
ledger.recordDecision(
  'EXECUTE',
  'Initialize core graph',
  'Role Model a',
  { action: 'system_init' },
  365 // Valid for 1 year
);

// ============ HEALTH CHECK ============

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '2025.11.1',
    timestamp: new Date(),
    stats: graphDB.getStats(),
  });
});

// ============ SCENE ENDPOINTS ============

/**
 * POST /scene - Create new scene
 */
app.post('/scene', (req: Request, res: Response) => {
  try {
    const { title, premise, why, how, cost } = req.body;

    if (!title || !premise || !why || !how || cost === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: title, premise, why, how, cost',
      });
    }

    const scene = graphDB.createScene({
      title,
      premise,
      why,
      how,
      cost,
    });

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Created scene: ${title}`,
      '∴Auditor',
      { action: 'scene_create', sceneId: scene.id }
    );

    res.status(201).json(scene.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /scene/:id - Get scene by ID
 */
app.get('/scene/:id', (req: Request, res: Response) => {
  try {
    const scene = graphDB.getScene(req.params.id);
    
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    res.json(scene.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /scenes - Get all scenes
 */
app.get('/scenes', (req: Request, res: Response) => {
  try {
    const scenes = graphDB.getAllScenes();
    res.json(scenes.map((s) => s.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /scene/:id - Update scene
 */
app.put('/scene/:id', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const scene = graphDB.updateScene(req.params.id, updates);

    ledger.recordDecision(
      'EXECUTE',
      `Updated scene: ${scene.title}`,
      '∴Auditor',
      { action: 'scene_update', sceneId: scene.id }
    );

    res.json(scene.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /scene/:id - Delete scene
 */
app.delete('/scene/:id', (req: Request, res: Response) => {
  try {
    const deleted = graphDB.deleteScene(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    ledger.recordDecision(
      'EXECUTE',
      `Deleted scene: ${req.params.id}`,
      '∴Auditor',
      { action: 'scene_delete', sceneId: req.params.id }
    );

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============ ARC ENDPOINTS ============

/**
 * POST /arc - Create new arc
 */
app.post('/arc', (req: Request, res: Response) => {
  try {
    const { intent } = req.body;

    if (!intent) {
      return res.status(400).json({ error: 'Missing required field: intent' });
    }

    const arc = graphDB.createArc(intent);

    ledger.recordDecision(
      'EXECUTE',
      `Created arc: ${intent}`,
      '∴Auditor',
      { action: 'arc_create', arcId: arc.id }
    );

    res.status(201).json(arc.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /arc/:id - Get arc by ID
 */
app.get('/arc/:id', (req: Request, res: Response) => {
  try {
    const arc = graphDB.getArc(req.params.id);
    
    if (!arc) {
      return res.status(404).json({ error: 'Arc not found' });
    }

    res.json(arc.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /arcs - Get all arcs
 */
app.get('/arcs', (req: Request, res: Response) => {
  try {
    const arcs = graphDB.getAllArcs();
    res.json(arcs.map((a) => a.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /arc/:id/scene - Add scene to arc
 */
app.post('/arc/:id/scene', (req: Request, res: Response) => {
  try {
    const { sceneId, position } = req.body;

    if (!sceneId) {
      return res.status(400).json({ error: 'Missing required field: sceneId' });
    }

    graphDB.addSceneToArc(req.params.id, sceneId, position);

    ledger.recordDecision(
      'EXECUTE',
      `Added scene ${sceneId} to arc ${req.params.id}`,
      '∴Auditor',
      { action: 'arc_add_scene', arcId: req.params.id, sceneId }
    );

    const arc = graphDB.getArc(req.params.id);
    res.json(arc?.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /arc/:id - Delete arc
 */
app.delete('/arc/:id', (req: Request, res: Response) => {
  try {
    const deleted = graphDB.deleteArc(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Arc not found' });
    }

    ledger.recordDecision(
      'EXECUTE',
      `Deleted arc: ${req.params.id}`,
      '∴Auditor',
      { action: 'arc_delete', arcId: req.params.id }
    );

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============ LEDGER ENDPOINTS ============

/**
 * GET /ledger - Get all decisions
 */
app.get('/ledger', (req: Request, res: Response) => {
  try {
    const decisions = ledger.getAllDecisions();
    res.json(decisions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /ledger/active - Get active decisions
 */
app.get('/ledger/active', (req: Request, res: Response) => {
  try {
    const decisions = ledger.getActiveDecisions();
    res.json(decisions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /ledger/stats - Get ledger statistics
 */
app.get('/ledger/stats', (req: Request, res: Response) => {
  try {
    const stats = ledger.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /ledger/decision - Record a new decision
 */
app.post('/ledger/decision', (req: Request, res: Response) => {
  try {
    const { decision, rationale, witness, context, expiryDays } = req.body;

    if (!decision || !rationale || !witness) {
      return res.status(400).json({
        error: 'Missing required fields: decision, rationale, witness',
      });
    }

    const entry = ledger.recordDecision(
      decision as DecisionType,
      rationale,
      witness,
      context,
      expiryDays
    );

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /ledger/export - Export ledger as YAML
 */
app.get('/ledger/export', (req: Request, res: Response) => {
  try {
    const yaml = ledger.exportToYAML();
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============ GRAPH ENDPOINTS ============

/**
 * GET /graph/stats - Get graph statistics
 */
app.get('/graph/stats', (req: Request, res: Response) => {
  try {
    const stats = graphDB.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /graph/snapshot - Create snapshot of current graph
 */
app.get('/graph/snapshot', (req: Request, res: Response) => {
  try {
    const snapshot = graphDB.createSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🚀 PCS API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 GraphDB initialized`);
  console.log(`📝 Decision Ledger active`);
  console.log(`\n✅ Sprint 1 - Core Implementation Ready`);
});

export default app;
