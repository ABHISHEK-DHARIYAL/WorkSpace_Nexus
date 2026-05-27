# Firebase Authentication & Production Deployment Guide

## Overview

This document describes the configuration changes made to fix Firebase unauthorized-domain errors and ensure the Workspace Nexus application works correctly on Vercel production, Vercel preview deployments, and local development.

---

## Key Changes Made

### 1. **Environment Variables Standardization** ✅

**New naming convention: All frontend-exposed variables use `VITE_` prefix**

#### Frontend Variables (Exposed to browser)

```env
VITE_APP_URL=http://localhost:3000  # Current app URL
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

#### Backend Variables (Server-only)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
APP_URL=http://localhost:3000  # Optional: backend self-referential URL
```

### 2. **Vercel SPA Routing** ✅

Created `vercel.json` with proper SPA routing rewrites:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes fallback to `index.html` for client-side routing.

### 3. **Firebase Configuration** ✅

Enhanced `config/firebase.ts`:

- Environment detection (development vs production)
- Better error handling for persistence failures
- Reduced console warnings
- Production-safe initialization

### 4. **Auth Utilities** ✅

Created `frontend/services/auth/authUtils.ts`:

- `getAppUrl()`: Dynamically fetch the current app URL
- `getEnvironmentInfo()`: Detect deployment environment
- `handleUnauthorizedDomainError()`: User-friendly error messages
- `validateFirebaseConfig()`: Check Firebase configuration completeness
- `logAuthDebugInfo()`: Output debug information for troubleshooting

### 5. **AuthContext Enhancements** ✅

- Better error handling for `auth/unauthorized-domain` errors
- Logs helpful troubleshooting information
- Graceful fallbacks for popup-blocked scenarios
- Debug logging on initialization

### 6. **Backend Environment Support** ✅

Updated `backend/config/env.ts`:

- Supports both `APP_URL` (legacy) and `VITE_APP_URL` (new)
- Defaults to `http://localhost:3000` if not set

---

## Setup Instructions

### Local Development

1. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure for local dev:**

   ```env
   VITE_APP_URL=http://localhost:3000
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-dev-secret

   # Add your Firebase config from Firebase Console
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=firebase-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Add localhost to Firebase authorized domains:**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Authentication → Settings
   - Under "Authorized domains", verify these are added:
     - `localhost` ✓ (auto-added)
     - `127.0.0.1` ✓ (auto-added)
   - If not, add them manually

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Vercel Production Deployment

1. **Set environment variables in Vercel:**

   ```
   VITE_APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   JWT_SECRET=your-production-secret

   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

2. **Add Vercel domain to Firebase authorized domains:**

   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your domain:
     - `your-app.vercel.app` (production)
     - `*.vercel.app` (all Vercel preview deployments)
     - Any custom domain (if applicable)

3. **Deploy:**
   ```bash
   git push  # Triggers Vercel deployment
   ```

### Firebase Console Configuration

**CRITICAL: These steps are required for authentication to work**

1. **Go to Firebase Console → Authentication → Settings**

2. **Under "Sign-in method":**

   - Ensure "Google" is enabled
   - Ensure "Email/Password" is enabled (if using custom auth)

3. **Under "Authorized domains":**

   - Verify these domains are listed:
     - `localhost`
     - `127.0.0.1`
     - Your Vercel production domain (e.g., `your-app.vercel.app`)
     - `*.vercel.app` (for preview deployments)
     - Any custom domains

4. **OAuth Consent Screen:**
   - Configure if Google authentication requires it
   - Add your app name, logo, and support email

---

## Troubleshooting

### Error: `Firebase: Error (auth/unauthorized-domain)`

**Cause:** Your current domain is not in Firebase's authorized domains list.

**Solution:**

1. Check the error message for the problematic domain
2. Go to Firebase Console → Authentication → Settings
3. Add the domain to "Authorized domains"
4. Wait 2-5 minutes for changes to propagate
5. Refresh the app

