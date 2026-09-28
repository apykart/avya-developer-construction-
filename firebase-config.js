/* ============================================================
   FIREBASE CONFIG — used by index.html, admin.html, associate.html
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com → Create Project
   2. Project Settings → General → Add app → Web (</>) → copy config below
   3. Build → Authentication → Sign-in method → enable "Email/Password"
   4. Build → Firestore Database → Create database (Production mode)
   5. Paste the Firestore rules from firestore.rules into
      Firestore → Rules tab, then Publish
   ============================================================ */
const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
    messagingSenderId: "PASTE_YOUR_SENDER_ID",
    appId: "PASTE_YOUR_APP_ID"
};

// Primary app — used for the page's own logged-in session
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Secondary app instance — ONLY used by admin.html when creating a new
// associate/manager login. Firebase's createUserWithEmailAndPassword()
// normally signs you in as the NEW user; running it on a second app
// instance means the admin's own session stays untouched.
const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = secondaryApp.auth();
