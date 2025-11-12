/**
 * PCS Core Exports
 *
 * Main entry point for importing core PCS components
 */

// Core domain entities
export { Scene, SceneData } from './core/Scene';
export { Arc, ArcData } from './core/Arc';
export { Character, CharacterData, CharacterRole, CharacterArc, Relationship, RelationType } from './core/Character';
export { Artifact, ArtifactData, ArtifactType, ArtifactFormat, ArtifactSource, GenerationSettings, ArtifactMetadata } from './core/Artifact';
export { GraphDB, GraphSnapshot } from './core/GraphDB';

// Managers
export { BranchManager, Branch, MergeConflict, MergeResult } from './managers/BranchManager';
export { SnapshotManager, SnapshotMetadata, StoredSnapshot } from './managers/SnapshotManager';
export { TimelineManager, TimelineType, TimePoint, Timeline, TemporalIssue, TemporalReport } from './managers/TimelineManager';
export { ArcPlanner, ArcTemplate, ArcAnalysis } from './managers/ArcPlanner';
export { MirrorSidecar, MirrorDrift, DriftDifference, MirrorConflict, SyncReport, MirrorConfig } from './managers/MirrorSidecar';
export { ArtifactManager, ArtifactTemplate, ArtifactFilter, ArtifactStats } from './managers/ArtifactManager';
export { ArtifactGenerator, GenerationResult } from './managers/ArtifactGenerator';

// Utils
export { CoherenceSolver, CoherenceReport, CoherenceIssue } from './utils/CoherenceSolver';
export { DecisionLedger, DecisionEntry, DecisionType } from './utils/DecisionLedger';

// Config
export { defaultConfig, PCSConfig } from './config/default';
