# Quick Start for Firebase + Vercel

## 🔥 5-Minute Setup

### 1. Create Firebase Project (2 min)
```
1. Visit: console.firebase.google.com
2. New Project → "life-system-calendar"
3. Build → Firestore → Create Database (test mode)
4. Settings (gear) → Project Settings → Copy Web config
```

### 2. Update Config (1 min)
Edit `firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "PASTE_HERE",
    authDomain: "PASTE_HERE",
    // ... rest of values
};
```

### 3. Prepare App (1 min)
```bash
# In your schedule folder
mv index-firebase.html index.html
mv script-firebase.js script.js
```

### 4. Deploy to Vercel (1 min)
```bash
# Option 1: Vercel CLI
npm install -g vercel
vercel

# Option 2: Push to GitHub, then deploy on vercel.com
```

## ✅ Done! Your app is live and synced to Firebase!

---

## Files You Need

**For Firebase + Vercel:**
- ✅ `index.html` (Firebase version)
- ✅ `script.js` (Firebase version)
- ✅ `firebase-config.js` (YOUR config)
- ✅ `style.css` (same)
- ✅ `package.json`
- ✅ `vercel.json`

**Keep for reference:**
- 📝 `index-local.html` (local version backup)
- 📝 `script-local.js` (local version backup)
- 📝 `DEPLOYMENT.md` (full guide)

---

## Your Vercel URL

After deployment, you'll get a URL like:
```
https://life-system-calendar.vercel.app
```

Share this with anyone! All data syncs automatically via Firebase. 🚀
