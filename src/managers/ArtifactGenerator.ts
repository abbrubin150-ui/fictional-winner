/**
 * ArtifactGenerator - Generates formatted narrative outputs
 * PCS (Plot Control System) - Σ-Integrator Framework
 * Version: 2025.11.1
 */

import { GraphDB } from '../core/GraphDB';
import { Scene } from '../core/Scene';
import { Arc } from '../core/Arc';
import { Character } from '../core/Character';
import {
  Artifact,
  ArtifactType,
  ArtifactFormat,
  ArtifactSource,
  GenerationSettings
} from '../core/Artifact';

/**
 * Generator result with statistics
 */
export interface GenerationResult {
  artifact: Artifact;
  stats: {
    scenesIncluded: number;
    arcsIncluded: number;
    charactersIncluded: number;
    totalWords: number;
    totalLines: number;
    generationTime: number;
  };
  warnings: string[];
}

/**
 * ArtifactGenerator class
 */
export class ArtifactGenerator {
  private graph: GraphDB;

  constructor(graph: GraphDB) {
    this.graph = graph;
  }

  /**
   * Generate artifact from graph data
   */
  async generate(
    name: string,
    type: ArtifactType,
    format: ArtifactFormat,
    source: ArtifactSource,
    settings: GenerationSettings = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Create artifact
    const artifact = new Artifact(name, type, format, source, settings);

    // Gather source data
    const { scenes, arcs, characters } = this.gatherSourceData(source);

    if (scenes.length === 0 && !source.includeAll) {
      warnings.push('No scenes found matching source criteria');
    }

    // Generate content based on type
    let content = '';
    switch (type) {
      case ArtifactType.SCREENPLAY:
        content = this.generateScreenplay(scenes, arcs, characters, settings);
        break;
      case ArtifactType.NOVEL:
        content = this.generateNovel(scenes, arcs, characters, settings);
        break;
      case ArtifactType.OUTLINE:
        content = this.generateOutline(scenes, arcs, characters, settings);
        break;
      case ArtifactType.BEAT_SHEET:
        content = this.generateBeatSheet(scenes, arcs, characters, settings);
        break;
      case ArtifactType.CHARACTER_PROFILE:
        content = this.generateCharacterProfile(characters, scenes, settings);
        break;
      case ArtifactType.TIMELINE:
        content = this.generateTimeline(scenes, arcs, settings);
        break;
      case ArtifactType.STORY_BIBLE:
        content = this.generateStoryBible(scenes, arcs, characters, settings);
        break;
      case ArtifactType.TREATMENT:
        content = this.generateTreatment(scenes, arcs, characters, settings);
        break;
      case ArtifactType.SYNOPSIS:
        content = this.generateSynopsis(scenes, arcs, characters, settings);
        break;
      default:
        content = this.generateCustom(scenes, arcs, characters, settings);
    }

    artifact.setContent(content);

    const endTime = Date.now();

    return {
      artifact,
      stats: {
        scenesIncluded: scenes.length,
        arcsIncluded: arcs.length,
        charactersIncluded: characters.length,
        totalWords: artifact.getWordCount(),
        totalLines: artifact.getLineCount(),
        generationTime: endTime - startTime
      },
      warnings
    };
  }

  /**
   * Gather source data from graph
   */
  private gatherSourceData(source: ArtifactSource): {
    scenes: Scene[];
    arcs: Arc[];
    characters: Character[];
  } {
    let scenes: Scene[] = [];
    let arcs: Arc[] = [];
    let characters: Character[] = [];

    if (source.includeAll) {
      scenes = this.graph.getAllScenes();
      arcs = this.graph.getAllArcs();
      characters = this.graph.getAllCharacters();
    } else {
      // Gather specific scenes
      if (source.sceneIds) {
        scenes = source.sceneIds
          .map(id => this.graph.getScene(id))
          .filter((s): s is Scene => s !== null);
      }

      // Gather specific arcs
      if (source.arcIds) {
        arcs = source.arcIds.map(id => this.graph.getArc(id)).filter((a): a is Arc => a !== null);

        // Include scenes from arcs
        arcs.forEach(arc => {
          arc.scenes.forEach(sceneId => {
            const scene = this.graph.getScene(sceneId);
            if (scene && !scenes.find(s => s.id === scene.id)) {
              scenes.push(scene);
            }
          });
        });
      }

      // Gather specific characters
      if (source.characterIds) {
        characters = source.characterIds
          .map(id => this.graph.getCharacter(id))
          .filter((c): c is Character => c !== null);
      }

      // Auto-include characters that appear in included scenes
      scenes.forEach(scene => {
        scene.characterPresence?.forEach(charId => {
          const char = this.graph.getCharacter(charId);
          if (char && !characters.find(c => c.id === char.id)) {
            characters.push(char);
          }
        });
      });
    }

    return { scenes, arcs, characters };
  }

