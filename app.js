import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDTRgfKgdma39T7SWkMelAuFWsBv6n_Zr8",
    authDomain: "zedo-6f33b.firebaseapp.com",
    projectId: "zedo-6f33b",
    storageBucket: "zedo-6f33b.firebasestorage.app",
    messagingSenderId: "335247934923",
    appId: "1:335247934923:web:5dbcdce9d4c29307e3e24e"
};

const ZEDO_AI_KEY = "AIzaSyAyx-HliTT8iy0qjQzZ5rlCXU_7R8ZwnAo";

// --- 2. INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI Selectors
const loginOverlay = document.getElementById('loginOverlay');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userSection = document.getElementById('userSection');
const fileInput = document.getElementById('fileInput');
const notesList = document.getElementById('notesList');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatDisplay = document.getElementById('chatDisplay');
const authToggle = document.getElementById('authToggle');
const btnText = document.getElementById('btnText');

// --- 3. AUTHENTICATION & SIGN-UP LOGIC ---
let isSignupMode = true;

authToggle.addEventListener('click', () => {
    isSignupMode = !isSignupMode;
    btnText.innerText = isSignupMode ? "Sign up with Google" : "Log in with Google";
    authToggle.innerHTML = isSignupMode ? "Already a Commander? <span>Log in</span>" : "New to the Core? <span>Sign up</span>";
});

loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => {
        console.error("Auth Error:", err.code);
        alert("Neural connection failed. Check if popups are blocked.");
    });
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginOverlay.style.display = 'none';
        userSection.style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName.split(' ')[0];
        document.getElementById('userPhoto').src = user.photoURL;
        loadNotes(); // Fetch this user's specific data
    } else {
        loginOverlay.style.display = 'flex';
        userSection.style.display = 'none';
        chatDisplay.innerHTML = ""; // Clear view for security
    }
});

// --- 4. DATA LOG MANAGEMENT ---
async function loadNotes() {
    const user = auth.currentUser;
    if (!user || !notesList) return;
    
    notesList.innerHTML = "";
    try {
        // Path: users -> [UID] -> notes
        const q = query(collection(db, "users", user.uid, "notes"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
            const li = document.createElement('li');
            li.innerHTML = `🪐 ${doc.data().name}`;
            li.addEventListener('click', () => alert(`Log Content: ${doc.data().content.substring(0, 200)}...`));
            notesList.appendChild(li);
        });
    } catch (err) {
        console.error("Data retrieval error:", err);
    }
}

fileInput.addEventListener('change', async (e) => {
    const user = auth.currentUser;
    const file = e.target.files[0];
    if (!user || !file) return;

    const text = await file.text();
    try {
        await addDoc(collection(db, "users", user.uid, "notes"), {
            name: file.name,
            content: text,
            timestamp: serverTimestamp()
        });
        loadNotes();
    } catch (err) {
        console.error("Sync Error:", err);
        alert("Upload failed. Ensure Firestore Rules are updated.");
    }
});

// --- 5. NEURAL ANALYSIS (GEMINI INTEGRATION) ---
async function transmitMessage() {
    const user = auth.currentUser;
    const prompt = userInput.value.trim();
    if (!prompt || !user) return;

    const welcome = document.querySelector('.welcome-banner');
    if (welcome) welcome.style.display = 'none';

    appendMessage('user', prompt);
    userInput.value = "";
    
    const typing = appendMessage('zedo', "Analyzing cosmic data streams...");

    try {
        // Step A: Grab only this user's logs for context
        const snap = await getDocs(collection(db, "users", user.uid, "notes"));
        const context = snap.docs.map(doc => `File: ${doc.data().name}\nData: ${doc.data().content}`).join("\n\n");

        // Step B: Send to Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_AI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `You are Zedo, the Cosmic Intelligence Core.
                        Current Commander: ${user.displayName}
                        
                        KNOWLEDGE LOGS:
                        ${context || "No logs uploaded yet."}
                        
                        QUESTION:
                        ${prompt}` 
                    }] 
                }]
            })
        });

        const data = await response.json();
        typing.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            appendMessage('zedo', data.candidates[0].content.parts[0].text);
        } else {
            appendMessage('zedo', "Core link timed out. No data returned.");
        }

    } catch (err) {
        typing.remove();
        appendMessage('zedo', "Transmission error. Check Core network.");
        console.error("API Error:", err);
    }
}

// --- 6. UTILITIES ---
function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    return div;
}

sendBtn.addEventListener('click', transmitMessage);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') transmitMessage(); });
