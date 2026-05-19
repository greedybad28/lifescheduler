# 🚀 Deployment Guide: Vercel + Firebase

## Step 1: Set Up Firebase

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add Project"**
3. Name: `life-system-calendar`
4. Uncheck "Enable Google Analytics" (optional)
5. Click **Create Project**

### 1.2 Get Your Firebase Config
1. Click the gear icon → **Project Settings**
2. Scroll down to "Your apps" section
3. Click the Web icon `</>`
4. Copy the config object that looks like:
```javascript
{
  apiKey: "AIza...",
  authDomain: "life-system-calendar.firebaseapp.com",
  projectId: "life-system-calendar",
  storageBucket: "life-system-calendar.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
}
```

### 1.3 Update Firebase Config
Edit `firebase-config.js` and paste your config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_VALUE",
    authDomain: "YOUR_VALUE",
    projectId: "YOUR_VALUE",
    storageBucket: "YOUR_VALUE",
    messagingSenderId: "YOUR_VALUE",
    appId: "YOUR_VALUE"
};
```

### 1.4 Create Firestore Database
1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode**
4. Select region (e.g., `us-central1`)
5. Click **Create**

### 1.5 Set Security Rules
In Firestore → **Rules** tab, replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Step 2: Update Your App

### 2.1 Replace Files
The app now has two versions:
- **`index.html`** (original - localStorage only)
- **`index-firebase.html`** (Firebase version)
- **`script.js`** (original)
- **`script-firebase.js`** (Firebase version)

To use Firebase, rename:
```bash
# Rename to use Firebase
mv index.html index-local.html
mv index-firebase.html index.html
mv script.js script-local.js
mv script-firebase.js script.js
```

### 2.2 Verify Structure
Your folder should have:
```
schedule/
├── index.html              # Firebase version
├── script.js               # Firebase version
├── style.css
├── firebase-config.js      # Your config
├── package.json
├── vercel.json
└── README.md
```

## Step 3: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd schedule
vercel
```

3. Follow prompts:
   - Link to existing project? → No (first time)
   - Project name? → `life-system-calendar`
   - Directory? → `./`
   - Deploy? → Yes

### Option B: GitHub + Vercel (Recommended for continuous deployment)

1. Create GitHub repo:
```bash
cd schedule
git init
git add .
git commit -m "Initial commit with Firebase"
git push -u origin main
```

2. Deploy on Vercel:
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Import"
   - Vercel auto-deploys!

3. (Optional) Add environment variables in Vercel dashboard:
   - Project → Settings → Environment Variables
   - Add your Firebase config values

### Option C: Direct Upload

1. Zip your `schedule` folder
2. Go to https://vercel.com/new
3. Upload zip or connect GitHub

## Step 4: Configure Vercel (if needed)

If you get `404` errors after deployment:

1. Go to Vercel Dashboard
2. Select your project
3. Settings → **Build & Development Settings**
4. Build Command: `echo 'Static site'`
5. Output Directory: (leave empty)
6. Save

## Step 5: Test Your Deployment

1. Visit your Vercel URL (you'll get it after deployment)
2. Add a task
3. Refresh page
4. ✅ Task should persist (synced to Firebase)
5. Open DevTools → Console to see sync status

## Troubleshooting

### Tasks not syncing?
- Check Firebase config in browser console
- Verify Firestore rules allow writes
- Check browser localStorage as fallback

### Firebase says "Permission denied"?
- Verify Firestore is in **test mode**
- Check security rules allow anonymous access
- Wait a few seconds for rules to propagate

### Deployment stuck?
- Check Vercel build logs
- Ensure all files are committed to Git
- Try deploying again

### White screen after deployment?
- Check browser console for errors
- Verify `firebase-config.js` is correctly configured
- Check that `index.html` references correct script files

## Going to Production

When ready for production:

1. **Enable Authentication** (optional):
   - Firebase → Build → Authentication
   - Add Google Sign-In
   - Users can sign up/login

2. **Switch Firestore to production mode**:
   - Firestore → Rules
   - Update to require authentication:
   ```javascript
   allow read, write: if request.auth != null;
   ```

3. **Set up backups**:
   - Firestore → Backups
   - Enable automatic daily backups

## Resources

- 📚 [Firebase Docs](https://firebase.google.com/docs)
- 🚀 [Vercel Docs](https://vercel.com/docs)
- 🔒 [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)

## Need Help?

Check your:
- Firebase Console → Firestore → Data (to see synced data)
- Vercel Dashboard → Deployments (to see deployment logs)
- Browser DevTools → Console (for error messages)
