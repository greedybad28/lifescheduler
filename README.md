# Life System Calendar

A responsive calendar app to track your daily schedule and log accomplishments with Firebase cloud sync and Vercel hosting.

## Features
- 📅 Weekly and day view
- ✅ Task completion tracking
- 📝 Add notes and log entries to any task
- ☁️ Cloud sync with Firebase Firestore
- 🌙 Dark mode support
- 📱 Mobile-responsive design

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `life-system-calendar`
3. Enable Firestore Database (test mode)
4. Go to Project Settings → Get your Web app credentials
5. Copy the Firebase config values

### 2. Update Firebase Config

Edit `firebase-config.js` and replace with your Firebase credentials:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Deploy to Vercel

**Option A: CLI Deployment**
```bash
npm install -g vercel
cd schedule
vercel
```

**Option B: GitHub Integration**
1. Push to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import project from GitHub
4. Add environment variables (same as firebase-config.js)
5. Deploy

### 4. Set Firebase Rules

In Firebase Console → Firestore → Rules:
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

## Local Development

```bash
# No server needed - just open index.html in browser
# Or use Python:
python -m http.server 8000
# Visit http://localhost:8000
```

## How to Use

1. **Add Tasks**: Click the + button
2. **Log Progress**: Click ✏️ on any schedule block to add notes
3. **Track Completion**: Check off items as you complete them
4. **Sync Automatically**: All changes save to Firebase

## File Structure
```
schedule/
├── index.html           # Main HTML
├── style.css            # Styling
├── script.js            # Core logic (with Firebase)
├── firebase-config.js   # Firebase credentials
├── package.json         # Dependencies
├── vercel.json          # Vercel config
└── README.md            # This file
```

## Tech Stack
- Vanilla JavaScript (no build needed)
- Firebase Firestore (cloud database)
- Vercel (hosting)
- CSS Grid & Flexbox

## License
MIT
