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
    apiKey: "AIzaSyB57_Yzabh88H5GokibeBLhyQScOBIUIHY",
    authDomain: "avya-developer.firebaseapp.com",
    projectId: "avya-developer",
    storageBucket: "avya-developer.firebasestorage.app",
    messagingSenderId: "803397320568",
    appId: "1:803397320568:web:95e8ef551427730fe3528d",
    measurementId: "G-C2ZS1NSF4X"
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