**Debug info:**
Open browser console (F12) → Look for `[Auth Debug Info]` log group showing:

- Current domain
- App URL
- Firebase configuration status

### Popup blocked errors

**Cause:** Browser is blocking Google auth popups.

**Solution:**

1. Allow popups for your domain in browser settings
2. App will automatically fallback to redirect method
3. On mobile, redirect method is used automatically

### Session expires after refresh

**Cause:** Firebase auth token expired or localStorage cleared.

**Solution:**

- App will automatically redirect to login
- Login again to re-authenticate
- Ensure JWT_SECRET is consistent across deployments

### Environment variables not loaded

**Check:**

```javascript
// Open console and run:
console.log("VITE_APP_URL:", import.meta.env.VITE_APP_URL);
console.log(
  "VITE_FIREBASE_PROJECT_ID:",
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);
```

If empty or undefined:

1. Verify `.env` file exists in project root
2. Restart dev server (changes to .env require restart)
3. Check Vercel environment variables in dashboard
4. Ensure `VITE_` prefix is used (not `REACT_APP_`)

---

## Architecture

### Multi-Device Support

- **Mobile**: Uses redirect auth method automatically
- **Desktop**: Uses popup auth method (with fallback to redirect)
- **iFrame**: Uses redirect auth method automatically

### Environment Detection

- **Development**: `localhost`, `127.0.0.1`, or `import.meta.env.DEV === true`
- **Production**: Vercel domain, custom domain, or `import.meta.env.PROD === true`

### Offline Support

- Firestore persistence: Enabled automatically
- API cache: GET requests cached in localStorage
- Fallback served from cache if network fails

---

## Files Modified/Created

### New Files

- ✅ `vercel.json` - SPA routing and caching configuration
- ✅ `frontend/services/auth/authUtils.ts` - Auth utility functions

### Modified Files

- ✅ `.env.example` - Updated with VITE\_ prefixes and better documentation
- ✅ `config/firebase.ts` - Enhanced with environment detection and error handling
- ✅ `backend/config/env.ts` - Added VITE_APP_URL support
- ✅ `frontend/context/AuthContext.tsx` - Enhanced error handling and debug logging

---

## Migration from Legacy Setup

If you had hardcoded URLs or `APP_URL` variables:

**Before:**

```env
APP_URL=http://localhost:3000
```

**After:**

```env
VITE_APP_URL=http://localhost:3000
```

**In code:**

```typescript
// Before (if any):
const appUrl = process.env.APP_URL;

// After (automatic):
import { getAppUrl } from "@/frontend/services/auth/authUtils";
const appUrl = getAppUrl();
```

---

## Testing Checklist

- [ ] Local development works on `http://localhost:3000`
- [ ] Google login works on localhost
- [ ] Email/password login works on localhost
- [ ] App deploys to Vercel without errors
- [ ] Google login works on Vercel production domain
- [ ] Vercel preview deployments work
- [ ] Custom domain works (if applicable)
- [ ] Session persists after page refresh
- [ ] Offline mode works (cached content served)
- [ ] Console shows debug info on startup

---

## Performance & Security

✅ **Security:**

- JWT tokens stored in localStorage (safe for this SPA)
- Firebase auth tokens are secure and auto-managed
- No sensitive data exposed in frontend code
- HTTPS enforced in production

✅ **Performance:**

- Static assets cached immutably (max-age=31536000)
- API responses cached in localStorage
- Offline support enabled
- Lazy Firebase initialization

✅ **Monitoring:**

- Debug logging on startup
- Error messages include troubleshooting steps
- Console group organization for readability

---

## Need More Help?

1. **Check browser console** for debug information
2. **Check Vercel logs** for deployment errors
3. **Check Firebase Console** for configuration issues
4. **Visit Firebase docs**: https://firebase.google.com/docs/auth
5. **Visit Vercel docs**: https://vercel.com/docs