  /**
   * Generate screenplay format
   */
  private generateScreenplay(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    // Title page
    output += '# SCREENPLAY\n\n';
    if (settings.includeMetadata) {
      output += `Generated: ${new Date().toLocaleDateString()}\n`;
      output += `Scenes: ${scenes.length}\n`;
      output += `Characters: ${characters.length}\n\n`;
    }

    output += '---\n\n';

    // Generate scenes in screenplay format
    scenes.forEach((scene, index) => {
      if (settings.includeSceneNumbers) {
        output += `**SCENE ${index + 1}**\n\n`;
      }

      // INT/EXT heading
      output += `**${scene.title.toUpperCase()}**\n\n`;

      // Premise as action
      if (scene.premise) {
        output += `${scene.premise}\n\n`;
      }

      // How as additional action
      if (scene.how && settings.style === 'detailed') {
        output += `${scene.how}\n\n`;
      }

      // Character presence note
      if (settings.includeCharacterNotes && scene.characterPresence?.length) {
        const charNames = scene.characterPresence
          .map(id => this.graph.getCharacter(id)?.name || id)
          .join(', ');
        output += `*Characters: ${charNames}*\n\n`;
      }

      if (settings.pageBreaks && index < scenes.length - 1) {
        output += '---\n\n';
      }
    });

    return output;
  }

  /**
   * Generate novel/prose format
   */
  private generateNovel(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    // Title
    output += '# NOVEL\n\n';
    if (settings.includeMetadata) {
      output += `*Generated: ${new Date().toLocaleDateString()}*\n`;
      output += `*${scenes.length} scenes across ${arcs.length} arcs*\n\n`;
    }

    output += '---\n\n';

    // Organize by arcs
    arcs.forEach((arc, arcIndex) => {
      output += `## Arc ${arcIndex + 1}: ${arc.intent || 'Untitled Arc'}\n\n`;

      const arcScenes = arc.scenes
        .map(id => scenes.find(s => s.id === id))
        .filter((s): s is Scene => s !== undefined);

      arcScenes.forEach((scene, sceneIndex) => {
        output += `### Scene ${sceneIndex + 1}: ${scene.title}\n\n`;
        output += `${scene.premise}\n\n`;

        if (scene.how && settings.style === 'detailed') {
          output += `*${scene.how}*\n\n`;
        }

        if (scene.why && settings.style === 'detailed') {
          output += `> **Why this scene:** ${scene.why}\n\n`;
        }
      });

      if (arcIndex < arcs.length - 1) {
        output += '\n---\n\n';
      }
    });

    // Include orphaned scenes (not in any arc)
    const orphanedScenes = scenes.filter(
      scene => !arcs.some(arc => arc.scenes.includes(scene.id))
    );

    if (orphanedScenes.length > 0) {
      output += '## Additional Scenes\n\n';
      orphanedScenes.forEach(scene => {
        output += `### ${scene.title}\n\n`;
        output += `${scene.premise}\n\n`;
      });
    }

    return output;
  }

