# Architecture Deep Dive — PCS

## מבט על

PCS (Plot Control System) היא מערכת לניהול עלילות המבוססת על שלושה עקרונות מרכזיים:

1. **Graph-Based**: ייצוג העלילה כגרף של סצנות וקשתות
2. **Decision-Driven**: כל פעולה משמעותית מתועדת וחתומה
3. **Ethical Runtime**: שכבת ממשל אתית מובנית

## מבנה המערכת

```
┌─────────────────────────────────────────────┐
│            UI Layer (React)                 │
│  - Scene Manager                            │
│  - Arc Planner                              │
│  - Ledger Viewer                            │
└──────────────┬──────────────────────────────┘
               │ REST API
               ▼
┌─────────────────────────────────────────────┐
│         API Layer (Express)                 │
│  - CRUD Endpoints                           │
│  - Request Validation                       │
│  - Decision Recording                       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          Core Layer                         │
│                                             │
│  ┌─────────────┐     ┌──────────────┐     │
│  │  GraphDB    │────▶│ DecisionLedger│    │
│  │             │     │               │     │
│  │ - Scenes    │     │ - EXECUTE     │     │
│  │ - Arcs      │     │ - ROLLBACK    │     │
│  │ - Links     │     │ - STOP        │     │
│  └─────────────┘     └──────────────┘     │
│         │                    │              │
│         │                    │              │
│         ▼                    ▼              │
│  ┌──────────────────────────────────┐     │
│  │      Witness System              │     │
│  │  - Role Model a (Moral)          │     │
│  │  - ∴Auditor (Runtime)            │     │
│  └──────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

## ליבות המערכת

### 1. GraphDB — בסיס הנתונים הגרפי

**אחריות:**
- ניהול כל הסצנות וה-Arcs
- שמירה על יחסים ביניהם
- Snapshot & Rollback
- ניתוח גרף (connectivity, paths)

**מבנה נתונים:**

```typescript
Map<SceneID, Scene>  // O(1) lookup
Map<ArcID, Arc>      // O(1) lookup
```

**Operations:**

```typescript
// O(1) operations
createScene(), getScene(), updateScene(), deleteScene()
createArc(), getArc(), updateArc(), deleteArc()

// O(n) operations
getAllScenes(), getAllArcs()
getConnectedScenes(id)
getArcsContainingScene(id)

// O(1) snapshot
createSnapshot(), loadSnapshot()
```

**Invariants:**
- Scene ID ייחודי
- Arc מכיל רק Scene IDs קיימים
- מחיקת Scene מסירה אותה מכל ה-Arcs

---

### 2. DecisionLedger — יומן ההחלטות

**אחריות:**
- רישום כל החלטה קריטית
- וידוא חתימת Witness
- ניהול תוקף החלטות
- ביקורת ומעקב

**מבנה החלטה:**

```typescript
{
  id: string,              // L-0001, L-0002...
  decision: DecisionType,  // EXECUTE | ROLLBACK | STOP
  rationale: string,       // למה ההחלטה התקבלה
  witness: string,         // מי חתם
  timestamp: Date,         // מתי
  expiry?: Date,           // תוקף
  context: {
    action?: string,
    sceneId?: string,
    arcId?: string,
    deltaRate?: number,
    mirrorDrift?: number
  }
}
```

**Flow:**

```
Request → Gate-0 Check → Validation → Record Decision → Execute → Sign
```

**Witness Registry:**
- **Role Model a**: עד מוסרי, קובע החלטות אסטרטגיות
- **∴Auditor**: עד תפעולי, רושם פעולות שוטפות

---

### 3. Scene — יחידת העלילה

**מאפיינים:**

```typescript
{
  id: string,       // מזהה ייחודי
  title: string,    // כותרת
  premise: string,  // מה קורה
  why: string,      // למה הסצנה קיימת
  how: string,      // איך מבצעים
  cost: number,     // עלות נרטיבית
  links: string[]   // קישורים לסצנות אחרות
}
```

**Cost Model:**

עלות נרטיבית מייצגת את המורכבות/סיכון של הסצנה:

- `0.1-1.0`: סצנה פשוטה (שיחה, מעבר)
- `1.0-3.0`: סצנה בינונית (קונפליקט, גילוי)
- `3.0-10.0`: סצנה מורכבת (שיא, טוויסט גדול)

**Validation Rules:**
- title, premise חייבים להיות לא ריקים
- cost ≥ 0
- links חייבים להיות לסצנות קיימות

---

### 4. Arc — קשת עלילתית

**מאפיינים:**

```typescript
{
  id: string,
  intent: string,         // מה ה-Arc משיג
  scenes: string[],       // סדר סצנות
  metadata: {
    status: 'draft' | 'active' | 'completed',
    priority: number
  }
}
```

**Operations:**
- `addScene(id, position?)` - הוספת סצנה
- `removeScene(id)` - הסרת סצנה
- `reorderScene(from, to)` - שינוי סדר

**Use Cases:**
- Act structure (Act 1, Act 2, Act 3)
- Character arcs (Hero's Journey)
- Subplot tracking (Romance subplot)
- Timeline management (Flashbacks)

---

## תזרים נתונים

### יצירת סצנה

```
User Request
    │
    ▼
