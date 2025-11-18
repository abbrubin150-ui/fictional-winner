# CLAUDE.md — AI Assistant Guide for PCS Repository

**Last Updated:** 2025-11-18
**Repository:** Plot-Control System (PCS) for Authors
**Version:** v2025.11-Δ3
**Framework:** Σ-Integrator (Sigma-Integrator)

---

## 📋 Project Overview

### What is PCS?

PCS (Plot-Control System) is a sophisticated narrative management system for authors that combines:
- **Graph-based plot structure** (scenes and arcs)
- **Coherence checking** (SAT solver-based)
- **Decision ledger** with witness signatures
- **Ethical runtime framework** (Σ-Integrator)
- **Character management** with relationship tracking
- **Timeline management** with temporal consistency checks
- **Artifact system** for generated content

### Purpose

Enable authors to plan and manage complex narrative plots while maintaining:
- Narrative consistency
- Character coherence
- Timeline integrity
- Ethical decision tracking
- Quality control through KPI monitoring

### Tech Stack

- **Language:** TypeScript (strict mode)
- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Desktop:** Tauri (optional)
- **Testing:** Jest
- **Database:** In-memory graph database (GraphDB)
- **Build:** Vite + TypeScript compiler
- **CI/CD:** GitHub Actions
- **Deployment:** GitHub Pages, Docker, Netlify, Vercel, AWS

---

## 🏗️ Codebase Structure

### Directory Layout

```
fictional-winner/
├── src/
│   ├── core/              # Core domain models
│   │   ├── Scene.ts       # Scene entity with validation
│   │   ├── Arc.ts         # Narrative arc entity
│   │   ├── Character.ts   # Character entity with relationships
│   │   ├── Artifact.ts    # Generated content entity
│   │   └── GraphDB.ts     # In-memory graph database
│   ├── managers/          # Business logic managers
│   │   ├── ArcPlanner.ts          # Arc planning with A.R.I.D-5 flow
│   │   ├── BranchManager.ts       # Branch/merge operations
│   │   ├── SnapshotManager.ts     # State snapshot management
│   │   ├── TimelineManager.ts     # Timeline & temporal consistency
│   │   ├── MirrorSidecar.ts       # Mirror sync & validation
│   │   ├── ArtifactManager.ts     # Artifact lifecycle management
│   │   └── ArtifactGenerator.ts   # Artifact generation logic
│   ├── utils/             # Utilities and helpers
│   │   ├── CoherenceSolver.ts    # SAT-based coherence checker
│   │   └── DecisionLedger.ts     # Decision tracking with witnesses
│   ├── ui/                # React UI components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # React entry point
│   ├── config/            # Configuration files
│   │   └── default.ts     # Default configuration
│   └── index.ts           # Main entry point
├── tests/                 # Test files (167 tests, 100% passing)
│   ├── Scene.test.ts
│   ├── Character.test.ts
│   ├── CoherenceSolver.test.ts
│   ├── BranchManager.test.ts
│   ├── TimelineManager.test.ts
│   └── ... (more test files)
├── server.ts              # Express API server (root level)
├── docs/                  # Documentation (via markdown files in root)
│   ├── README.md          # Main project documentation (Hebrew)
│   ├── ARCHITECTURE.md    # Architecture deep dive
│   ├── API.md             # API reference
│   ├── ETHICS.md          # Ethical framework details
│   ├── CONTRIBUTING.md    # Contribution guidelines
│   ├── DEPLOYMENT.md      # Deployment instructions
│   ├── QUICKSTART.md      # Quick start guide
│   ├── START_HERE.md      # Getting started
│   ├── TODO.md            # Project roadmap
│   └── CHANGELOG.md       # Version history
├── .github/workflows/     # CI/CD pipelines
│   ├── ci.yml            # Test, lint, build, ethical checks
│   └── deploy.yml        # Deployment automation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── jest.config.js        # Jest test configuration
└── .eslintrc.json        # ESLint rules

```

### Key Files to Understand

1. **src/core/GraphDB.ts** - Central data structure, manages all entities
2. **src/utils/DecisionLedger.ts** - Ethical decision tracking
3. **src/utils/CoherenceSolver.ts** - Narrative consistency validation
4. **server.ts** - REST API implementation
5. **src/managers/TimelineManager.ts** - Temporal consistency
6. **ETHICS.md** - Critical for understanding the Σ-Integrator framework

