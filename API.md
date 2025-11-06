# API Reference — PCS

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health & Status

#### GET /health

בדיקת תקינות המערכת.

**Response:**
```json
{
  "status": "ok",
  "version": "2025.11.1",
  "timestamp": "2025-11-06T10:00:00.000Z",
  "stats": {
    "sceneCount": 5,
    "arcCount": 2,
    "totalCost": 12.5,
    "avgScenePerArc": 2.5
  }
}
```

---

### Scenes

#### POST /scene

יצירת סצנה חדשה.

**Request Body:**
```json
{
  "title": "Opening Scene",
  "premise": "Hero discovers the call to adventure",
  "why": "Establish protagonist and inciting incident",
  "how": "Visual discovery of mysterious letter",
  "cost": 2.5
}
```

**Response:** `201 Created`
```json
{
  "id": "scene-1699000000000-1234",
  "title": "Opening Scene",
  "premise": "Hero discovers the call to adventure",
  "why": "Establish protagonist and inciting incident",
  "how": "Visual discovery of mysterious letter",
  "cost": 2.5,
  "links": [],
  "metadata": {
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `400 Bad Request` - חסרים שדות חובה
- `500 Internal Server Error` - שגיאת שרת

---

#### GET /scene/:id

שליפת סצנה לפי ID.

**Response:** `200 OK`
```json
{
  "id": "scene-1699000000000-1234",
  "title": "Opening Scene",
  ...
}
```

**Errors:**
- `404 Not Found` - סצנה לא נמצאה

---

#### GET /scenes

שליפת כל הסצנות.

**Response:** `200 OK`
```json
[
  {
    "id": "scene-1699000000000-1234",
    "title": "Opening Scene",
    ...
  },
  ...
]
```

---

#### PUT /scene/:id

עדכון סצנה קיימת.

**Request Body:**
```json
{
  "title": "Updated Opening Scene",
  "cost": 3.0
}
```

**Response:** `200 OK` - הסצנה המעודכנת

---

#### DELETE /scene/:id

מחיקת סצנה.

**Response:** `200 OK`
```json
{
  "success": true,
  "id": "scene-1699000000000-1234"
}
```

**Note:** הסצנה תוסר גם מכל ה-Arcs שמכילים אותה.

---

### Arcs

#### POST /arc

יצירת Arc חדש.

**Request Body:**
```json
{
  "intent": "Hero's Journey - Act 1"
}
```

**Response:** `201 Created`
```json
{
  "id": "arc-1699000000000-5678",
  "intent": "Hero's Journey - Act 1",
  "scenes": [],
  "metadata": {
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z",
    "status": "draft",
    "priority": 0
  }
}
```

---

#### GET /arc/:id

שליפת Arc לפי ID.

**Response:** `200 OK`

---

#### GET /arcs

שליפת כל ה-Arcs.

**Response:** `200 OK`

---

#### POST /arc/:id/scene

הוספת סצנה ל-Arc.

**Request Body:**
```json
{
  "sceneId": "scene-1699000000000-1234",
  "position": 0
}
```

**Response:** `200 OK` - ה-Arc המעודכן

**Note:** `position` אופציונלי. אם לא מסופק, הסצנה תתוסף בסוף.

---

#### DELETE /arc/:id

מחיקת Arc.

**Response:** `200 OK`

---

### Decision Ledger

#### GET /ledger

שליפת כל ההחלטות.

**Response:** `200 OK`
```json
[
  {
    "id": "L-0001",
    "decision": "EXECUTE",
    "rationale": "Initialize core graph",
    "witness": "Role Model a",
    "timestamp": "2025-11-06T10:00:00.000Z",
    "expiry": "2026-01-01T00:00:00.000Z",
    "context": {
      "action": "system_init"
    },
    "metadata": {
      "verified": true
    }
  },
  ...
]
```

---

#### GET /ledger/active

שליפת החלטות פעילות (לא פג תוקפן).

**Response:** `200 OK`

---

#### GET /ledger/stats

סטטיסטיקות של הלוג.

**Response:** `200 OK`
```json
{
  "total": 15,
  "active": 12,
  "expired": 3,
  "byType": {
    "EXECUTE": 10,
    "ROLLBACK": 2,
    "STOP": 1,
    "MERGE": 2
  },
  "byWitness": {
    "Role Model a": 5,
    "∴Auditor": 10
  }
}
```

---

#### POST /ledger/decision

רישום החלטה חדשה.

**Request Body:**
```json
{
  "decision": "EXECUTE",
  "rationale": "Manual scene creation approved",
  "witness": "Role Model a",
  "context": {
    "action": "manual_override",
    "sceneId": "scene-123"
  },
  "expiryDays": 30
}
```

**Response:** `201 Created` - ההחלטה החדשה

---

#### GET /ledger/export

ייצוא הלוג ב-YAML.

**Response:** `200 OK` (Content-Type: text/yaml)
```yaml
- id: L-0001
  decision: EXECUTE
  rationale: "Initialize core graph"
  witness: "Role Model a"
  timestamp: 2025-11-06T10:00:00.000Z
  expiry: 2026-01-01T00:00:00.000Z
```

---

### Graph Analytics

#### GET /graph/stats

סטטיסטיקות הגרף.

**Response:** `200 OK`
```json
{
  "sceneCount": 5,
  "arcCount": 2,
  "totalCost": 12.5,
  "avgScenePerArc": 2.5
}
```

---

#### GET /graph/snapshot

יצירת Snapshot של הגרף הנוכחי.

**Response:** `200 OK`
```json
{
  "scenes": [...],
  "arcs": [...],
  "metadata": {
    "version": "2025.11.1",
    "timestamp": "2025-11-06T10:00:00.000Z"
  }
}
```

---

## Error Responses

כל שגיאה מוחזרת בפורמט:

```json
{
  "error": "Error message description"
}
```

### Status Codes

- `200 OK` - בקשה הצליחה
- `201 Created` - משאב נוצר בהצלחה
- `400 Bad Request` - בקשה לא תקינה
- `404 Not Found` - משאב לא נמצא
- `500 Internal Server Error` - שגיאת שרת

---

## Rate Limiting

אין הגבלת קצב ב-MVP. בפרודקשן יהיה:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## Authentication

ב-MVP אין אימות. בפרודקשן:
- JWT tokens
- API keys לאינטגרציות חיצוניות

---

**Built with Σ-Integrator Framework**
