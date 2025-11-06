# ✅ PCS Repository — הריפו מוכן!

יצרתי לך ריפו מלא ומתפקד של **PCS (Plot Control System)** עם כל התשתיות הדרושות ל-Sprint 1.

## 📦 מה כלול בריפו?

### קבצי קוד ליבה
✅ **GraphDB** - בסיס נתונים גרפי לסצנות ו-Arcs  
✅ **Scene** - מודל סצנה עם validation  
✅ **Arc** - מודל קשת עלילתית  
✅ **DecisionLedger** - יומן החלטות עם Witness  
✅ **API Server** - Express server עם REST endpoints  
✅ **React UI** - ממשק משתמש בסיסי  

### תיעוד מקיף
📖 **README.md** - סקירה כללית ויעדי Sprint  
📖 **QUICKSTART.md** - התחלה מהירה תוך 5 דקות  
📖 **CONTRIBUTING.md** - מדריך לתורמים  
📖 **docs/API.md** - תיעוד API מלא  
📖 **docs/ARCHITECTURE.md** - הסבר ארכיטקטורה מעמיק  
📖 **docs/ETHICS.md** - המסגרת האתית של Σ-Integrator  

### קונפיגורציה
⚙️ **package.json** - Dependencies וסקריפטים  
⚙️ **tsconfig.json** - TypeScript configuration  
⚙️ **vite.config.ts** - Vite configuration  
⚙️ **.eslintrc.json** - ESLint rules  
⚙️ **.prettierrc** - Code formatting  
⚙️ **jest.config.js** - Testing setup  
⚙️ **.gitignore** - Git ignore patterns  
⚙️ **.env.example** - Environment variables template  

### בדיקות
🧪 **tests/Scene.test.ts** - Unit tests לדוגמה

## 🚀 איך להתחיל?

### 1. התקנת Dependencies

```bash
cd pcs-repo
npm install
```

### 2. הרצת הפרויקט

```bash
# Backend + Frontend ביחד
npm run dev

# רק Backend (API)
npm run dev:api

# רק Frontend (UI)
npm run dev:ui
```

### 3. בדיקת תקינות

פתח דפדפן ב:
- **UI:** http://localhost:5173
- **API Health:** http://localhost:3000/health

### 4. הרצת בדיקות

```bash
npm test
```

## 📊 מבנה הפרויקט

```
pcs-repo/
├── src/
│   ├── core/           # Scene, Arc, GraphDB
│   ├── api/            # Express REST API
│   ├── ui/             # React components
│   └── ledger/         # Decision Ledger
├── tests/              # Unit tests
├── docs/               # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── ETHICS.md
├── README.md
├── QUICKSTART.md
├── CONTRIBUTING.md
├── package.json
└── tsconfig.json
```

## ✨ תכונות מיושמות (Sprint 1)

✅ **Graph Database** - ניהול סצנות ו-Arcs  
✅ **CRUD API** - Endpoints מלאים  
✅ **Decision Ledger** - רישום החלטות עם Witness  
✅ **React UI** - ממשק בסיסי לניהול  
✅ **Validation** - בדיקות תקינות  
✅ **TypeScript** - Type safety מלא  
✅ **Tests** - Unit tests לדוגמה  

## 🎯 Sprint 2 - מה הלאה?

הפרויקט מוכן לשלב הבא:

1. **SAT Solver** לקוהרנטיות נרטיבית
2. **Branch Manager** + Rollback Snapshots
3. **Mirror Sidecar** לבקרת Merge
4. **Arc Planner** מורחב (A.R.I.D-5 Flow)

## 📚 לקריאה נוספת

- קרא **QUICKSTART.md** להתחלה מהירה
- קרא **docs/API.md** לתיעוד API מפורט
- קרא **docs/ARCHITECTURE.md** להבנת המבנה
- קרא **docs/ETHICS.md** להבנת המסגרת האתית
- קרא **CONTRIBUTING.md** אם רוצה לתרום

## 🔧 פקודות שימושיות

```bash
npm run dev          # Run everything
npm run dev:api      # Run API only
npm run dev:ui       # Run UI only
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run format       # Format code
npm run build        # Build for production
```

## 🌟 עקרונות Σ-Integrator מיושמים

✅ **EXACT1** - דיוק מדויק בביצוע  
✅ **Gate-0** - שער מוסרי לפני כל פעולה  
✅ **Stop-3** - עצירת חירום  
✅ **Witness System** - Role Model a & ∴Auditor  
✅ **"ידע≡אחריות; כל מדידה≡מוסר"**  

## 💡 טיפים

- **עבודה בענפים:** השתמש ב-Git branches לתכונות חדשות
- **Commit Messages:** עקוב אחר הפורמט ב-CONTRIBUTING.md
- **Code Review:** תמיד בדוק עם 2 מפתחים לפני merge
- **Testing:** כתוב tests לכל תכונה חדשה

---

**הצלחה בפיתוח! 🚀**

*Built with Σ-Integrator Framework*  
*"ריתמוס-הוויה-סולקת"*
