# FleetLink Deployment Guide

## 🚀 Production Deployment

### Prerequisites

Before deploying to production, ensure you have:

- **Firebase CLI** installed (`npm install -g firebase-tools`)
- **Production Firebase Project** configured
- **Production Mapbox Token** with proper URL restrictions
- **Domain/Hosting** configured (if using custom domain)

### 1. Environment Setup

Create your production `.env` file:

```bash
cp .env.example .env
```

Configure production values:
```env
# Production Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=fleetlink-prod.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fleetlink-prod
REACT_APP_FIREBASE_STORAGE_BUCKET=fleetlink-prod.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Production Mapbox Token
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.your_production_token

# Production Environment
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_VERSION=1.0.0
```

### 2. Firebase Configuration

Initialize Firebase in your project:

```bash
firebase login
firebase init
```

Select the following features:
- ✅ Firestore
- ✅ Storage  
- ✅ Hosting

Configure `firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, public, immutable"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control", 
            "value": "max-age=0, no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### 3. Deploy Firestore Rules

Deploy security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. Build and Deploy

Build the production application:

```bash
# Install dependencies
npm ci --only=production

# Build optimized bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 5. Custom Domain (Optional)

Add custom domain in Firebase Console:
1. Go to Hosting → Add custom domain
2. Enter your domain (e.g., `app.fleetlink.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

## 🏗️ CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Create environment file
      run: |
        echo "REACT_APP_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
        echo "REACT_APP_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
        echo "REACT_APP_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
        echo "REACT_APP_FIREBASE_STORAGE_BUCKET=${{ secrets.FIREBASE_STORAGE_BUCKET }}" >> .env
        echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}" >> .env
        echo "REACT_APP_FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env
        echo "REACT_APP_MAPBOX_ACCESS_TOKEN=${{ secrets.MAPBOX_ACCESS_TOKEN }}" >> .env
        echo "NODE_ENV=production" >> .env
        echo "GENERATE_SOURCEMAP=false" >> .env
        
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Firebase
      if: github.ref == 'refs/heads/main'
      run: |
        npm install -g firebase-tools
        firebase deploy --token "${{ secrets.FIREBASE_TOKEN }}"
```

### Required GitHub Secrets

Add these secrets in GitHub Repository Settings → Secrets:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `MAPBOX_ACCESS_TOKEN`
- `FIREBASE_TOKEN` (get with `firebase login:ci`)

## 🔒 Security Configuration

### Firestore Security Rules

Ensure `firestore.rules` has proper security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their data
    match /trucks/{truckId} {
      allow read, write: if request.auth != null;
    }
    
    match /drivers/{driverId} {
      allow read, write: if request.auth != null;
    }
    
    match /loads/{loadId} {
      allow read, write: if request.auth != null;
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Security Rules

Update `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /truck_documents/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    match /driver_documents/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Public assets
    match /public/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

### Environment Security

- **Never commit** `.env` files to version control
- Use **environment-specific** Firebase projects (dev/staging/prod)
- Implement **domain restrictions** on API keys
- Enable **App Check** for additional security (optional)

## 📊 Monitoring and Analytics

### Error Monitoring with Sentry

Install Sentry:
```bash
npm install @sentry/react
```

Configure in `src/index.tsx`:
```typescript
import * as Sentry from '@sentry/react';

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
```

### Performance Monitoring

Add Firebase Performance:
```bash
npm install firebase/performance
```

Configure in `src/config/firebase.ts`:
```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

### Analytics Setup

Add Google Analytics:
```typescript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

## 🔄 Rollback Strategy

### Quick Rollback

If issues occur after deployment:

```bash
# Rollback to previous Firebase Hosting version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID

# Or deploy a specific version
git checkout <previous-commit-hash>
npm run build
firebase deploy --only hosting
```

### Database Rollback

- Firestore doesn't support automatic rollbacks
- Implement **backup strategies** before major changes
- Use **Firestore export/import** for data migration

## 📈 Performance Optimization

### Bundle Analysis

Analyze bundle size before deployment:

```bash
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Production Optimizations

1. **Enable Compression** in Firebase Hosting
2. **Use CDN** for static assets  
3. **Implement Service Worker** for caching
4. **Enable Firebase Performance Monitoring**

### Load Testing

Test production deployment:

```bash
# Install Artillery for load testing
npm install -g artillery

# Create load test
echo "config:
  target: 'https://your-app.web.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Load test'
    requests:
      - get:
          url: '/'" > loadtest.yml

# Run load test
artillery run loadtest.yml
```

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Firebase Authentication Issues**:
   - Check Firebase Auth domain configuration
   - Verify OAuth redirect URIs
   - Check environment variables

3. **Mapbox Token Issues**:
   - Verify token starts with `pk.`
   - Check URL restrictions in Mapbox dashboard
   - Ensure token has required scopes

4. **CORS Errors**:
   - Add production domain to Firebase Auth
   - Configure Mapbox token URL restrictions

### Health Check Endpoints

Implement health check for monitoring:

```typescript
// src/utils/healthCheck.ts
export const healthCheck = async () => {
  try {
    // Check Firebase connection
    await getDocs(query(collection(db, 'trucks'), limit(1)));
    
    // Check Mapbox connection  
    const response = await fetch('https://api.mapbox.com/v1/health');
    
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};
```

---

**Deployment Checklist:**

- ✅ Environment variables configured
- ✅ Firebase rules deployed
- ✅ Production build tested locally  
- ✅ Domain/SSL configured
- ✅ Monitoring enabled
- ✅ Backup strategy in place
- ✅ Rollback plan documented