  /**
   * Generate outline format
   */
  private generateOutline(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# STORY OUTLINE\n\n';
    if (settings.includeMetadata) {
      output += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
      output += `**Statistics:**\n`;
      output += `- Arcs: ${arcs.length}\n`;
      output += `- Scenes: ${scenes.length}\n`;
      output += `- Characters: ${characters.length}\n\n`;
    }

    output += '---\n\n';

    // Organize by arcs
    arcs.forEach((arc, arcIndex) => {
      output += `## ${arcIndex + 1}. ${arc.intent || 'Untitled Arc'}\n\n`;

      if (settings.style === 'detailed' && arc.metadata?.status) {
        output += `*Status: ${arc.metadata.status}*\n\n`;
      }

      const arcScenes = arc.scenes
        .map(id => scenes.find(s => s.id === id))
        .filter((s): s is Scene => s !== undefined);

      arcScenes.forEach((scene, sceneIndex) => {
        output += `   ${arcIndex + 1}.${sceneIndex + 1}. **${scene.title}**\n`;
        output += `      - ${scene.premise}\n`;

        if (scene.why && settings.style === 'detailed') {
          output += `      - *Purpose:* ${scene.why}\n`;
        }

        if (scene.characterPresence?.length && settings.includeCharacterNotes) {
          const charNames = scene.characterPresence
            .map(id => this.graph.getCharacter(id)?.name || id)
            .join(', ');
          output += `      - *Characters:* ${charNames}\n`;
        }

        output += '\n';
      });
    });

    return output;
  }

  /**
   * Generate beat sheet
   */
  private generateBeatSheet(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# BEAT SHEET\n\n';
    if (settings.includeMetadata) {
      output += `**Generated:** ${new Date().toLocaleDateString()}\n`;
      output += `**Total Beats:** ${scenes.length}\n\n`;
    }

    output += '---\n\n';

    // List all scenes as beats
    scenes.forEach((scene, index) => {
      output += `## Beat ${index + 1}: ${scene.title}\n\n`;
      output += `**What Happens:** ${scene.premise}\n\n`;

      if (scene.why) {
        output += `**Why:** ${scene.why}\n\n`;
      }

      if (scene.how && settings.style === 'detailed') {
        output += `**How:** ${scene.how}\n\n`;
      }

      if (scene.cost !== undefined) {
        output += `**Complexity:** ${scene.cost}/10\n\n`;
      }

      if (scene.characterPresence?.length && settings.includeCharacterNotes) {
        const charNames = scene.characterPresence
          .map(id => this.graph.getCharacter(id)?.name || id)
          .join(', ');
        output += `**Characters:** ${charNames}\n\n`;
      }

      // Find which arcs include this scene
      const containingArcs = arcs.filter(arc => arc.scenes.includes(scene.id));
      if (containingArcs.length > 0 && settings.style === 'detailed') {
        output += `**Arcs:** ${containingArcs.map(a => a.intent || a.id).join(', ')}\n\n`;
      }

      if (index < scenes.length - 1) {
        output += '---\n\n';
      }
    });

    return output;
  }

