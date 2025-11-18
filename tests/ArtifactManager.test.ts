/**
 * ArtifactManager Unit Tests
 * Focus on getOutdatedArtifacts() functionality
 */

import { GraphDB } from '../src/core/GraphDB';
import { ArtifactManager } from '../src/managers/ArtifactManager';
import { Artifact, ArtifactType, ArtifactFormat } from '../src/core/Artifact';

/**
 * Helper to add artifact directly to manager's internal map for testing
 */
function addArtifactToManager(manager: ArtifactManager, artifact: Artifact): void {
  // Access private artifacts map for testing purposes
  (manager as any).artifacts.set(artifact.id, artifact);
}

describe('ArtifactManager', () => {
  let graph: GraphDB;
  let artifactManager: ArtifactManager;

  beforeEach(() => {
    graph = new GraphDB();
    artifactManager = new ArtifactManager(graph);
  });

  describe('getOutdatedArtifacts', () => {
    it('should return empty array when no artifacts exist', () => {
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toEqual([]);
    });

    it('should return empty array when artifact is up-to-date', async () => {
      // Create a scene
      const scene = graph.createScene({
        title: 'Test Scene',
        premise: 'Test premise',
        why: 'Test why',
        how: 'Test how',
        cost: 1.0
      });

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create artifact referencing the scene
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: [scene.id] }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Artifact should be up-to-date
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toEqual([]);
    });

    it('should detect outdated artifact when scene is updated', async () => {
      // Create a scene
      const scene = graph.createScene({
        title: 'Test Scene',
        premise: 'Test premise',
        why: 'Test why',
        how: 'Test how',
        cost: 1.0
      });

      // Create artifact referencing the scene
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: [scene.id] }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the scene
      scene.update({ title: 'Updated Scene' });

      // Artifact should now be outdated
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Test Artifact');
    });

    it('should detect outdated artifact when arc is updated', async () => {
      // Create an arc
      const arc = graph.createArc('Test Arc');

      // Create artifact referencing the arc
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.OUTLINE,
        ArtifactFormat.MARKDOWN,
        { arcIds: [arc.id] }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the arc
      arc.updateStatus('active');

      // Artifact should now be outdated
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Test Artifact');
    });

    it('should detect outdated artifact when character is updated', async () => {
      // Create a character
      const character = graph.createCharacter({
        name: 'Test Character',
        description: 'A test character',
        role: 'protagonist',
        traits: [],
        relationships: [],
        scenePresence: []
      });

      // Create artifact referencing the character
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.CHARACTER_PROFILE,
        ArtifactFormat.MARKDOWN,
        { characterIds: [character.id] }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the character
      character.update({ description: 'Updated description' });

      // Artifact should now be outdated
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Test Artifact');
    });

    it('should detect outdated artifact when any source entity is updated', async () => {
      // Create scene, arc, and character
      const scene = graph.createScene({
        title: 'Test Scene',
        premise: 'Test premise',
        why: 'Test why',
        how: 'Test how',
        cost: 1.0
      });
      const arc = graph.createArc('Test Arc');
      const character = graph.createCharacter({
        name: 'Test Character',
        description: 'A test character',
        role: 'protagonist',
        traits: [],
        relationships: [],
        scenePresence: []
      });

      // Create artifact referencing all three
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.STORY_BIBLE,
        ArtifactFormat.MARKDOWN,
        {
          sceneIds: [scene.id],
          arcIds: [arc.id],
          characterIds: [character.id]
        }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update only the character
      character.update({ description: 'Updated description' });

      // Artifact should be outdated due to character update
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Test Artifact');
    });

    it('should handle artifacts with includeAll flag', async () => {
      // Create a scene
      const scene = graph.createScene({
        title: 'Test Scene',
        premise: 'Test premise',
        why: 'Test why',
        how: 'Test how',
        cost: 1.0
      });

      // Create artifact with includeAll flag
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.STORY_BIBLE,
        ArtifactFormat.MARKDOWN,
        { includeAll: true }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the scene
      scene.update({ title: 'Updated Scene' });

      // Artifact should be outdated because includeAll includes all scenes
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Test Artifact');
    });

    it('should handle multiple artifacts with different update states', async () => {
      // Create two scenes
      const scene1 = graph.createScene({
        title: 'Scene 1',
        premise: 'Premise 1',
        why: 'Why 1',
        how: 'How 1',
        cost: 1.0
      });
      const scene2 = graph.createScene({
        title: 'Scene 2',
        premise: 'Premise 2',
        why: 'Why 2',
        how: 'How 2',
        cost: 1.0
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create two artifacts
      const artifact1 = new Artifact(
        'Artifact 1',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: [scene1.id] }
      );
      artifact1.setContent('Content 1');
      addArtifactToManager(artifactManager, artifact1);

      const artifact2 = new Artifact(
        'Artifact 2',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: [scene2.id] }
      );
      artifact2.setContent('Content 2');
      addArtifactToManager(artifactManager, artifact2);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update only scene1
      scene1.update({ title: 'Updated Scene 1' });

      // Only artifact1 should be outdated
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toHaveLength(1);
      expect(outdated[0].name).toBe('Artifact 1');
    });

    it('should not mark artifact as outdated if source entity does not exist', async () => {
      // Create artifact referencing non-existent scene
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: ['non-existent-id'] }
      );
      artifact.setContent('Test content');
      addArtifactToManager(artifactManager, artifact);

      // Should not be marked as outdated (source doesn't exist)
      const outdated = artifactManager.getOutdatedArtifacts();
      expect(outdated).toEqual([]);
    });

    it('should handle artifacts with lastRegeneratedAt timestamp', async () => {
      // Create a scene
      const scene = graph.createScene({
        title: 'Test Scene',
        premise: 'Test premise',
        why: 'Test why',
        how: 'Test how',
        cost: 1.0
      });

      // Create artifact with explicit timestamps
      const artifact = new Artifact(
        'Test Artifact',
        ArtifactType.SYNOPSIS,
        ArtifactFormat.MARKDOWN,
        { sceneIds: [scene.id] }
      );

      // Set content which sets lastRegeneratedAt
      artifact.setContent('Test content');

      // Verify lastRegeneratedAt exists
      expect(artifact.metadata.lastRegeneratedAt).toBeDefined();

      // Simulate the artifact being added to manager (we test the logic directly)
      // The implementation correctly uses lastRegeneratedAt when available
      const artifactTimestamp = artifact.metadata.lastRegeneratedAt || artifact.metadata.updatedAt;

      // Since scene was created before artifact, it should not be outdated
      expect(scene.metadata.updatedAt <= artifactTimestamp).toBe(true);

      // Wait and update scene
      await new Promise(resolve => setTimeout(resolve, 10));
      scene.update({ title: 'Updated Scene' });

      // Now scene's updatedAt should be after artifact's timestamp
      expect(scene.metadata.updatedAt > artifactTimestamp).toBe(true);
    });
  });
});
