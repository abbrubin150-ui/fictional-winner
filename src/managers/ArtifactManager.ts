/**
 * ArtifactManager - Manages artifacts with versioning and tracking
 * PCS (Plot Control System) - Σ-Integrator Framework
 * Version: 2025.11.1
 */

import { GraphDB } from '../core/GraphDB';
import {
  Artifact,
  ArtifactType,
  ArtifactFormat,
  ArtifactSource,
  GenerationSettings,
  ArtifactData
} from '../core/Artifact';
import { ArtifactGenerator, GenerationResult } from './ArtifactGenerator';

/**
 * Artifact template definition
 */
export interface ArtifactTemplate {
  id: string;
  name: string;
  description?: string;
  type: ArtifactType;
  format: ArtifactFormat;
  defaultSettings: GenerationSettings;
  sourceTemplate?: Partial<ArtifactSource>;
}

/**
 * Artifact filter criteria
 */
export interface ArtifactFilter {
  type?: ArtifactType;
  format?: ArtifactFormat;
  status?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
}

/**
 * Artifact statistics
 */
export interface ArtifactStats {
  total: number;
  byType: Record<string, number>;
  byFormat: Record<string, number>;
  byStatus: Record<string, number>;
  totalSize: number;
  totalWords: number;
  avgWordsPerArtifact: number;
}

/**
 * ArtifactManager class
 */
export class ArtifactManager {
  private artifacts: Map<string, Artifact>;
  private templates: Map<string, ArtifactTemplate>;
  private generator: ArtifactGenerator;
  private graph: GraphDB;
  private maxArtifacts: number;
  private autoSave: boolean;

