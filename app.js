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

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ZEDO_KEY = "AIzaSyAyx-HliTT8iy0qjQzZ5rlCXU_7R8ZwnAo";

// Selectors
const loginOverlay = document.getElementById('loginOverlay');
const userSection = document.getElementById('userSection');
const chatDisplay = document.getElementById('chatDisplay');
const btnText = document.getElementById('btnText');
const authToggle = document.getElementById('authToggle');

// Auth Switcher UI
let isSignup = true;
authToggle.addEventListener('click', () => {
    isSignup = !isSignup;
    btnText.innerText = isSignup ? "Sign up with Google" : "Log in with Google";
    authToggle.innerHTML = isSignup ? "Already a Commander? <span>Log in</span>" : "New to the Core? <span>Sign up</span>";
});

// Auth Listeners
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

// Load Private Logs
async function loadNotes() {
    const user = auth.currentUser;
    if (!user) return;
    const list = document.getElementById('notesList');
    list.innerHTML = "";
    
    try {
        const q = query(collection(db, "users", user.uid, "notes"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        snap.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = `🪐 ${doc.data().name}`;
            list.appendChild(li);
        });
    } catch (e) { console.error("Load failed", e); }
}

// Private Upload
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const user = auth.currentUser;
    const file = e.target.files[0];
    if (!user || !file) return;

    const text = await file.text();
    await addDoc(collection(db, "users", user.uid, "notes"), {
        name: file.name,
        content: text,
        timestamp: serverTimestamp()
    });
    loadNotes();
});

// Chat Analysis
document.getElementById('sendBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    const q = document.getElementById('userInput').value;
    if (!q || !user) return;
    
    document.getElementById('userInput').value = "";
    const welcome = document.querySelector('.welcome-banner');
    if (welcome) welcome.style.display = 'none';

    appendMessage('user', q);
    const typing = appendMessage('zedo', "Processing neural stream...");

    // Get only this user's logs
    const snap = await getDocs(collection(db, "users", user.uid, "notes"));
    const context = snap.docs.map(d => d.data().content).join("\n\n");

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: `You are Zedo. Use these logs to answer: ${context}\n\nUser: ${q}` }] }] 
            })
        });

        const data = await res.json();
        typing.remove();
        appendMessage('zedo', data.candidates[0].content.parts[0].text);
    } catch (e) {
        typing.remove();
        appendMessage('zedo', "Transmission failed. Core link unstable.");
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
