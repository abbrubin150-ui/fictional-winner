/**
 * Artifact Model - Represents a generated output from narrative data
 * PCS (Plot Control System) - Σ-Integrator Framework
 * Version: 2025.11.1
 */

/**
 * Supported artifact types
 */
export enum ArtifactType {
  SCREENPLAY = 'screenplay',
  NOVEL = 'novel',
  OUTLINE = 'outline',
  BEAT_SHEET = 'beat-sheet',
  CHARACTER_PROFILE = 'character-profile',
  TIMELINE = 'timeline',
  STORY_BIBLE = 'story-bible',
  TREATMENT = 'treatment',
  SYNOPSIS = 'synopsis',
  CUSTOM = 'custom'
}

/**
 * Output format for artifacts
 */
export enum ArtifactFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json',
  TEXT = 'text',
  FOUNTAIN = 'fountain', // Screenplay format
  DOCX = 'docx'
}

/**
 * Source references for artifact generation
 */
export interface ArtifactSource {
  sceneIds?: string[];
  arcIds?: string[];
  characterIds?: string[];
  timelineIds?: string[];
  includeAll?: boolean;
}

/**
 * Generation settings for artifacts
 */
export interface GenerationSettings {
  template?: string;
  style?: 'minimal' | 'standard' | 'detailed';
  includeMetadata?: boolean;
  includeCharacterNotes?: boolean;
  includeSceneNumbers?: boolean;
  pageBreaks?: boolean;
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
  customOptions?: Record<string, any>;
}

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  version: number;
  tags?: string[];
  status?: 'draft' | 'review' | 'final' | 'archived';
  notes?: string;
  generatedFrom?: string; // Snapshot ID or branch name
  lastRegeneratedAt?: Date;
  regenerationCount?: number;
}

/**
 * Artifact data structure (for serialization)
 */
export interface ArtifactData {
  id: string;
  name: string;
  description?: string;
  type: ArtifactType;
  format: ArtifactFormat;
  content: string;
  source: ArtifactSource;
  settings: GenerationSettings;
  metadata: ArtifactMetadata;
  checksum?: string;
}

/**
 * Artifact class - Represents a generated narrative output
 */
export class Artifact {
  public id: string;
  public name: string;
  public description?: string;
  public type: ArtifactType;
  public format: ArtifactFormat;
  public content: string;
  public source: ArtifactSource;
  public settings: GenerationSettings;
  public metadata: ArtifactMetadata;
  private checksum?: string;

