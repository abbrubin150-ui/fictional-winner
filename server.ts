/**
 * PCS API Server
 * 
 * REST API for Plot Control System
 * Endpoints for Scenes, Arcs, and Decision Ledger
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GraphDB } from './src/core/GraphDB';
import { DecisionLedger, DecisionType } from './src/utils/DecisionLedger';
import { ArtifactManager } from './src/managers/ArtifactManager';
import { ArtifactType, ArtifactFormat } from './src/core/Artifact';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize core systems
const graphDB = new GraphDB();
const ledger = new DecisionLedger();
const artifactManager = new ArtifactManager(graphDB);

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

// ============ CHARACTER ENDPOINTS ============

/**
 * POST /character - Create new character
 */
app.post('/character', (req: Request, res: Response) => {
  try {
    const { name, description, role, traits, relationships, scenePresence, arcData } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        error: 'Missing required fields: name, description',
      });
    }

    const character = graphDB.createCharacter({
      name,
      description,
      role: role || 'other',
      traits,
      relationships,
      scenePresence,
      arcData,
    });

    ledger.recordDecision(
      'EXECUTE',
      `Created character: ${name}`,
      '∴Auditor',
      { action: 'character_create', characterId: character.id }
    );

    res.status(201).json(character.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /character/:id - Get character by ID
 */
app.get('/character/:id', (req: Request, res: Response) => {
  try {
    const character = graphDB.getCharacter(req.params.id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /characters - Get all characters
 */
app.get('/characters', (req: Request, res: Response) => {
  try {
    const characters = graphDB.getAllCharacters();
    res.json(characters.map((c) => c.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /character/:id - Update character
 */
app.put('/character/:id', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const character = graphDB.updateCharacter(req.params.id, updates);

    ledger.recordDecision(
      'EXECUTE',
      `Updated character: ${character.name}`,
      '∴Auditor',
      { action: 'character_update', characterId: character.id }
    );

    res.json(character.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /character/:id - Delete character
 */
app.delete('/character/:id', (req: Request, res: Response) => {
  try {
    const deleted = graphDB.deleteCharacter(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Character not found' });
    }

    ledger.recordDecision(
      'EXECUTE',
      `Deleted character: ${req.params.id}`,
      '∴Auditor',
      { action: 'character_delete', characterId: req.params.id }
    );

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /character/:id/scene - Add character to scene
 */
app.post('/character/:id/scene', (req: Request, res: Response) => {
  try {
    const { sceneId } = req.body;

    if (!sceneId) {
      return res.status(400).json({ error: 'Missing required field: sceneId' });
    }

    graphDB.addCharacterToScene(req.params.id, sceneId);

    ledger.recordDecision(
      'EXECUTE',
      `Added character ${req.params.id} to scene ${sceneId}`,
      '∴Auditor',
      { action: 'character_add_to_scene', characterId: req.params.id, sceneId }
    );

    const character = graphDB.getCharacter(req.params.id);
    res.json(character?.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /character/:id/scene/:sceneId - Remove character from scene
 */
app.delete('/character/:id/scene/:sceneId', (req: Request, res: Response) => {
  try {
    graphDB.removeCharacterFromScene(req.params.id, req.params.sceneId);

    ledger.recordDecision(
      'EXECUTE',
      `Removed character ${req.params.id} from scene ${req.params.sceneId}`,
      '∴Auditor',
      { action: 'character_remove_from_scene', characterId: req.params.id, sceneId: req.params.sceneId }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /character/:id/scenes - Get all scenes with character
 */
app.get('/character/:id/scenes', (req: Request, res: Response) => {
  try {
    const scenes = graphDB.getScenesWithCharacter(req.params.id);
    res.json(scenes.map((s) => s.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /scene/:id/characters - Get all characters in scene
 */
app.get('/scene/:id/characters', (req: Request, res: Response) => {
  try {
    const characters = graphDB.getCharactersInScene(req.params.id);
    res.json(characters.map((c) => c.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /character/:id/relationship - Create relationship between characters
 */
app.post('/character/:id/relationship', (req: Request, res: Response) => {
  try {
    const { characterId, type, description, strength } = req.body;

    if (!characterId || !type || strength === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: characterId, type, strength',
      });
    }

    graphDB.createRelationship(req.params.id, characterId, {
      type,
      description,
      strength,
    });

    ledger.recordDecision(
      'EXECUTE',
      `Created relationship between ${req.params.id} and ${characterId}`,
      '∴Auditor',
      { action: 'relationship_create', characterId1: req.params.id, characterId2: characterId }
    );

    const character = graphDB.getCharacter(req.params.id);
    res.json(character?.toJSON());
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

// ============ ARTIFACT ENDPOINTS ============

/**
 * POST /artifact - Create new artifact
 */
app.post('/artifact', async (req: Request, res: Response) => {
  try {
    const { name, type, format, source, settings } = req.body;

    if (!name || !type || !format || !source) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, format, source',
      });
    }

    const result = await artifactManager.createArtifact(
      name,
      type as ArtifactType,
      format as ArtifactFormat,
      source,
      settings
    );

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Created artifact: ${name} (${type})`,
      '∴Auditor',
      { action: 'artifact_create', artifactId: result.artifact.id }
    );

    res.status(201).json({
      artifact: result.artifact.toJSON(),
      stats: result.stats,
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /artifact/template - Create artifact from template
 */
app.post('/artifact/template', async (req: Request, res: Response) => {
  try {
    const { templateId, name, source, settings } = req.body;

    if (!templateId || !name || !source) {
      return res.status(400).json({
        error: 'Missing required fields: templateId, name, source',
      });
    }

    const result = await artifactManager.createFromTemplate(
      templateId,
      name,
      source,
      settings
    );

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Created artifact from template: ${templateId}`,
      '∴Auditor',
      { action: 'artifact_create_template', artifactId: result.artifact.id }
    );

    res.status(201).json({
      artifact: result.artifact.toJSON(),
      stats: result.stats,
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /artifact/:id - Get artifact by ID
 */
app.get('/artifact/:id', (req: Request, res: Response) => {
  try {
    const artifact = artifactManager.getArtifact(req.params.id);

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /artifacts - Get all artifacts (with optional filtering)
 */
app.get('/artifacts', (req: Request, res: Response) => {
  try {
    const { type, format, status, tags, search } = req.query;

    let artifacts = artifactManager.getAllArtifacts();

    // Apply filters if provided
    if (type || format || status || tags || search) {
      const filter: any = {};
      if (type) filter.type = type;
      if (format) filter.format = format;
      if (status) filter.status = status;
      if (tags) filter.tags = (tags as string).split(',');
      if (search) filter.searchTerm = search;

      artifacts = artifactManager.filterArtifacts(filter);
    }

    res.json(artifacts.map((a) => a.toJSON()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /artifact/:id - Update artifact
 */
app.put('/artifact/:id', (req: Request, res: Response) => {
  try {
    const { name, description, content, format, settings, metadata } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (format !== undefined) updates.format = format;
    if (settings !== undefined) updates.settings = settings;

    const success = artifactManager.updateArtifact(req.params.id, updates);

    if (!success) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Update metadata separately if provided
    if (metadata) {
      const artifact = artifactManager.getArtifact(req.params.id);
      if (artifact) {
        artifact.updateMetadata(metadata);
      }
    }

    const artifact = artifactManager.getArtifact(req.params.id);

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Updated artifact: ${artifact?.name}`,
      '∴Auditor',
      { action: 'artifact_update', artifactId: req.params.id }
    );

    res.json(artifact?.toJSON());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /artifact/:id - Delete artifact
 */
app.delete('/artifact/:id', (req: Request, res: Response) => {
  try {
    const artifact = artifactManager.getArtifact(req.params.id);

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    const success = artifactManager.deleteArtifact(req.params.id);

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Deleted artifact: ${artifact.name}`,
      '∴Auditor',
      { action: 'artifact_delete', artifactId: req.params.id }
    );

    res.json({ success, artifact: artifact.toJSON() });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /artifact/:id/regenerate - Regenerate artifact with latest data
 */
app.post('/artifact/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const result = await artifactManager.regenerateArtifact(req.params.id);

    if (!result) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Regenerated artifact: ${result.artifact.name}`,
      '∴Auditor',
      { action: 'artifact_regenerate', artifactId: req.params.id }
    );

    res.json({
      artifact: result.artifact.toJSON(),
      stats: result.stats,
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /artifacts/regenerate-all - Regenerate all artifacts
 */
app.post('/artifacts/regenerate-all', async (req: Request, res: Response) => {
  try {
    const results = await artifactManager.regenerateAll();

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Regenerated ${results.size} artifacts`,
      '∴Auditor',
      { action: 'artifacts_regenerate_all' }
    );

    const resultsArray = Array.from(results.entries()).map(([id, result]) => ({
      id,
      artifact: result.artifact.toJSON(),
      stats: result.stats,
      warnings: result.warnings,
    }));

    res.json({
      count: results.size,
      results: resultsArray,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /artifact/:id/export - Export artifact in specific format
 */
app.get('/artifact/:id/export', async (req: Request, res: Response) => {
  try {
    const { format } = req.query;

    if (!format) {
      return res.status(400).json({ error: 'Missing format parameter' });
    }

    const result = await artifactManager.exportArtifact(
      req.params.id,
      format as ArtifactFormat
    );

    if (!result) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Set appropriate content type
    let contentType = 'text/plain';
    if (result.format === ArtifactFormat.HTML) contentType = 'text/html';
    else if (result.format === ArtifactFormat.JSON) contentType = 'application/json';
    else if (result.format === ArtifactFormat.MARKDOWN) contentType = 'text/markdown';

    res.setHeader('Content-Type', contentType);
    res.send(result.content);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /artifact/stats - Get artifact statistics
 */
app.get('/artifact/stats', (req: Request, res: Response) => {
  try {
    const stats = artifactManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /templates - Get all artifact templates
 */
app.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = artifactManager.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /template/:id - Get template by ID
 */
app.get('/template/:id', (req: Request, res: Response) => {
  try {
    const template = artifactManager.getTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /template - Add custom template
 */
app.post('/template', (req: Request, res: Response) => {
  try {
    const template = req.body;

    if (!template.id || !template.name || !template.type || !template.format) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, type, format',
      });
    }

    artifactManager.addTemplate(template);

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Added artifact template: ${template.name}`,
      '∴Auditor',
      { action: 'template_add', templateId: template.id }
    );

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /artifact/:id/clone - Clone artifact
 */
app.post('/artifact/:id/clone', (req: Request, res: Response) => {
  try {
    const { newName } = req.body;
    const cloned = artifactManager.cloneArtifact(req.params.id, newName);

    if (!cloned) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Record decision
    ledger.recordDecision(
      'EXECUTE',
      `Cloned artifact: ${cloned.name}`,
      '∴Auditor',
      { action: 'artifact_clone', sourceId: req.params.id, cloneId: cloned.id }
    );

    res.status(201).json(cloned.toJSON());
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
  console.log(`🎨 Artifact Manager ready`);
  console.log(`\n✅ Sprint 1-4 - Core + Artifact System Ready`);
});

export default app;