---

## 🧠 Core Concepts

### 1. Scene (סצנה)

**Purpose:** Atomic unit of narrative structure

**Properties:**
- `id` - Unique identifier (auto-generated)
- `title` - Scene name
- `premise` - What happens (the "what")
- `why` - Narrative purpose (the "why")
- `how` - Technical execution (the "how")
- `cost` - Narrative cost/complexity (0.1-10.0 scale)
- `links` - References to connected scenes
- `characterPresence` - Characters present in the scene
- `metadata` - Creation/update timestamps, tags, author

**Cost Scale:**
- `0.1-1.0`: Simple scene (conversation, transition)
- `1.0-3.0`: Medium scene (conflict, discovery)
- `3.0-10.0`: Complex scene (climax, major twist)

**Location:** `src/core/Scene.ts:31-204`

### 2. Arc (קשת עלילתית)

**Purpose:** Collection of scenes forming a narrative arc

**Properties:**
- `id` - Unique identifier
- `intent` - What the arc achieves
- `scenes` - Ordered array of scene IDs
- `metadata.status` - 'draft' | 'active' | 'completed'
- `metadata.priority` - Priority level (number)

**Use Cases:**
- Act structure (Act 1, 2, 3)
- Character arcs (Hero's Journey)
- Subplots (Romance subplot)
- Timeline management (Flashbacks)

**Location:** `src/core/Arc.ts`

### 3. Character (דמות)

**Purpose:** Track characters and their relationships

**Properties:**
- `id` - Unique identifier
- `name` - Character name
- `description` - Character description
- `role` - 'protagonist' | 'antagonist' | 'supporting' | 'minor'
- `traits` - Character traits array
- `relationships` - Relationships with other characters
- `scenePresence` - Scenes where character appears
- `arcData` - Character development tracking

**Location:** `src/core/Character.ts`

### 4. GraphDB (בסיס נתונים גרפי)

**Purpose:** Central in-memory database managing all entities

**Key Operations:**
- **CRUD** for Scenes, Arcs, Characters, Artifacts
- **Graph analysis** (connected scenes, arc containment)
- **Snapshot/restore** for rollback functionality
- **Coherence checking** via CoherenceSolver integration
- **Bidirectional relationships** (character↔scene, scene↔arc)

**Data Structures:**
```typescript
Map<SceneID, Scene>      // O(1) lookups
Map<ArcID, Arc>          // O(1) lookups
Map<CharacterID, Character>  // O(1) lookups
Map<ArtifactID, Artifact>    // O(1) lookups
```

**Location:** `src/core/GraphDB.ts:26-717`

### 5. Decision Ledger (יומן החלטות)

**Purpose:** Track all significant decisions with witness signatures

**Decision Types:**
- `EXECUTE` - Perform an action
- `ROLLBACK` - Revert to previous state
- `STOP` - Emergency halt (Stop-3)
- `MERGE` - Merge branches

**Decision Structure:**
```typescript
{
  id: string,              // L-0001, L-0002...
  decision: DecisionType,
  rationale: string,       // Why the decision was made
  witness: string,         // Who signed (Role Model a or ∴Auditor)
  timestamp: Date,
  expiry?: Date,          // Decision validity period
  context: {              // Operation-specific context
    action?: string,
    sceneId?: string,
    deltaRate?: number,
    mirrorDrift?: number
  }
}
```

**Location:** `src/utils/DecisionLedger.ts`

### 6. Coherence Solver (פותר קוהרנטיות)

**Purpose:** SAT-based validation of narrative consistency

**Checks:**
- No circular dependencies in scene links
- All linked scenes exist
- Timeline consistency (no temporal paradoxes)
- Character presence validation
- Orphaned scenes detection
- Arc integrity

**Returns:** `CoherenceReport` with:
- `coherent: boolean` - Overall coherence status
- `errors: string[]` - Critical issues (must fix)
- `warnings: string[]` - Non-critical issues (should fix)

**Location:** `src/utils/CoherenceSolver.ts`

### 7. Artifact System

**Purpose:** Manage generated content tied to narrative elements

**Artifact Types:**
- `summary` - Scene/arc summaries
- `dialogue` - Generated dialogue
- `description` - Descriptive text
- `analysis` - Analytical reports
- `outline` - Structure outlines
- `custom` - User-defined types

**Properties:**
- `id` - Unique identifier
- `type` - Artifact type
- `content` - The generated content
- `source` - Links to scenes/arcs/characters
- `metadata` - Generation context and timestamps

**Location:** `src/core/Artifact.ts`, `src/managers/ArtifactManager.ts`

---

## 🎯 Σ-Integrator Framework (Ethical Runtime)

### Core Principles

PCS is built on the Σ-Integrator ethical framework. **This is critical to understand** when working on this codebase.

### 1. **EXACT1 — Exact Precision**

```
Every operation must be executed exactly as defined, without:
- Shortcuts
- Undeclared compromises
- "Approximately" or "roughly"
```

**In Practice:**
- Clear error messages with context
- Explicit validation rules
- No silent failures
- No ambiguous states

**Example:**
```typescript
// ❌ BAD
if (scene.cost > 5) { /* unclear error */ }

// ✅ GOOD
if (scene.cost > MAX_SCENE_COST) {
  throw new Error(`Scene cost ${scene.cost} exceeds maximum allowed ${MAX_SCENE_COST}`);
}
```

### 2. **Gate-0 — Moral Gateway**

```
Before every critical operation, check:
1. Is the operation justified?
2. Is there witness approval?
3. Is there an active STOP?
```

**Flow:**
```
Request → Gate-0 Check → Validation → Record Decision → Execute → Sign
```

**Location:** Decision flow implemented in `DecisionLedger` and API handlers

### 3. **Stop-3 — Emergency Halt**

```
When critical issues detected:
1. Stop immediately
2. Document the reason
3. Report to Witness
4. Wait for approval to continue
```

**Triggers:**
- ΔDIA_Rate < 0 (3 consecutive times)
- Mirror-Drift > 0.1
- Circular dependency detected
- Manual STOP by Role Model a

### Witness System

**Role Model a** (moral.witness@pcs.local)
- **Role:** Moral witness
- **Decisions:** Strategic decisions
- **Examples:** New features, architectural changes, long-term impacts

**∴Auditor** (auditor@pcs.local)
- **Role:** Operational witness
- **Decisions:** Routine operations
- **Examples:** CRUD operations, merges, KPI deviations

### Key Philosophical Points

**"ידע≡אחריות; כל מדידה≡מוסר"**
("Knowledge ≡ Responsibility; Every measurement ≡ Morality")

- All knowledge implies responsibility
- Every metric must be ethically justified
- Memory is not just storage—it's commitment
- The system recognizes "the other" (the user)

**Critical:** When working on this codebase:
1. Document the "why" not just the "what"
2. All errors should teach, not just report
3. Don't hide complexity—address it
4. Every decision should be traceable

**Read:** `ETHICS.md` for complete philosophical framework

---

## 🔧 Development Workflows

### Setup

```bash
# Install dependencies
npm install

# Run full development stack (API + UI)
npm run dev

# Run API only
npm run dev:api

# Run UI only
npm run dev:ui
```

### Testing

```bash
# Run all tests (167 tests)
npm test

# Watch mode
npm run test:watch

# Run specific test file
npm test -- Scene.test.ts
```

**Test Coverage:** 100% passing (as of Sprint 3 completion)

### Linting & Formatting

```bash
# Lint TypeScript code
npm run lint

# Format code with Prettier
npm run format

# Type check
npx tsc --noEmit
```

### Building

```bash
# Build for production
npm run build

# Output: dist/ directory
```

### Common Development Tasks

#### 1. Adding a New Scene

```typescript
const scene = graphDB.createScene({
  title: "Opening Scene",
  premise: "Hero discovers the call to adventure",
  why: "Establish protagonist and inciting incident",
  how: "Visual discovery of mysterious letter",
  cost: 2.5
});

// Add to an arc
graphDB.addSceneToArc(arcId, scene.id);

// Add characters to scene
graphDB.addCharacterToScene(characterId, scene.id);
```

#### 2. Creating an Arc

```typescript
const arc = graphDB.createArc("Hero's Journey - Act 1");

// Add scenes in order
graphDB.addSceneToArc(arc.id, scene1.id);
graphDB.addSceneToArc(arc.id, scene2.id);
graphDB.addSceneToArc(arc.id, scene3.id);
```

#### 3. Checking Coherence

```typescript
const report = graphDB.checkCoherence();

if (!report.coherent) {
  console.error("Coherence errors:", report.errors);
  console.warn("Coherence warnings:", report.warnings);
}
```

#### 4. Recording a Decision

```typescript
ledger.recordDecision(
  'EXECUTE',
  'Created new scene for opening sequence',
  '∴Auditor',
  {
    action: 'scene_create',
    sceneId: scene.id
  }
);
```

#### 5. Creating a Snapshot

```typescript
// Create snapshot before risky operation
const snapshot = graphDB.createSnapshot();

try {
  // Perform risky operation
  riskyOperation();
} catch (error) {
  // Rollback on failure
  graphDB.loadSnapshot(snapshot);
  throw error;
}
```

---

## 🔌 API Structure

### Base URL

Development: `http://localhost:3000`
Production: Configured via environment variables

### Key Endpoints

#### Health Check
```
GET /health
```

#### Scenes
```
POST   /scene          - Create scene
GET    /scene/:id      - Get scene by ID
GET    /scenes         - Get all scenes
PUT    /scene/:id      - Update scene
DELETE /scene/:id      - Delete scene (removes from all arcs)
```

#### Arcs
```
POST   /arc            - Create arc
GET    /arc/:id        - Get arc by ID
GET    /arcs           - Get all arcs
POST   /arc/:id/scene  - Add scene to arc
DELETE /arc/:id        - Delete arc
```

#### Decision Ledger
```
GET    /ledger         - Get all decisions
GET    /ledger/active  - Get active decisions
GET    /ledger/stats   - Get ledger statistics
POST   /ledger/decision - Record new decision
GET    /ledger/export  - Export ledger as YAML
```

#### Graph Analytics
```
GET    /graph/stats    - Get graph statistics
GET    /graph/snapshot - Create full graph snapshot
```

**Complete API docs:** `API.md`

---

## 🎨 Code Conventions

### TypeScript

1. **Strict mode enabled** - All compiler strict checks active
2. **No `any` types** - Use proper typing or `unknown`
3. **Interface for data structures** - Classes for entities
4. **JSDoc comments** - All public functions and classes
5. **Explicit return types** - Always declare function return types

### Naming

- **Classes:** PascalCase (`Scene`, `GraphDB`, `ArcPlanner`)
- **Functions/methods:** camelCase (`createScene`, `addLink`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_SCENE_COST`)
- **Interfaces:** PascalCase with descriptive names (`SceneData`, `CoherenceReport`)
- **Private methods:** prefix with underscore if needed, but prefer TypeScript `private`

### File Organization

- **One class per file** (exception: small related types)
- **File name matches main export** (`Scene.ts` exports `Scene` class)
- **Tests in separate directory** with `.test.ts` suffix
- **Imports ordered:** core → managers → utils → external libs

### Documentation

Required for all public APIs:

```typescript
/**
 * Brief description of what the function does
 *
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 */
```

### Commit Messages

Format: `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring (no functionality change)
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

**Example:**
```
feat(scene): add validation for scene links

Added comprehensive validation for scene-to-scene links
to prevent circular dependencies and orphaned scenes.

Closes #42
```

---

## ⚠️ Important Gotchas & Conventions

### 1. Language Mix

- **Documentation:** Primarily Hebrew (עברית)
- **Code:** English (variables, functions, comments)
- **Reason:** Project originates from Hebrew-speaking team
- **For AI Assistants:** Be prepared to handle both languages

### 2. Bidirectional Relationships

When modifying relationships, update BOTH sides:

```typescript
// ❌ BAD - Only one direction
character.addScenePresence(sceneId);

// ✅ GOOD - Both directions
character.addScenePresence(sceneId);
scene.addCharacter(characterId);

// BETTER - Use GraphDB helper
graphDB.addCharacterToScene(characterId, sceneId);
```

### 3. Validation Before Storage

Always validate before adding to GraphDB:

```typescript
const validation = scene.validate();
if (!validation.valid) {
  throw new Error(`Invalid scene: ${validation.errors.join(', ')}`);
}
graphDB.addScene(scene);
```

### 4. Decision Ledger is Mandatory

For significant operations, always record a decision:

```typescript
// Before critical operation
ledger.recordDecision('EXECUTE', rationale, witness, context);

// Perform operation
operation();
```

### 5. Server File Location

The Express server is at **root level** (`server.ts`), not in `src/api/`. This is intentional for the project structure.

### 6. No API Server in src/api/

There's no `src/api/server.ts`. The API server implementation is in `server.ts` at the root.

### 7. Test Isolation

Tests should be isolated and not depend on external state. Use fresh GraphDB instances per test.

### 8. Snapshot for Rollback

Before risky operations, create snapshots:

```typescript
const snapshot = graphDB.createSnapshot();
try {
  riskyOperation();
} catch (error) {
  graphDB.loadSnapshot(snapshot);
  throw error;
}
```

### 9. Environment Variables

- Development: `.env.development`
- Production: `.env.production`
- Use Vite's `import.meta.env` for frontend
- Use `process.env` for backend

### 10. No Destructive Operations Without Confirmation

The system follows Stop-3 principle. Critical operations should check for active stops.

---

## 📊 KPI & Telemetry

### ΔDIA_Rate (Delta Dramatic Impact Amplitude)

**Purpose:** Measure change in dramatic impact

```
ΔDIA_Rate = (NewImpact - OldImpact) / OldImpact
```

**Threshold:** ΔDIA_Rate ≥ 0

- `< 0` - Drama weakening (⚠️ triggers Stop-3)
- `= 0` - Stable
- `> 0` - Drama strengthening (✅ good)

### Mirror-Drift

**Purpose:** Measure deviation between plan and actual

```
Mirror-Drift = |Planned - Actual| / Planned
```

**Threshold:** ≤ 0.03 (3%)

- `> 0.1` - Triggers Stop-3

---

## 🚀 Sprint Progress

### Sprint 1 ✅ Complete
- Graph-DB with full CRUD
- Basic coherence solver (SAT)
- Decision Ledger active
- Minimal web UI for Scenes + Arcs

### Sprint 2 ✅ Complete
- SAT Solver for narrative coherence
- Branch Manager + Rollback Snapshots
- Extended Arc Planner (A.R.I.D-5 Flow)
- Mirror Sidecar for merge control

### Sprint 3 ✅ Complete
- Full Character system
- Timeline Manager with flashback/flash-forward support
- Mirror Sidecar with auto-sync
- Temporal paradox detection
- 167 unit tests (100% passing)

### Future Enhancements
- Export to screenplay format
- Advanced conflict detection
- Multi-user collaboration
- Real-time sync between instances
- Advanced visualization tools

---

## 🔍 Finding Your Way Around

### "I need to understand the data model"
→ Read `src/core/Scene.ts`, `src/core/Arc.ts`, `src/core/Character.ts`

### "I need to understand the architecture"
→ Read `ARCHITECTURE.md` (comprehensive deep dive)

### "I need to add a new API endpoint"
→ Edit `server.ts`, follow existing patterns

### "I need to understand the ethical framework"
→ Read `ETHICS.md` (critical for understanding design decisions)

### "I need to add a test"
→ Add to `tests/` directory, follow existing test patterns

### "I need to modify the UI"
→ Edit `src/ui/App.tsx` and related components

### "I need to understand deployment"
→ Read `DEPLOYMENT.md` for all deployment options

### "I want to contribute"
→ Read `CONTRIBUTING.md` for guidelines

---

## 🎯 Common Questions

**Q: Why is some documentation in Hebrew?**
A: The project originates from a Hebrew-speaking team. Code is in English for international collaboration, but some docs remain in Hebrew.

**Q: What is Σ-Integrator?**
A: An ethical framework that embeds moral considerations into the runtime of the system. See `ETHICS.md` for details.

**Q: Why the Decision Ledger?**
A: Accountability and traceability. Every significant decision should be auditable with a witness signature.

**Q: Can I skip the coherence checks?**
A: No. Coherence checking is fundamental to the system's purpose. It ensures narrative consistency.

**Q: Why the witness signatures?**
A: Part of the Σ-Integrator framework. Ensures human oversight on critical decisions.

**Q: What's with the Hebrew email addresses?**
A: Placeholders. The system is designed to work with any witness system configured.

**Q: Why in-memory database?**
A: MVP design. Future versions will support persistence layers.

**Q: How do I add persistence?**
A: Implement a persistence layer that uses `GraphDB.createSnapshot()` and `GraphDB.loadSnapshot()`.

---

## 🛠️ AI Assistant Guidelines

When working on this codebase as an AI assistant:

### DO:
1. ✅ Read `ETHICS.md` to understand the philosophical framework
2. ✅ Follow EXACT1 principle - be precise in all operations
3. ✅ Add proper JSDoc comments to new functions
4. ✅ Write tests for new features
5. ✅ Use TypeScript strict typing
6. ✅ Record decisions in the ledger for significant changes
7. ✅ Validate data before storage
8. ✅ Handle both Hebrew and English in documentation
9. ✅ Check coherence after structural changes
10. ✅ Create snapshots before risky operations

### DON'T:
1. ❌ Use `any` types without strong justification
2. ❌ Skip validation checks
3. ❌ Make one-sided relationship updates
4. ❌ Ignore the witness system
5. ❌ Write code without understanding EXACT1
6. ❌ Skip error context in error messages
7. ❌ Assume circular dependencies are okay
8. ❌ Modify core entities without tests
9. ❌ Ignore coherence warnings
10. ❌ Break existing tests without good reason

### When Adding Features:
1. Understand if it affects narrative coherence
2. Determine appropriate witness (Role Model a vs ∴Auditor)
3. Add appropriate tests
4. Update API documentation if adding endpoints
5. Consider KPI impacts (ΔDIA_Rate, Mirror-Drift)
6. Document the "why" not just the "what"

### When Debugging:
1. Check coherence report first (`graphDB.checkCoherence()`)
2. Review recent decision ledger entries
3. Verify bidirectional relationships
4. Check for orphaned entities
5. Look for circular dependencies

---

## 📚 Essential Reading Order

For new developers/AI assistants:

1. **START_HERE.md** - Quick overview
2. **README.md** - Project goals and current state
3. **ETHICS.md** - ⚠️ CRITICAL - Understand the framework
4. **ARCHITECTURE.md** - Technical architecture
5. **This file (CLAUDE.md)** - Development guide
6. **API.md** - API reference
7. **CONTRIBUTING.md** - Contribution process

---

## 🔗 Quick Links

- **Repository:** https://github.com/abbrubin150-ui/fictional-winner
- **CI Pipeline:** `.github/workflows/ci.yml`
- **Deployment Guide:** `DEPLOYMENT.md`
- **License:** MIT (see `LICENSE`)
- **Test Coverage:** 100% (167 tests passing)
- **Node Version:** ≥18.0.0
- **NPM Version:** ≥9.0.0

---

## 🎓 Understanding the Philosophy

**"ריתמוס-הוויה-סולקת"**
("The rhythm of existence determines meaning")

This project is more than a tool—it's a system with an ethical stance. When working on PCS:

- **Knowledge implies responsibility** - If the system knows something, it's responsible for it
- **Every measurement has moral weight** - Metrics aren't neutral; they reflect values
- **Precision is ethical** - EXACT1 isn't just technical, it's moral
- **Memory is commitment** - What we store, we commit to protecting and using responsibly

Understanding this philosophy will help you make decisions that align with the project's principles.

---

## 📞 Support & Contact

- **Issues:** Open GitHub issues for bugs/features
- **Discussions:** GitHub Discussions for questions
- **Role Model a:** moral.witness@pcs.local (strategic)
- **∴Auditor:** auditor@pcs.local (operational)

---

**Built with Σ-Integrator Framework**
*"ידע≡אחריות; כל מדידה≡מוסר"*

---

**Last Updated:** 2025-11-18
**Document Version:** 1.0.0
**Project Phase:** Sprint 3 Complete → Advanced Features Ready