  constructor(graph: GraphDB, options: { maxArtifacts?: number; autoSave?: boolean } = {}) {
    this.artifacts = new Map();
    this.templates = new Map();
    this.generator = new ArtifactGenerator(graph);
    this.graph = graph;
    this.maxArtifacts = options.maxArtifacts || 1000;
    this.autoSave = options.autoSave !== false;

    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default artifact templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: ArtifactTemplate[] = [
      {
        id: 'screenplay-standard',
        name: 'Standard Screenplay',
        description: 'Industry-standard screenplay format',
        type: ArtifactType.SCREENPLAY,
        format: ArtifactFormat.FOUNTAIN,
        defaultSettings: {
          style: 'standard',
          includeSceneNumbers: true,
          includeCharacterNotes: false,
          pageBreaks: true
        }
      },
      {
        id: 'novel-detailed',
        name: 'Detailed Novel',
        description: 'Novel format with full details',
        type: ArtifactType.NOVEL,
        format: ArtifactFormat.MARKDOWN,
        defaultSettings: {
          style: 'detailed',
          includeMetadata: true,
          includeCharacterNotes: true
        }
      },
      {
        id: 'outline-simple',
        name: 'Simple Outline',
        description: 'Basic story outline',
        type: ArtifactType.OUTLINE,
        format: ArtifactFormat.MARKDOWN,
        defaultSettings: {
          style: 'standard',
          includeMetadata: false
        }
      },
      {
        id: 'beatsheet-detailed',
        name: 'Detailed Beat Sheet',
        description: 'Comprehensive beat-by-beat breakdown',
        type: ArtifactType.BEAT_SHEET,
        format: ArtifactFormat.MARKDOWN,
        defaultSettings: {
          style: 'detailed',
          includeMetadata: true,
          includeCharacterNotes: true
        }
      },
      {
        id: 'character-full',
        name: 'Full Character Profiles',
        description: 'Complete character documentation',
        type: ArtifactType.CHARACTER_PROFILE,
        format: ArtifactFormat.MARKDOWN,
        defaultSettings: {
          style: 'detailed',
          includeCharacterNotes: true
        }
      },
      {
        id: 'storybible-complete',
        name: 'Complete Story Bible',
        description: 'Comprehensive story documentation',
        type: ArtifactType.STORY_BIBLE,
        format: ArtifactFormat.MARKDOWN,
        defaultSettings: {
          style: 'detailed',
          includeMetadata: true,
          includeCharacterNotes: true
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Create a new artifact
   */
  async createArtifact(
    name: string,
    type: ArtifactType,
    format: ArtifactFormat,
    source: ArtifactSource,
    settings: GenerationSettings = {}
  ): Promise<GenerationResult> {
    if (this.artifacts.size >= this.maxArtifacts) {
      throw new Error(`Maximum artifacts limit (${this.maxArtifacts}) reached`);
    }

    const result = await this.generator.generate(name, type, format, source, settings);
    this.artifacts.set(result.artifact.id, result.artifact);

    return result;
  }

  /**
   * Create artifact from template
   */
  async createFromTemplate(
    templateId: string,
    name: string,
    source: ArtifactSource,
    settingsOverride: GenerationSettings = {}
  ): Promise<GenerationResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const mergedSettings = { ...template.defaultSettings, ...settingsOverride };
    const mergedSource = { ...template.sourceTemplate, ...source };

    return this.createArtifact(name, template.type, template.format, mergedSource, mergedSettings);
  }

  /**
   * Get artifact by ID
   */
  getArtifact(id: string): Artifact | null {
    return this.artifacts.get(id) || null;
  }

  /**
   * Get all artifacts
   */
  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * Update artifact
   */
  updateArtifact(id: string, updates: Partial<Omit<Artifact, 'id' | 'metadata'>>): boolean {
    const artifact = this.artifacts.get(id);
    if (!artifact) return false;

    artifact.update(updates);
    return true;
  }

  /**
   * Delete artifact
   */
  deleteArtifact(id: string): boolean {
    return this.artifacts.delete(id);
  }

  /**
   * Regenerate artifact with latest graph data
   */
  async regenerateArtifact(id: string): Promise<GenerationResult | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    const result = await this.generator.regenerate(artifact);

    // Update the existing artifact
    artifact.setContent(result.artifact.content);

    return {
      artifact,
      stats: result.stats,
      warnings: result.warnings
    };
  }

  /**
   * Regenerate all artifacts
   */
  async regenerateAll(): Promise<Map<string, GenerationResult>> {
    const results = new Map<string, GenerationResult>();

    for (const [id, artifact] of this.artifacts.entries()) {
      try {
        const result = await this.regenerateArtifact(id);
        if (result) {
          results.set(id, result);
        }
      } catch (error) {
        console.error(`Failed to regenerate artifact ${id}:`, error);
      }
    }

    return results;
  }

  /**
   * Filter artifacts
   */
  filterArtifacts(filter: ArtifactFilter): Artifact[] {
    let filtered = this.getAllArtifacts();

    if (filter.type) {
      filtered = filtered.filter(a => a.type === filter.type);
    }

    if (filter.format) {
      filtered = filtered.filter(a => a.format === filter.format);
    }

    if (filter.status) {
      filtered = filtered.filter(a => a.metadata.status === filter.status);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(a =>
        filter.tags!.some(tag => a.metadata.tags?.includes(tag))
      );
    }

    if (filter.createdAfter) {
      filtered = filtered.filter(a => a.metadata.createdAt >= filter.createdAfter!);
    }

    if (filter.createdBefore) {
      filtered = filtered.filter(a => a.metadata.createdAt <= filter.createdBefore!);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.name.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.content.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Get artifact statistics
   */
  getStats(): ArtifactStats {
    const artifacts = this.getAllArtifacts();

    const byType: Record<string, number> = {};
    const byFormat: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalSize = 0;
    let totalWords = 0;

    artifacts.forEach(artifact => {
      // Count by type
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;

      // Count by format
      byFormat[artifact.format] = (byFormat[artifact.format] || 0) + 1;

      // Count by status
      const status = artifact.metadata.status || 'draft';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Accumulate size and words
      totalSize += artifact.getSize();
      totalWords += artifact.getWordCount();
    });

    return {
      total: artifacts.length,
      byType,
      byFormat,
      byStatus,
      totalSize,
      totalWords,
      avgWordsPerArtifact: artifacts.length > 0 ? totalWords / artifacts.length : 0
    };
  }

  /**
   * Export artifact to specific format
   */
  async exportArtifact(
    id: string,
    targetFormat: ArtifactFormat
  ): Promise<{ content: string; format: ArtifactFormat } | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    // If already in target format, return as-is
    if (artifact.format === targetFormat) {
      return { content: artifact.content, format: artifact.format };
    }

    // For now, return the content as-is with a note
    // In a full implementation, we'd convert between formats
    let content = artifact.content;

    if (targetFormat === ArtifactFormat.HTML && artifact.format === ArtifactFormat.MARKDOWN) {
      // Simple markdown to HTML conversion (basic)
      content = this.convertMarkdownToHTML(content);
    }

    return { content, format: targetFormat };
  }

  /**
   * Simple markdown to HTML converter (basic implementation)
   */
  private convertMarkdownToHTML(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>\n');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  }

  /**
   * Add custom template
   */
  addTemplate(template: ArtifactTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ArtifactTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ArtifactTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Clear all artifacts
   */
  clear(): void {
    this.artifacts.clear();
  }

  /**
   * Get artifact count
   */
  count(): number {
    return this.artifacts.size;
  }

  /**
   * Check if artifact exists
   */
  hasArtifact(id: string): boolean {
    return this.artifacts.has(id);
  }

  /**
   * Clone artifact
   */
  cloneArtifact(id: string, newName?: string): Artifact | null {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    const cloned = artifact.clone(newName);
    this.artifacts.set(cloned.id, cloned);

    return cloned;
  }

  /**
   * Create snapshot of all artifacts
   */
  createSnapshot(): {
    artifacts: ArtifactData[];
    templates: ArtifactTemplate[];
    metadata: {
      timestamp: Date;
      count: number;
    };
  } {
    return {
      artifacts: this.getAllArtifacts().map(a => a.toJSON()),
      templates: this.getAllTemplates(),
      metadata: {
        timestamp: new Date(),
        count: this.artifacts.size
      }
    };
  }

  /**
   * Load snapshot
   */
  loadSnapshot(snapshot: {
    artifacts: ArtifactData[];
    templates?: ArtifactTemplate[];
  }): void {
    this.artifacts.clear();

    snapshot.artifacts.forEach(data => {
      const artifact = Artifact.fromJSON(data);
      this.artifacts.set(artifact.id, artifact);
    });

    if (snapshot.templates) {
      snapshot.templates.forEach(template => {
        this.templates.set(template.id, template);
      });
    }
  }

  /**
   * Get artifacts by type
   */
  getArtifactsByType(type: ArtifactType): Artifact[] {
    return this.getAllArtifacts().filter(a => a.type === type);
  }

  /**
   * Get artifacts by format
   */
  getArtifactsByFormat(format: ArtifactFormat): Artifact[] {
    return this.getAllArtifacts().filter(a => a.format === format);
  }

  /**
   * Get artifacts by status
   */
  getArtifactsByStatus(status: string): Artifact[] {
    return this.getAllArtifacts().filter(a => a.metadata.status === status);
  }

  /**
   * Search artifacts
   */
  searchArtifacts(query: string): Artifact[] {
    const term = query.toLowerCase();
    return this.getAllArtifacts().filter(
      a =>
        a.name.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term) ||
        a.metadata.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }

  /**
   * Get recently updated artifacts
   */
  getRecentArtifacts(limit: number = 10): Artifact[] {
    return this.getAllArtifacts()
      .sort((a, b) => b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get artifacts that need regeneration (source data changed)
   * Compares source entity update timestamps with artifact's last regeneration time
   */
  getOutdatedArtifacts(): Artifact[] {
    const outdatedArtifacts: Artifact[] = [];

    for (const artifact of this.artifacts.values()) {
      // Get the artifact's last regeneration timestamp
      // Use lastRegeneratedAt if available, otherwise fall back to updatedAt
      const artifactTimestamp = artifact.metadata.lastRegeneratedAt || artifact.metadata.updatedAt;

      let isOutdated = false;

      // Check if any source scenes were updated after artifact generation
      if (artifact.source.sceneIds && artifact.source.sceneIds.length > 0) {
        for (const sceneId of artifact.source.sceneIds) {
          const scene = this.graph.getScene(sceneId);
          if (scene && scene.metadata.updatedAt > artifactTimestamp) {
            isOutdated = true;
            break;
          }
        }
      }

      // Check if any source arcs were updated after artifact generation
      if (!isOutdated && artifact.source.arcIds && artifact.source.arcIds.length > 0) {
        for (const arcId of artifact.source.arcIds) {
          const arc = this.graph.getArc(arcId);
          if (arc && arc.metadata.updatedAt > artifactTimestamp) {
            isOutdated = true;
            break;
          }
        }
      }

      // Check if any source characters were updated after artifact generation
      if (!isOutdated && artifact.source.characterIds && artifact.source.characterIds.length > 0) {
        for (const characterId of artifact.source.characterIds) {
          const character = this.graph.getCharacter(characterId);
          if (character && character.metadata.updatedAt > artifactTimestamp) {
            isOutdated = true;
            break;
          }
        }
      }

      // If includeAll is true, check all entities in the graph
      if (!isOutdated && artifact.source.includeAll) {
        // Check all scenes
        for (const scene of this.graph.getAllScenes()) {
          if (scene.metadata.updatedAt > artifactTimestamp) {
            isOutdated = true;
            break;
          }
        }

        // Check all arcs if not already outdated
        if (!isOutdated) {
          for (const arc of this.graph.getAllArcs()) {
            if (arc.metadata.updatedAt > artifactTimestamp) {
              isOutdated = true;
              break;
            }
          }
        }

        // Check all characters if not already outdated
        if (!isOutdated) {
          for (const character of this.graph.getAllCharacters()) {
            if (character.metadata.updatedAt > artifactTimestamp) {
              isOutdated = true;
              break;
            }
          }
        }
      }

      if (isOutdated) {
        outdatedArtifacts.push(artifact);
      }
    }

    return outdatedArtifacts;
  }
}
