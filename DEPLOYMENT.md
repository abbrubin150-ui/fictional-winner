# 🚀 PCS Deployment Guide

מדריך מקיף לפריסת PCS (Plot-Control System) על פלטפורמות שונות.

## 📋 תוכן עניינים

- [GitHub Actions CI/CD](#github-actions-cicd)
- [GitHub Pages](#github-pages)
- [Netlify](#netlify)
- [Vercel](#vercel)
- [AWS S3 + CloudFront](#aws-s3--cloudfront)
- [Docker](#docker)
- [שרת Linux מקומי](#שרת-linux-מקומי)

---

## 🔄 GitHub Actions CI/CD

המערכת כוללת 4 workflows אוטומטיים:

### 1. CI Pipeline (`.github/workflows/ci.yml`)
- מופעל על: `push` ו-`pull_request` לענפי `main` ו-`develop`
- בודק: lint, tests, TypeScript compilation, coverage
- מריץ: בדיקות אתיות (EXACT1, Witness signatures)

### 2. Production Deployment (`.github/workflows/deploy.yml`)
- מופעל על: `push` ל-`main` או tags `v*`
- מבצע: build, test, deploy to GitHub Pages
- יוצר: GitHub releases אוטומטיים עם artifacts

### 3. Preview Deployments (`.github/workflows/preview-deploy.yml`)
- מופעל על: pull requests
- מספק: preview builds עם quality checks
- מוסיף: תגובה אוטומטית ל-PR עם פרטי ה-build

### 4. Alternative Deployments (`.github/workflows/deploy-alternatives.yml`)
- מופעל: ידנית דרך GitHub Actions UI
- תומך ב: Netlify, Vercel, AWS S3, Docker Hub

---

## 🌐 GitHub Pages

### הגדרה ראשונית

1. **הפעל GitHub Pages בריפוזיטורי:**
   - עבור ל-Settings → Pages
   - בחר Source: "GitHub Actions"

2. **Deploy אוטומטי:**
   ```bash
   git push origin main
   ```

3. **הפרויקט יהיה זמין ב:**
   ```
   https://<username>.github.io/<repo-name>/
   ```

### הערות
- הפריסה מתבצעת אוטומטית על כל push ל-main
- זמן פריסה: ~2-3 דקות
- SSL/HTTPS מוגש אוטומטית

---

## 📦 Netlify

### הגדרה ראשונית

1. **צור חשבון Netlify** והתחבר לGitHub

2. **הוסף Secrets ל-GitHub Repository:**
   ```
   Settings → Secrets → Actions:
   - NETLIFY_AUTH_TOKEN: <your-token>
   - NETLIFY_SITE_ID: <your-site-id>
   ```

3. **Deploy ידני:**
   - עבור ל-Actions → Alternative Deployments
   - Run workflow → בחר "netlify"

### Deploy CLI מקומי

```bash
# התקן Netlify CLI
npm install -g netlify-cli

# התחבר לחשבון
netlify login

# Build ו-Deploy
npm run build
netlify deploy --prod --dir=dist
```

### netlify.toml (אופציונלי)

צור `netlify.toml` בשורש הפרויקט:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## ▲ Vercel

### הגדרה ראשונית

1. **צור חשבון Vercel** והתחבר לGitHub

2. **הוסף Secrets:**
   ```
   - VERCEL_TOKEN: <your-token>
   - VERCEL_ORG_ID: <org-id>
   - VERCEL_PROJECT_ID: <project-id>
   ```

3. **Deploy אוטומטי:**
   - Vercel מזהה אוטומטית את הריפוזיטורי
   - כל push ל-main מפרוס אוטומטית

### Deploy CLI מקומי

```bash
# התקן Vercel CLI
npm install -g vercel

# התחבר
vercel login

# Deploy
vercel --prod
```

### vercel.json

צור `vercel.json` בשורש:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## ☁️ AWS S3 + CloudFront

### הגדרה ראשונית

1. **צור S3 Bucket:**
   ```bash
   aws s3 mb s3://pcs-deployment
   aws s3 website s3://pcs-deployment \
     --index-document index.html \
     --error-document index.html
   ```

2. **הגדר CloudFront Distribution** (אופציונלי)

3. **הוסף Secrets ל-GitHub:**
   ```
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - AWS_S3_BUCKET
   - AWS_CLOUDFRONT_DISTRIBUTION_ID (אופציונלי)
   ```

### Deploy CLI מקומי

```bash
# Build הפרויקט
npm run build

# Upload ל-S3
aws s3 sync dist/ s3://pcs-deployment/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

---

## 🐳 Docker

### Build מקומי

```bash
# Build image
docker build -t pcs:latest .

# Run container
docker run -p 3000:3000 pcs:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Push ל-Docker Hub

```bash
# Tag image
docker tag pcs:latest <username>/pcs:latest

# Push
docker push <username>/pcs:latest
```

### הגדרות GitHub Actions

הוסף Secrets:
```
- DOCKER_USERNAME
- DOCKER_PASSWORD
```

---

## 🖥️ שרת Linux מקומי

### דרישות מערכת

- Node.js 18+ או 20+
- npm 9+
- PM2 (מומלץ לניהול תהליכים)

### התקנה

```bash
# Clone repository
git clone <repo-url>
cd pcs

# Install dependencies
npm ci

# Build
npm run build

# התקן PM2 (אופציונלי)
npm install -g pm2
```

### הרצה עם PM2

צור `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'pcs',
    script: './server.ts',
    interpreter: 'ts-node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M'
  }]
}
```

הפעל:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

הגדר `/etc/nginx/sites-available/pcs`:
```nginx
server {
    listen 80;
    server_name pcs.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

הפעל:
```bash
sudo ln -s /etc/nginx/sites-available/pcs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL עם Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pcs.yourdomain.com
```

---

## 🔧 משתני סביבה (Environment Variables)

צור `.env.production`:
```bash
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

---

## 📊 ניטור ובדיקות

### Health Check Endpoint

הוסף endpoint בדיקת בריאות ב-`server.ts`:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Monitoring Services

מומלץ לשלב עם:
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry, Rollbar
- **Analytics:** Google Analytics, Plausible

---

## 🔒 אבטחה

### Checklist לפריסה

- [ ] הגדר HTTPS/SSL
- [ ] הגדר CORS נכון
- [ ] הסתר API keys ב-environment variables
- [ ] הפעל rate limiting
- [ ] הגדר security headers (Helmet.js)
- [ ] עדכן dependencies (npm audit fix)
- [ ] הגדר firewall rules
- [ ] הפעל logs ו-monitoring

---

## 📞 תמיכה

אם נתקלת בבעיות בפריסה:
1. בדוק את הlogs ב-GitHub Actions
2. ודא שכל ה-secrets מוגדרים נכון
3. בדוק את ה-build logs
4. פנה לתיעוד של הפלטפורמה הספציפית

---

**Built with Σ-Integrator Framework**
*"ידע≡אחריות; כל מדידה≡מוסר"*
