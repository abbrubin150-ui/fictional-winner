/**
 * PCS Default Configuration
 */

export const defaultConfig = {
  // Server
  server: {
    port: 3000,
    host: 'localhost',
  },

  // Telemetry & KPI
  telemetry: {
    enabled: true,
    deltaRateThreshold: 0,
    mirrorDriftThreshold: 0.03,
    snapshotInterval: 300000, // 5 minutes
  },

  // Witnesses
  witnesses: {
    default: '∴Auditor',
    moral: 'Role Model a',
  },

  // Graph limits
  graph: {
    maxScenes: 1000,
    maxArcs: 100,
    maxSceneCost: 10.0,
    maxLinksPerScene: 10,
  },

  // Decision Ledger
  ledger: {
    maxEntries: 10000,
    defaultExpiryDays: 365,
    autoCleanup: true,
    cleanupIntervalHours: 24,
  },

  // Validation
  validation: {
    strictMode: true,
    allowNegativeCost: false,
    requireWhy: true,
    requireHow: true,
  },

  // Sprint 2 features (disabled in Sprint 1)
  features: {
    branchManager: false,
    coherenceSolver: false,
    mirrorSidecar: false,
    arcPlanner: false,
  },
};

export type PCSConfig = typeof defaultConfig;
