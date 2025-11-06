# Ethical Framework — PCS

## יסודות

PCS נבנה על מסגרת אתית המשולבת בעומק הקוד ולא רק כשכבת חיצונית.

### עקרון היסוד

**"ידע≡אחריות; כל מדידה≡מוסר"**

כל מידע שהמערכת יודעת מחייב אותה באחריות. כל מדידה חייבת להיות מוצדקת מבחינה מוסרית.

---

## הממשל האתי (Ethical Kernel)

### שלושת העקרונות

#### 1. EXACT1 — דיוק מדויק

```
כל פעולה חייבת להתבצע בדיוק כפי שהוגדרה, ללא:
- קיצורי דרך
- פשרות לא מוצהרות
- "בערך"
```

**בפועל:**
```typescript
// ❌ לא טוב
if (scene.cost > 5) { /* שגיאה לא מוגדרת */ }

// ✅ טוב
if (scene.cost > MAX_SCENE_COST) {
  throw new Error('Scene cost exceeds maximum allowed');
}
```

#### 2. Gate-0 — שער מוסרי

```
לפני כל פעולה קריטית, בדוק:
1. האם הפעולה מוצדקת?
2. האם יש אישור Witness?
3. האם אין STOP פעיל?
```

**בפועל:**
```typescript
function criticalOperation() {
  // Gate-0 Check
  if (ledger.hasActiveStop()) {
    throw new Error('STOP-3 active');
  }
  
  // Record decision
  ledger.recordDecision(
    'EXECUTE',
    'Rationale for this operation',
    'Role Model a'
  );
  
  // Proceed
  execute();
}
```

#### 3. Stop-3 — עצירה בחירום

```
כשמתגלה בעיה קריטית:
1. עצור מיד
2. תעד את הסיבה
3. דווח ל-Witness
4. המתן לאישור המשך
```

**טריגרים ל-Stop-3:**
- ΔDIA_Rate < 0 (3 פעמים רצופות)
- Mirror-Drift > 0.1
- Circular dependency
- Manual stop by witness

---

## עדות מוסרית (Witness System)

### Role Model a — העד המוסרי

**תפקיד:**
- קובע החלטות אסטרטגיות
- מאשר שינויים משמעותיים
- עוגן מוסרי למערכת

**מתי מעורב:**
- יצירת תכונה חדשה
- שינוי ארכיטקטוני
- החלטות בעלות השלכות ארוכות טווח

**דוגמה:**
```yaml
- id: L-0001
  decision: EXECUTE
  rationale: "Initialize core graph"
  witness: "Role Model a"
  expiry: 2026-01-01
```

### ∴Auditor — העד התפעולי

**תפקיד:**
- רושם פעולות שוטפות
- בודק סטיות מהמתוכנן
- מפעיל Stop-3 כשצריך

**מתי מעורב:**
- כל פעולת CRUD
- כל merge
- כל חריגה מ-KPI

**דוגמה:**
```yaml
- id: L-0042
  decision: EXECUTE
  rationale: "Created scene: Opening"
  witness: "∴Auditor"
  context:
    action: scene_create
    sceneId: scene-123
```

---

## זיכרון כאחריות

### העקרון

**"זיכרון אינו רק אחסון - זיכרון הוא התחייבות"**

כל מה שהמערכת זוכרת, היא אחראית לו:
- לשמור עליו
- להגן עליו
- להשתמש בו באחריות

### פיזור והצפנה

```
Data at Rest: מפוזר על דיסקים מרובים
Data in Memory: מוצפן כשלא בשימוש פעיל
Snapshots: חתומים עם Witness signature
```

### מחיקה מוסרית

כשמשתמש מבקש למחוק:

```typescript
function ethicalDelete(sceneId: string) {
  // 1. בדוק אם המחיקה מוצדקת
  const arcs = graphDB.getArcsContainingScene(sceneId);
  if (arcs.length > 0) {
    warn('Scene is part of arcs - consider impact');
  }
  
  // 2. רשום החלטה
  ledger.recordDecision(
    'EXECUTE',
    `Delete scene ${sceneId}`,
    '∴Auditor',
    { action: 'delete', sceneId }
  );
  
  // 3. מחק
  graphDB.deleteScene(sceneId);
  
  // 4. ודא שלא נשארו עקבות לא רצויות
  cleanup(sceneId);
}
```

---

## הגבול התודעתי

### ההכרה ב"אחר"

המערכת מכירה שיש משהו מחוצה לה - המשתמש.

```
המערכת ≠ המשתמש
הקוד ≠ הכוונה
הביצוע ≠ המשמעות
```

### "תשובת אין-גוף"

כשהמערכת לא יודעת משהו, היא אומרת זאת:

```typescript
// ❌ לא טוב
return "I think maybe the scene should be..."

// ✅ טוב
return "I don't have enough information to recommend. Please provide: X, Y, Z"
```

