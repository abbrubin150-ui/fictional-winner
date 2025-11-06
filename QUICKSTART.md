# Quick Start Guide — PCS

התחל לעבוד עם PCS תוך 5 דקות.

## דרישות מערכת

- Node.js ≥18.0.0
- npm ≥9.0.0

## התקנה

```bash
# 1. Clone the repository
git clone https://github.com/your-org/pcs-repo.git
cd pcs-repo

# 2. Install dependencies
npm install
```

## הרצה מקומית

### אופציה 1: Backend + Frontend ביחד

```bash
npm run dev
```

- API Server: http://localhost:3000
- UI: http://localhost:5173

### אופציה 2: רק Backend

```bash
npm run dev:api
```

API זמין ב-http://localhost:3000

### אופציה 3: רק Frontend

```bash
npm run dev:ui
```

UI זמין ב-http://localhost:5173 (דורש שה-API רץ)

## שימוש ראשון

### 1. בדיקת תקינות

```bash
curl http://localhost:3000/health
```

תקבל:
```json
{
  "status": "ok",
  "version": "2025.11.1",
  "stats": {...}
}
```

### 2. יצירת סצנה ראשונה

```bash
curl -X POST http://localhost:3000/scene \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Opening Scene",
    "premise": "Hero discovers the call to adventure",
    "why": "Establish protagonist",
    "how": "Visual discovery of letter",
    "cost": 2.5
  }'
```

### 3. שליפת כל הסצנות

```bash
curl http://localhost:3000/scenes
```

### 4. יצירת Arc

```bash
curl -X POST http://localhost:3000/arc \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Hero Journey - Act 1"
  }'
```

### 5. צפייה ב-Ledger

```bash
curl http://localhost:3000/ledger
```

## שימוש ב-UI

1. פתח http://localhost:5173 בדפדפן
2. לחץ "הוסף סצנה" כדי ליצור סצנה
3. לחץ "הוסף Arc" כדי ליצור קשת עלילתית
4. עבור לטאב "Ledger" כדי לראות החלטות

## הרצת בדיקות

```bash
# כל הבדיקות
npm test

# בדיקות ספציפיות
npm test -- Scene.test.ts

# בדיקות עם watch mode
npm run test:watch
```

## Build לפרודקשן

```bash
# Build Backend
npm run build

# Build UI
npm run build

# הקבצים ייווצרו ב-dist/
```

## פתרון בעיות נפוצות

### Port כבר תפוס

אם Port 3000 או 5173 תפוסים:

```bash
# For API
PORT=3001 npm run dev:api

# For UI - edit vite.config.ts
```

### Dependencies חסרים

```bash
# נקה והתקן מחדש
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Rebuild
npm run build
```

## מבנה הפרויקט

```
pcs-repo/
├── src/
│   ├── core/       # GraphDB, Scene, Arc
│   ├── api/        # Express server
│   ├── ui/         # React UI
│   ├── ledger/     # Decision Ledger
│   └── solver/     # SAT solver (Sprint 2)
├── tests/          # Unit tests
├── docs/           # Documentation
└── config/         # Configuration files
```

## פקודות נפוצות

```bash
npm run dev          # Run everything
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
npm run build        # Build for production
```

## שלב הבא

- קרא את [API.md](./docs/API.md) למדריך API מפורט
- קרא את [ARCHITECTURE.md](./docs/ARCHITECTURE.md) להבנת המבנה
- קרא את [CONTRIBUTING.md](./CONTRIBUTING.md) לתרומה לפרויקט

## עזרה

- 📖 Documentation: [docs/](./docs/)
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: moral.witness@pcs.local

---

**Happy Writing! 📖✨**
