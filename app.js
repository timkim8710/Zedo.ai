import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTRgfKgdma39T7SWkMelAuFWsBv6n_Zr8",
    authDomain: "zedo-6f33b.firebaseapp.com",
    projectId: "zedo-6f33b",
    storageBucket: "zedo-6f33b.firebasestorage.app",
    messagingSenderId: "335247934923",
    appId: "1:335247934923:web:5dbcdce9d4c29307e3e24e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ZEDO_KEY = "AIzaSyAyx-HliTT8iy0qjQzZ5rlCXU_7R8ZwnAo";

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.title = `Zedo | ${user.displayName.split(' ')[0]}'s Core`;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('userPhoto').src = user.photoURL;
        loadNotes("private");
        loadNotes("global");
    } else {
        document.title = "Zedo AI | Cosmic Knowledge";
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('userSection').style.display = 'none';
    }
});

// ... Include your previous loadNotes, upload, and chat functions here ...
