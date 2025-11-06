# מדריך תרומה ל-PCS

תודה על העניין לתרום ל-Plot Control System! מסמך זה מספק הנחיות למפתחים שרוצים לתרום לפרויקט.

## 🎯 עקרונות ליבה

1. **ידע≡אחריות** - כל קוד שנכתב חייב להיות מובן ומתועד
2. **כל מדידה≡מוסר** - כל מדד או KPI חייב להיות מוצדק אתית
3. **EXACT1** - דיוק מדויק בביצוע, ללא קיצורי דרך
4. **Stop-3** - תמיד יש כפתור עצירה במצב חירום

## 🚀 התחלה מהירה

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/pcs-repo.git
cd pcs-repo
npm install
```

### 2. הרצת הפיתוח

```bash
# Backend + Frontend
npm run dev

# רק Backend
npm run dev:api

# רק Frontend
npm run dev:ui
```

### 3. הרצת בדיקות

```bash
npm test
npm run test:watch  # מצב watch
```

## 📝 כללי קוד

### TypeScript

- השתמש ב-TypeScript בלבד
- סוג כל פרמטר ו-return value
- השתמש ב-interfaces עבור מבני נתונים מורכבים
- אל תשתמש ב-`any` אלא אם כן הכרחי

### תיעוד

כל פונקציה/מחלקה חייבת לכלול:

```typescript
/**
 * תיאור קצר של מה הפונקציה עושה
 * 
 * @param param1 - תיאור הפרמטר
 * @param param2 - תיאור הפרמטר
 * @returns תיאור מה מוחזר
 */
```

### Commit Messages

השתמש בפורמט הבא:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: תכונה חדשה
- `fix`: תיקון באג
- `docs`: שינויים בתיעוד
- `refactor`: שיפור קוד ללא שינוי פונקציונליות
- `test`: הוספת בדיקות

דוגמה:
```
feat(scene): add validation for scene links

Added comprehensive validation for scene-to-scene links
to prevent circular dependencies and orphaned scenes.

Closes #42
```

## 🏗️ ארכיטקטורה

### מבנה הפרויקט

```
src/
├── core/       # מודלים בסיסיים (Scene, Arc, GraphDB)
├── api/        # REST API endpoints
├── ui/         # React components
├── solver/     # SAT solver לקוהרנטיות
└── ledger/     # Decision Ledger
```

### Decision Flow

כל שינוי משמעותי עובר דרך:

1. **Gate-0**: בדיקה מוסרית ראשונית
2. **Validation**: תקינות טכנית
3. **Decision Record**: רישום ב-Ledger
4. **Execute**: ביצוע בפועל
5. **Witness Sign**: חתימת עד מוסרי

## 🧪 בדיקות

### יצירת בדיקה חדשה

```typescript
import { Scene } from '../core/Scene';

describe('Scene', () => {
  it('should create scene with valid data', () => {
    const scene = new Scene(
      'test-1',
      'Test Scene',
      'Test premise',
      'Test why',
      'Test how',
      1.0
    );
    
    expect(scene.validate().valid).toBe(true);
  });
});
```

### הרצת בדיקות ספציפיות

```bash
npm test -- Scene.test.ts
```

## 📊 KPI & Telemetry

כל תכונה חדשה חייבת לכלול:

1. **KPI מוגדר** - מה נמדד?
2. **Stop Rule** - מתי עוצרים?
3. **Witness** - מי אחראי?

דוגמה:

```typescript
ledger.recordDecision(
  'EXECUTE',
  'Added new feature X',
  'Role Model a',
  { 
    action: 'feature_add',
    kpi: 'ΔDIA_Rate',
    stopRule: 'ΔDIA_Rate < 0'
  }
);
```

## 🔍 Code Review

### מה בודקים?

1. ✅ קוד עובר את כל הבדיקות
2. ✅ תיעוד מלא ועדכני
3. ✅ ממשק ה-API עקבי
4. ✅ החלטות רשומות ב-Ledger
5. ✅ אין הפרת עקרונות אתיים

### תהליך

1. צור Pull Request
2. הוסף תיאור מפורט
3. קשר לאיזו בעיה זה קשור
4. המתן ל-review מ-2 מפתחים
5. תקן הערות
6. Merge רק אחרי אישור

## 🤝 קהילה

### תקשורת

- **GitHub Issues**: לבאגים ובקשות תכונות
- **Discussions**: לשאלות כלליות
- **Email**: לעניינים פרטיים

### התנהגות

אנו שומרים על:
- כבוד הדדי
- תקשורת בונה
- שיתוף פעולה
- פתיחות לרעיונות חדשים

## 📚 משאבים נוספים

- [Architecture Deep Dive](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Ethical Framework](./docs/ETHICS.md)

## ❓ שאלות?

אל תהסס לשאול! פתח issue או כתב ל:
- moral.witness@pcs.local
- auditor@pcs.local

---

**תודה על התרומה לפרויקט! 🙏**