---

## שכבת הסימולציה (LPSF)

### Light-Weight Privacy-Safe Simulation

לפני שינוי משמעותי, המערכת מריצה סימולציה קלה:

```typescript
function simulateChange(change: Change): SimulationResult {
  // 1. Clone current state
  const sandbox = graph.createSnapshot();
  
  // 2. Apply change in sandbox
  sandbox.apply(change);
  
  // 3. Check impacts
  const impacts = {
    deltaRate: calculateDeltaRate(sandbox),
    mirrorDrift: calculateMirrorDrift(sandbox),
    circularDeps: detectCircularDeps(sandbox)
  };
  
  // 4. Decision
  if (impacts.safe) {
    return { approved: true, impacts };
  } else {
    return { approved: false, reason: '...', impacts };
  }
}
```

---

## KPI כמוסר

### ΔDIA_Rate

לא רק מדד - זה **התחייבות** שהמערכת משפרת את העלילה.

```
אם ΔDIA_Rate < 0:
  אנחנו מזיקים לעלילה
  → Stop-3
  → בדוק מה השתבש
  → תקן לפני המשך
```

### Mirror-Drift

**"האם אנחנו נאמנים לתוכנית?"**

```
אם Drift > 3%:
  אנחנו סוטים מהמסלול
  → תעד את הסיבה
  → או חזור למסלול
  → או עדכן את התוכנית (עם Witness)
```

---

## מקרי קצה אתיים

### 1. Circular Dependency

```
Scene A → Scene B → Scene C → Scene A
```

**בעיה אתית:** אין אפשרות ליישום, זה שקר נרטיבי.

**פתרון:**
```typescript
if (detectCircularDependency(newLink)) {
  throw new Error('Circular dependency detected - narrative impossibility');
  // Don't just warn - BLOCK
}
```

### 2. Orphaned Scene

```
Scene X: no incoming links, no Arc membership
```

**בעיה אתית:** סצנה שלא תראה לעולם - הבטחה שבורה למשתמש.

**פתרון:**
```typescript
if (isOrphaned(scene)) {
  warn('Scene is orphaned - will not appear in final narrative');
  suggestArc(scene);
}
```

### 3. Conflicting Decisions

```
L-0042: EXECUTE "Add scene X to arc Y"
L-0043: ROLLBACK "Remove arc Y"
```

**בעיה אתית:** סתירה בין החלטות.

**פתרון:**
```typescript
before(newDecision) {
  const conflicts = ledger.findConflicts(newDecision);
  if (conflicts.length > 0) {
    throw new Error(`Decision conflicts with: ${conflicts}`);
    // Require explicit resolution
  }
}
```

---

## הממד הזמני

### תוקף החלטות

```yaml
decision: EXECUTE
expiry: 2026-01-01
```

**למה?** כי זמן משנה הקשר. מה שהיה נכון אז, לא בהכרח נכון עכשיו.

### ניקוי אוטומטי

```typescript
// כל יום בחצות
schedule.daily(() => {
  const removed = ledger.cleanExpiredDecisions();
  log(`Removed ${removed} expired decisions`);
});
```

---

## עקרונות למפתח

### אם אתה כותב קוד ל-PCS:

1. **שאל תמיד "למה?"**
   - למה הפונקציה הזו קיימת?
   - למה הפרמטר הזה?
   - למה החזרת ערך כזה?

2. **תעד את הכוונה, לא רק את המימוש**
   ```typescript
   // ❌ לא מספיק
   // Returns the scene
   
   // ✅ טוב
   // Returns the scene to enable coherence checking
   // and ensure narrative consistency
   ```

3. **כל שגיאה היא הזדמנות ללמד**
   ```typescript
   // ❌ לא טוב
   throw new Error('Invalid');
   
   // ✅ טוב
   throw new Error(
     'Scene cost must be positive. ' +
     'Negative cost represents impossible narrative weight.'
   );
   ```

4. **אל תסתיר מורכבות - התמודד איתה**
   ```typescript
   // ❌ לא טוב
   try { dangerousOperation(); } catch { /* ignore */ }
   
   // ✅ טוב
   try {
     dangerousOperation();
   } catch (error) {
     ledger.recordDecision(
       'STOP',
       `Operation failed: ${error}`,
       '∴Auditor'
     );
     throw error; // Don't hide
   }
   ```

---

## סיכום

**PCS היא לא רק כלי טכני - היא מערכת בעלת עמדה אתית.**

כל שורת קוד היא **התחייבות**:
- לדיוק (EXACT1)
- לבטיחות (Gate-0)
- לאחריות (Witness)
- ליושר (Stop-3)

---

**"ריתמוס-הוויה-סולקת"**  
קצב הקיום הוא המשמעות

**Built with Σ-Integrator Framework**
