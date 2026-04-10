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

const loginOverlay = document.getElementById('loginOverlay');
const userSection = document.getElementById('userSection');
const chatDisplay = document.getElementById('chatDisplay');

// Auth Handlers
document.getElementById('loginBtn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginOverlay.style.display = 'none';
        userSection.style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('userPhoto').src = user.photoURL;
        loadNotes();
    } else {
        loginOverlay.style.display = 'flex';
        userSection.style.display = 'none';
    }
});

// Load Knowledge Base
async function loadNotes() {
    const list = document.getElementById('notesList');
    list.innerHTML = "";
    const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    snap.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = `🪐 ${doc.data().name}`;
        list.appendChild(li);
    });
}

// Upload Note
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    await addDoc(collection(db, "notes"), { name: file.name, content: text, timestamp: serverTimestamp() });
    loadNotes();
});

// Chat Analysis
document.getElementById('sendBtn').addEventListener('click', async () => {
    const q = document.getElementById('userInput').value;
    if (!q) return;
    document.getElementById('userInput').value = "";
    
    appendMessage('user', q);
    const typing = appendMessage('zedo', "Establishing neural link...");

    const snap = await getDocs(collection(db, "notes"));
    const context = snap.docs.map(d => d.data().content).join("\n\n");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Context: ${context}\n\nUser: ${q}` }] }] })
    });

    const data = await res.json();
    typing.remove();
    appendMessage('zedo', data.candidates[0].content.parts[0].text);
});

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    return div;
}