  /**
   * Generate character profiles
   */
  private generateCharacterProfile(
    characters: Character[],
    scenes: Scene[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# CHARACTER PROFILES\n\n';
    if (settings.includeMetadata) {
      output += `**Generated:** ${new Date().toLocaleDateString()}\n`;
      output += `**Total Characters:** ${characters.length}\n\n`;
    }

    output += '---\n\n';

    characters.forEach((character, index) => {
      output += `## ${index + 1}. ${character.name}\n\n`;

      if (character.description) {
        output += `**Description:** ${character.description}\n\n`;
      }

      if (character.role) {
        output += `**Role:** ${character.role}\n\n`;
      }

      if (character.traits?.length) {
        output += `**Traits:** ${character.traits.join(', ')}\n\n`;
      }

      // Scene presence
      const characterScenes = scenes.filter(s =>
        s.characterPresence?.includes(character.id)
      );
      if (characterScenes.length > 0) {
        output += `**Appears in ${characterScenes.length} scene(s)**\n\n`;

        if (settings.style === 'detailed') {
          output += `*Scenes:*\n`;
          characterScenes.forEach(scene => {
            output += `- ${scene.title}\n`;
          });
          output += '\n';
        }
      }

      // Relationships
      if (character.relationships?.length && settings.style !== 'minimal') {
        output += `**Relationships:**\n`;
        character.relationships.forEach(rel => {
          const otherChar = this.graph.getCharacter(rel.characterId);
          const name = otherChar?.name || rel.characterId;
          output += `- ${name}: ${rel.type} (strength: ${rel.strength}/10)\n`;
        });
        output += '\n';
      }

      // Character arc
      if (character.arcData && settings.style === 'detailed') {
        output += `**Character Arc:**\n`;
        if (character.arcData.startingState) {
          output += `- Starting: ${character.arcData.startingState}\n`;
        }
        if (character.arcData.currentState) {
          output += `- Current: ${character.arcData.currentState}\n`;
        }
        if (character.arcData.desiredEndState) {
          output += `- Goal: ${character.arcData.desiredEndState}\n`;
        }
        output += '\n';
      }

      if (index < characters.length - 1) {
        output += '---\n\n';
      }
    });

    return output;
  }

  /**
   * Generate timeline
   */
  private generateTimeline(
    scenes: Scene[],
    arcs: Arc[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# TIMELINE\n\n';
    if (settings.includeMetadata) {
      output += `**Generated:** ${new Date().toLocaleDateString()}\n`;
      output += `**Total Scenes:** ${scenes.length}\n\n`;
    }

    output += '---\n\n';

    // Simple chronological timeline
    scenes.forEach((scene, index) => {
      output += `**${index + 1}.** ${scene.title}\n`;
      output += `   └─ ${scene.premise}\n\n`;
    });

    return output;
  }

  /**
   * Generate story bible
   */
  private generateStoryBible(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# STORY BIBLE\n\n';
    output += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    output += '---\n\n';

    // Overview
    output += '## Overview\n\n';
    output += `- **Total Arcs:** ${arcs.length}\n`;
    output += `- **Total Scenes:** ${scenes.length}\n`;
    output += `- **Total Characters:** ${characters.length}\n`;
    output += `- **Total Complexity:** ${scenes.reduce((sum, s) => sum + (s.cost || 0), 0)}\n\n`;

    // Arcs section
    output += '## Story Arcs\n\n';
    arcs.forEach((arc, index) => {
      output += `### Arc ${index + 1}: ${arc.intent || 'Untitled'}\n\n`;
      output += `- **Scenes:** ${arc.scenes.length}\n`;
      if (arc.metadata?.status) {
        output += `- **Status:** ${arc.metadata.status}\n`;
      }
      output += '\n';
    });

    // Characters section
    output += '## Characters\n\n';
    characters.forEach(char => {
      output += `### ${char.name}\n`;
      if (char.description) output += `${char.description}\n`;
      output += '\n';
    });

    // Scenes section
    output += '## Scenes\n\n';
    scenes.forEach((scene, index) => {
      output += `### ${index + 1}. ${scene.title}\n`;
      output += `${scene.premise}\n\n`;
    });

    return output;
  }

  /**
   * Generate treatment
   */
  private generateTreatment(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# TREATMENT\n\n';
    output += '---\n\n';

    // Write as flowing narrative
    arcs.forEach(arc => {
      const arcScenes = arc.scenes
        .map(id => scenes.find(s => s.id === id))
        .filter((s): s is Scene => s !== undefined);

      arcScenes.forEach(scene => {
        output += `${scene.premise} `;
      });

      output += '\n\n';
    });

    return output;
  }

  /**
   * Generate synopsis
   */
  private generateSynopsis(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    let output = '';

    output += '# SYNOPSIS\n\n';

    // Concise summary
    arcs.forEach((arc, index) => {
      if (index > 0) output += ' ';
      output += arc.intent || `Arc ${index + 1}`;
      if (index < arcs.length - 1) output += '.';
    });

    output += '\n\n';

    // Scene count and characters
    output += `The story unfolds across ${scenes.length} scenes, featuring ${characters.length} characters. `;

    if (characters.length > 0) {
      const mainChars = characters.slice(0, 3).map(c => c.name);
      output += `Key characters include ${mainChars.join(', ')}.`;
    }

    return output;
  }

  /**
   * Generate custom format
   */
  private generateCustom(
    scenes: Scene[],
    arcs: Arc[],
    characters: Character[],
    settings: GenerationSettings
  ): string {
    // Default to outline format for custom
    return this.generateOutline(scenes, arcs, characters, settings);
  }

  /**
   * Regenerate artifact with updated graph data
   */
  async regenerate(artifact: Artifact): Promise<GenerationResult> {
    return this.generate(
      artifact.name,
      artifact.type,
      artifact.format,
      artifact.source,
      artifact.settings
    );
  }
}
