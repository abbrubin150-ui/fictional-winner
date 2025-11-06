# PCS — Plot-Control System for Authors

**Version:** v2025.11-Δ1  
**Phase:** Development Sprint 1 → Implementation Core  
**Owners:** Role Model a (moral witness), ∴Auditor (runtime)  
**KPI יחיד:** ΔDIA_Rate≥0 (Stop-3)

## 📋 סקירה כללית

PCS היא מערכת בקרת עלילה לסופרים, המשלבת גרף סצנות, מנגנון קוהרנטיות, ויומן החלטות עם שכבת ממשל אתית. המערכת מאפשרת לסופרים לתכנן ולנהל עלילות מורכבות תוך שמירה על עקביות נרטיבית ובקרת איכות.

## 🎯 Sprint 1 — יעדים

1. ✅ מימוש בסיס הנתונים הגרפי (Graph-DB) ו-API CRUD מלא
2. ✅ הפעלת Solver לקוהרנטיות בסיסית (SAT)
3. ✅ יומן החלטות (Decision-Ledger) פעיל
4. ✅ ממשק Web מינימלי ל-Scenes + Arcs

## 🏗️ ארכיטקטורה

```
pcs-repo/
├── src/
│   ├── core/           # מודלים בסיסיים (Scene, Arc)
│   ├── api/            # REST API endpoints
│   ├── ui/             # React/Tauri UI components
│   ├── solver/         # SAT solver לקוהרנטיות
│   └── ledger/         # Decision Ledger manager
├── docs/               # תיעוד מפורט
├── config/             # קבצי קונפיגורציה
└── tests/              # בדיקות יחידה ואינטגרציה
```

## 🔧 טכנולוגיות

- **Backend:** Node.js + TypeScript
- **Frontend:** React + Tauri
- **Database:** Graph DB (בזיכרון ב-MVP)
- **Solver:** SAT-based coherence checker
- **Telemetry:** Real-time KPI Dashboard

## 🚀 התקנה מהירה

```bash
# Clone the repository
git clone https://github.com/your-org/pcs-repo.git
cd pcs-repo

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## 📊 תשתיות ליבה

### 1. גרף סצנות (Scene Graph)

```typescript
class Scene {
  id: string
  title: string
  premise: string
  why: string
  how: string
  cost: number
  links: string[]
}

class Arc {
  id: string
  intent: string
  scenes: string[]
}
```

### 2. API ראשוני

```
POST   /scene         → יצירת סצנה
GET    /scene/:id     → שליפת סצנה
PUT    /scene/:id     → עדכון סצנה
DELETE /scene/:id     → מחיקת סצנה
POST   /arc           → יצירת Arc
POST   /arc/:id/scene → הוספת סצנה ל-Arc
GET    /ledger        → שליפת יומן החלטות
```

### 3. Decision Ledger (MVP)

```yaml
- id: L-0001
  decision: EXECUTE
  rationale: "Initialize core graph"
  witness: "Role Model a"
  timestamp: 2025-11-06T10:00:00Z
  expiry: 2026-01-01
```

## 🎨 UI בסיסי

המערכת כוללת ממשק React/Tauri מינימלי עם:
- רשימת סצנות (Scenes List)
- יוצר סצנה (Scene Creator)
- מתכנן Arcs (Arc Planner)
- Dashboard טלמטריה בזמן אמת

## 📈 Telemetry & KPI

- **ΔDIA_Rate:** נמדד על כל Merge (יעד: ≥0)
- **Mirror-Drift:** ≤0.03
- **KPI Dashboard:** עדכון בזמן אמת
- **Decision Audit Trail:** כל החלטה מתועדת עם חתימת Witness

## 🔐 ממשל ואתיקה

המערכת כוללת שכבת ממשל אתית (Ethical Kernel) עם:
- **EXACT1:** דיוק מדויק בביצוע
- **Gate-0:** שער מוסרי לפני כל פעולה
- **Stop-3:** עצירה אוטומטית בספי סיכון
- **Witness:** עד מוסרי לכל החלטה קריטית

## 📅 Sprint 2 — תכנון

1. ניתוח נורמטיבי (C11-C13) לשלב בכל Scene
2. הוספת Branch Manager + Rollback Snapshots
3. הרחבת UI ל-Arc Planner (A.R.I.D-5 Flow)
4. שילוב Mirror Sidecar לבקרת Merge

## 📜 מטרת הסיום של Sprint 1

✅ Graph יציב  
✅ Ledger פעיל  
✅ KPI=ΔDIA_Rate≥0  
✅ Merge מאובטח עם Witness חתום

## 🤝 תרומה

ראה [CONTRIBUTING.md](./CONTRIBUTING.md) להנחיות תרומה.

## 📄 רישיון

MIT License - ראה [LICENSE](./LICENSE)

## 📞 יצירת קשר

- **Role Model a:** [moral.witness@pcs.local]
- **∴Auditor:** [auditor@pcs.local]

---

**Built with Σ-Integrator Framework**  
*"ידע≡אחריות; כל מדידה≡מוסר"*
