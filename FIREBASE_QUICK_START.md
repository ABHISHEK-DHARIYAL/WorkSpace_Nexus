# Quick Start: Firebase Auth Setup for Workspace Nexus

## TL;DR - 3 Steps

### Step 1: Configure Environment (2 min)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_APP_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
```

### Step 2: Firebase Console Setup (3 min)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Authentication → Settings → Authorized domains
4. Verify `localhost` and `127.0.0.1` are listed (auto-added usually)
5. Add your production domain(s):
   - Vercel: `your-app.vercel.app`
   - Custom domain: `yourdomain.com`

### Step 3: Run It

```bash
npm install  # if needed
npm run dev
```

Visit `http://localhost:3000` and test Google login!

---

## For Vercel Deployment

### Before deploying, set environment variables:

**Vercel Dashboard → Settings → Environment Variables**

```
VITE_APP_URL=https://your-app.vercel.app
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
JWT_SECRET=your-production-secret
NODE_ENV=production
```

### Firebase: Add Vercel domains

- `your-app.vercel.app` (production)
- `*.vercel.app` (preview deployments)

Then push to main branch and Vercel will deploy! 🚀

---

## Debug: Check Configuration

Open browser console (F12) and look for `[Auth Debug Info]` group showing:

- ✅ Environment detected
- ✅ Firebase config status
- ✅ Current domain

If something's wrong, it will show helpful error messages!

---

## Common Issues

| Issue                       | Fix                                                        |
| --------------------------- | ---------------------------------------------------------- |
| "unauthorized-domain" error | Add domain to Firebase Console → Auth → Authorized domains |
| Popup blocked               | Browser popup settings, or use incognito/private mode      |
| "No Firebase credentials"   | Check VITE*FIREBASE*\* vars in .env and console            |
| Session expires on refresh  | Normal for fresh deployments, just login again             |
| Environment vars empty      | Restart dev server after editing .env                      |

---

## File Reference

- 📄 `.env.example` - Environment template
- 📄 `vercel.json` - SPA routing for Vercel
- 📄 `config/firebase.ts` - Firebase initialization
- 📄 `frontend/services/auth/authUtils.ts` - Auth helpers
- 📄 `frontend/context/AuthContext.tsx` - Auth provider
- 📄 `FIREBASE_SETUP.md` - Full setup guide

---

**Ready to go!** 🎉

Need detailed troubleshooting? See `FIREBASE_SETUP.md`
