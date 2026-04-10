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

// UI Selectors
const loginOverlay = document.getElementById('loginOverlay');
const notesList = document.getElementById('notesList');
const globalNotesList = document.getElementById('globalNotesList');
const chatDisplay = document.getElementById('chatDisplay');

// Auth Setup
document.getElementById('loginBtn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginOverlay.style.display = 'none';
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('userPhoto').src = user.photoURL;
        loadAllData();
    } else {
        loginOverlay.style.display = 'flex';
        document.getElementById('userSection').style.display = 'none';
    }
});

async function loadAllData() {
    loadNotes("private");
    loadNotes("global");
}

async function loadNotes(type) {
    const user = auth.currentUser;
    const targetList = type === "private" ? notesList : globalNotesList;
    const path = type === "private" ? collection(db, "users", user.uid, "notes") : collection(db, "global_notes");
    
    targetList.innerHTML = "";
    const q = query(path, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    
    snap.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = `${type === "private" ? '🪐' : '🌍'} ${doc.data().name}`;
        targetList.appendChild(li);
    });
}

// Upload Log
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const user = auth.currentUser;
    const file = e.target.files[0];
    if (!user || !file) return;

    const text = await file.text();
    // Defaulting to Private Upload. To make it global, change path to "global_notes"
    await addDoc(collection(db, "users", user.uid, "notes"), {
        name: file.name,
        content: text,
        timestamp: serverTimestamp()
    });
    loadNotes("private");
});

// Chat Logic (The Multi-Knowledge Fetch)
document.getElementById('sendBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    const q = document.getElementById('userInput').value;
    if (!q || !user) return;

    document.getElementById('userInput').value = "";
    appendMessage('user', q);
    const typing = appendMessage('zedo', "Merging data streams...");

    // 1. Fetch Private Context
    const pSnap = await getDocs(collection(db, "users", user.uid, "notes"));
    const pData = pSnap.docs.map(d => d.data().content).join("\n");

    // 2. Fetch Global Context
    const gSnap = await getDocs(collection(db, "global_notes"));
    const gData = gSnap.docs.map(d => d.data().content).join("\n");

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are Zedo AI. Use this context to answer. 
                GLOBAL DATA: ${gData}
                PRIVATE DATA: ${pData}
                USER QUESTION: ${q}` }] }]
            })
        });
        const data = await res.json();
        typing.remove();
        appendMessage('zedo', data.candidates[0].content.parts[0].text);
    } catch (e) {
        typing.remove();
        appendMessage('zedo', "Connection unstable. Try again.");
    }
});

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    return div;
}
