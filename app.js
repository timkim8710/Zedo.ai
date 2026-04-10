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

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('userPhoto').src = user.photoURL;
        loadNotes("private");
        loadNotes("global");
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
});

document.getElementById('loginBtn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logoutBtn').onclick = () => signOut(auth);

// Load Data
async function loadNotes(type) {
    const user = auth.currentUser;
    const list = type === "private" ? document.getElementById('notesList') : document.getElementById('globalNotesList');
    const path = type === "private" ? collection(db, "users", user.uid, "notes") : collection(db, "global_notes");
    
    list.innerHTML = "";
    const snap = await getDocs(query(path, orderBy("timestamp", "desc")));
    snap.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = doc.data().name;
        list.appendChild(li);
    });
}

// Chat with Gemini
document.getElementById('sendBtn').onclick = async () => {
    const q = document.getElementById('userInput').value;
    if (!q) return;
    document.getElementById('userInput').value = "";
    
    const display = document.getElementById('chatDisplay');
    display.innerHTML += `<div class="msg user">${q}</div>`;

    const pSnap = await getDocs(collection(db, "users", auth.currentUser.uid, "notes"));
    const gSnap = await getDocs(collection(db, "global_notes"));
    const context = [...pSnap.docs, ...gSnap.docs].map(d => d.data().content).join("\n");

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Context: ${context}\n\nQuestion: ${q}` }] }] })
    });
    const data = await res.json();
    display.innerHTML += `<div class="msg zedo">${data.candidates[0].content.parts[0].text}</div>`;
    display.scrollTop = display.scrollHeight;
};