[POST /scene]
    │
    ▼
Validation (title, premise, cost)
    │
    ▼
GraphDB.createScene()
    │
    ▼
Ledger.recordDecision(EXECUTE)
    │
    ▼
Response: Scene JSON
```

### מחיקת סצנה

```
User Request
    │
    ▼
[DELETE /scene/:id]
    │
    ▼
GraphDB.getScene(id) → exists?
    │
    ▼
Remove from all Arcs
    │
    ▼
GraphDB.deleteScene(id)
    │
    ▼
Ledger.recordDecision(EXECUTE)
    │
    ▼
Response: Success
```

### הוספת סצנה ל-Arc

```
User Request
    │
    ▼
[POST /arc/:arcId/scene]
    │
    ▼
Validate: Arc exists? Scene exists?
    │
    ▼
GraphDB.addSceneToArc(arcId, sceneId, position)
    │
    ▼
Ledger.recordDecision(EXECUTE)
    │
    ▼
Response: Arc JSON
```

---

## Telemetry & KPI

### ΔDIA_Rate (Delta Dramatic Impact Amplitude)

מודד את השינוי בעוצמה הדרמטית בין מצב לפני למצב אחרי.

```
ΔDIA_Rate = (NewImpact - OldImpact) / OldImpact
```

**יעד:** ΔDIA_Rate ≥ 0

- `< 0`: הדרמה נחלשת (⚠️ Stop-3)
- `= 0`: יציבות
- `> 0`: הדרמה מתחזקת (✅ Good)

### Mirror-Drift

מודד את הסטייה בין ה"מראה" (התוכנית) למצב בפועל.

```
Mirror-Drift = |Planned - Actual| / Planned
```

**סף:** ≤ 0.03 (3%)

---

## בטיחות ואתיקה

### Gate-0 — שער מוסרי

לפני כל פעולה:

```typescript
if (hasActiveStop()) {
  throw new Error('STOP-3 active - operation blocked');
}

if (!isWitnessApproved(action)) {
  throw new Error('No witness approval');
}

proceed();
```

### Stop-3 — עצירת חירום

מצבים שמפעילים Stop-3:

1. ΔDIA_Rate < 0 למשך 3 actions רצופות
2. Mirror-Drift > 0.1
3. Circular dependency נוצר
4. Manual STOP decision by Role Model a

---

## Sprint 2 — תכנון

### Branch Manager

```
Graph State
    │
    ▼
[Create Branch]
    │
    ├─► Main Branch (protected)
    └─► Feature Branch (experimental)
```

### Rollback Snapshots

```
Before Each Critical Operation:
    │
    ▼
snapshot = graph.createSnapshot()
    │
    ▼
Execute Operation
    │
    ▼
If Failed:
    graph.loadSnapshot(snapshot)
```

### Solver לקוהרנטיות (SAT-based)

```
Constraints:
- No circular dependencies
- All linked scenes exist
- Timeline consistency
- Character presence
```

---

## הרחבות עתידיות

### Sprint 3+

1. **Character Tracking**: מעקב אחר דמויות לאורך העלילה
2. **Timeline Manager**: ניהול זמנים ו-flashbacks
3. **Conflict Detector**: זיהוי קונפליקטים לוגיים
4. **Export to Screenplay**: המרה לפורמט תסריט

---

**Built with Σ-Integrator Framework**  
*"ידע≡אחריות; כל מדידה≡מוסר"*
