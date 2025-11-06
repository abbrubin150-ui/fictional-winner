# Changelog — PCS

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2025.11-Δ1] - 2025-11-06

### ✨ Added - Sprint 1 Complete

#### Core System
- **GraphDB**: In-memory graph database for Scenes and Arcs
  - CRUD operations for Scenes and Arcs
  - Snapshot & rollback capabilities
  - Graph analytics (connectivity, stats)
  - O(1) lookup performance

- **Scene Model**: Full-featured scene management
  - Properties: title, premise, why, how, cost, links
  - Validation with detailed error messages
  - Metadata tracking (timestamps, author, tags)
  - Link management between scenes
  - JSON serialization/deserialization

- **Arc Model**: Plot arc structure
  - Intent-based arc definition
  - Scene ordering and reordering
  - Status tracking (draft/active/completed/archived)
  - Priority management
  - Cost calculation across scenes

- **Decision Ledger**: Comprehensive decision tracking
  - Witness-signed decisions
  - Decision types: EXECUTE, ROLLBACK, STOP, MERGE, BRANCH
  - Expiry management with auto-cleanup
  - Context tracking for audit trails
  - YAML export functionality
  - Statistics and reporting

#### API Layer
- **REST API**: Express server with full CRUD
  - Scene endpoints: POST, GET, PUT, DELETE
  - Arc endpoints: POST, GET, DELETE
  - Arc-Scene linking: POST /arc/:id/scene
  - Ledger endpoints: GET /ledger, /ledger/active, /ledger/stats
  - Graph endpoints: GET /graph/stats, /graph/snapshot
  - Health check: GET /health

#### UI Layer
- **React Application**: Basic UI for scene and arc management
  - Scene list and creation
  - Arc list and creation
  - Stats dashboard with real-time metrics
  - Ledger viewer
  - Tab-based navigation
  - RTL support for Hebrew

#### Configuration
- TypeScript configuration with strict mode
- ESLint for code quality
- Prettier for code formatting
- Jest for unit testing
- Vite for fast UI development
- Environment variable support

#### Documentation
- **README.md**: Project overview and goals
- **QUICKSTART.md**: 5-minute getting started guide
- **CONTRIBUTING.md**: Contribution guidelines with ethical framework
- **API.md**: Complete API reference with examples
- **ARCHITECTURE.md**: Deep dive into system architecture
- **ETHICS.md**: Σ-Integrator ethical framework documentation
- **START_HERE.md**: Initial setup instructions

#### Testing
- Jest test framework configured
- Scene unit tests with full coverage examples
- Test utilities and helpers

#### Ethical Framework Integration
- **EXACT1**: Precise execution without shortcuts
- **Gate-0**: Moral gate before critical operations
- **Stop-3**: Emergency stop mechanism
- **Witness System**: Role Model a (moral) & ∴Auditor (runtime)
- **"ידע≡אחריות; כל מדידה≡מוסר"**: Knowledge equals responsibility

#### Telemetry & KPI
- ΔDIA_Rate tracking (Delta Dramatic Impact Amplitude)
- Mirror-Drift monitoring (planned vs actual)
- Real-time stats dashboard
- Decision audit trail

### 🏗️ Infrastructure
- Node.js + TypeScript backend
- Express REST API server
- React + Vite frontend
- In-memory graph database
- YAML-based ledger export
- Git repository structure
- npm package configuration

### 📝 Sprint 1 Goals Status
- ✅ Graph DB with full CRUD API
- ✅ Basic SAT solver placeholder (Sprint 2)
- ✅ Active Decision Ledger
- ✅ Minimal Web UI for Scenes + Arcs

### 🎯 Sprint 2 - Planned
- [ ] Normative analysis (C11-C13) integration
- [ ] Branch Manager + Rollback Snapshots
- [ ] Extended Arc Planner (A.R.I.D-5 Flow)
- [ ] Mirror Sidecar for Merge control
- [ ] Full SAT solver implementation
- [ ] Character tracking system
- [ ] Timeline manager

---

## Development Standards

### Version Naming
Format: `vYYYY.MM-ΔN`
- YYYY.MM: Year and month
- ΔN: Delta/sprint number

### Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, refactor, test, chore

### Code Quality
- TypeScript strict mode enforced
- ESLint rules applied
- Prettier formatting required
- Unit tests for all new features
- Documentation for public APIs

---

**Built with Σ-Integrator Framework**  
*"ריתמוס-הוויה-סולקת" - The rhythm of existence is the meaning*