  constructor(
    name: string,
    type: ArtifactType,
    format: ArtifactFormat = ArtifactFormat.MARKDOWN,
    source: ArtifactSource = {},
    settings: GenerationSettings = {}
  ) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.id = `artifact-${timestamp}-${random}`;
    this.name = name;
    this.type = type;
    this.format = format;
    this.content = '';
    this.source = source;
    this.settings = {
      style: 'standard',
      includeMetadata: true,
      includeCharacterNotes: true,
      includeSceneNumbers: true,
      pageBreaks: true,
      ...settings
    };
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      status: 'draft',
      regenerationCount: 0
    };
  }

  /**
   * Update artifact properties
   */
  update(updates: Partial<Omit<Artifact, 'id' | 'metadata'>>): void {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.type !== undefined) this.type = updates.type;
    if (updates.format !== undefined) this.format = updates.format;
    if (updates.content !== undefined) {
      this.content = updates.content;
      this.generateChecksum();
    }
    if (updates.source !== undefined) this.source = { ...this.source, ...updates.source };
    if (updates.settings !== undefined) this.settings = { ...this.settings, ...updates.settings };

    this.metadata.updatedAt = new Date();
    this.metadata.version++;
  }

  /**
   * Set artifact content
   */
  setContent(content: string): void {
    this.content = content;
    this.metadata.updatedAt = new Date();
    this.metadata.lastRegeneratedAt = new Date();
    this.metadata.regenerationCount = (this.metadata.regenerationCount || 0) + 1;
    this.generateChecksum();
  }

  /**
   * Update artifact metadata
   */
  updateMetadata(updates: Partial<ArtifactMetadata>): void {
    this.metadata = { ...this.metadata, ...updates, updatedAt: new Date() };
  }

  /**
   * Add tag to artifact
   */
  addTag(tag: string): void {
    if (!this.metadata.tags) {
      this.metadata.tags = [];
    }
    if (!this.metadata.tags.includes(tag)) {
      this.metadata.tags.push(tag);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * Remove tag from artifact
   */
  removeTag(tag: string): void {
    if (this.metadata.tags) {
      this.metadata.tags = this.metadata.tags.filter(t => t !== tag);
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * Check if artifact has tag
   */
  hasTag(tag: string): boolean {
    return this.metadata.tags?.includes(tag) || false;
  }

  /**
   * Generate checksum for content integrity
   */
  private generateChecksum(): void {
    // Simple checksum using length and first/last chars
    const len = this.content.length;
    const first = this.content.charCodeAt(0) || 0;
    const last = this.content.charCodeAt(len - 1) || 0;
    this.checksum = `${len}-${first}-${last}`;
  }

  /**
   * Verify content integrity
   */
  verifyChecksum(): boolean {
    const len = this.content.length;
    const first = this.content.charCodeAt(0) || 0;
    const last = this.content.charCodeAt(len - 1) || 0;
    const expected = `${len}-${first}-${last}`;
    return this.checksum === expected;
  }

  /**
   * Get artifact size in bytes
   */
  getSize(): number {
    return new TextEncoder().encode(this.content).length;
  }

  /**
   * Get word count (approximate)
   */
  getWordCount(): number {
    return this.content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get line count
   */
  getLineCount(): number {
    return this.content.split('\n').length;
  }

  /**
   * Validate artifact
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id) errors.push('Artifact ID is required');
    if (!this.name || this.name.trim().length === 0) errors.push('Artifact name is required');
    if (!Object.values(ArtifactType).includes(this.type)) {
      errors.push(`Invalid artifact type: ${this.type}`);
    }
    if (!Object.values(ArtifactFormat).includes(this.format)) {
      errors.push(`Invalid artifact format: ${this.format}`);
    }
    if (!this.source || Object.keys(this.source).length === 0) {
      errors.push('Artifact source is required');
    }
    if (this.metadata.version < 1) {
      errors.push('Artifact version must be >= 1');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Clone artifact with new ID
   */
  clone(newName?: string): Artifact {
    const cloned = new Artifact(
      newName || `${this.name} (Copy)`,
      this.type,
      this.format,
      { ...this.source },
      { ...this.settings }
    );
    cloned.description = this.description;
    cloned.content = this.content;
    cloned.metadata = {
      ...this.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    return cloned;
  }

  /**
   * Export to JSON
   */
  toJSON(): ArtifactData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      format: this.format,
      content: this.content,
      source: this.source,
      settings: this.settings,
      metadata: this.metadata,
      checksum: this.checksum
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: ArtifactData): Artifact {
    const artifact = new Artifact(data.name, data.type, data.format, data.source, data.settings);
    artifact.id = data.id;
    artifact.description = data.description;
    artifact.content = data.content;
    artifact.metadata = data.metadata;
    artifact.checksum = data.checksum;
    return artifact;
  }

  /**
   * Get human-readable status
   */
  getStatusDisplay(): string {
    const status = this.metadata.status || 'draft';
    const statusMap: Record<string, string> = {
      draft: '📝 Draft',
      review: '👀 Review',
      final: '✅ Final',
      archived: '📦 Archived'
    };
    return statusMap[status] || status;
  }

  /**
   * Get type display name
   */
  getTypeDisplay(): string {
    const typeMap: Record<ArtifactType, string> = {
      [ArtifactType.SCREENPLAY]: '🎬 Screenplay',
      [ArtifactType.NOVEL]: '📖 Novel',
      [ArtifactType.OUTLINE]: '📋 Outline',
      [ArtifactType.BEAT_SHEET]: '📊 Beat Sheet',
      [ArtifactType.CHARACTER_PROFILE]: '👤 Character Profile',
      [ArtifactType.TIMELINE]: '📅 Timeline',
      [ArtifactType.STORY_BIBLE]: '📚 Story Bible',
      [ArtifactType.TREATMENT]: '📄 Treatment',
      [ArtifactType.SYNOPSIS]: '📝 Synopsis',
      [ArtifactType.CUSTOM]: '⚙️ Custom'
    };
    return typeMap[this.type] || this.type;
  }

  /**
   * Get format display name
   */
  getFormatDisplay(): string {
    return this.format.toUpperCase();
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `Artifact<${this.id}>(${this.name}, ${this.type}, ${this.format}, v${this.metadata.version})`;
  }
}
