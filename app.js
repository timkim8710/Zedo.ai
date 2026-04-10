import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. FIREBASE CONFIGURATION ---
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

// --- 2. GEMINI API CONFIGURATION ---
const ZEDO_AI_KEY = "AIzaSyAyx-HliTT8iy0qjQzZ5rlCXU_7R8ZwnAo"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_AI_KEY}`;

// --- 3. UI SELECTORS ---
const fileInput = document.getElementById('fileInput');
const notesList = document.getElementById('notesList');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatDisplay = document.getElementById('chatDisplay');
const clearBtn = document.getElementById('clearBtn');

// --- 4. DATA SYNC: UPLOAD NOTE TO FIREBASE ---
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    try {
        await addDoc(collection(db, "notes"), {
            name: file.name,
            content: text,
            timestamp: serverTimestamp()
        });
        
        console.log("Transmission Successful: Data synced to Core.");
        loadNotes(); // Refresh the sidebar list
    } catch (err) {
        console.error("Transmission Interrupted:", err);
        alert("Check your Firebase Rules! Permission denied.");
    }
});

// --- 5. DATA RETRIEVAL: LOAD ARCHIVED LOGS ---
async function loadNotes() {
    if (!notesList) return;
    notesList.innerHTML = "";
    
    try {
        const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
            const li = document.createElement('li');
            li.innerHTML = `🪐 ${doc.data().name}`;
            li.addEventListener('click', () => {
                alert(`Inspecting Log: ${doc.data().name}\n\nContent preview: ${doc.data().content.substring(0, 100)}...`);
            });
            notesList.appendChild(li);
        });
    } catch (err) {
        console.error("Could not fetch logs:", err);
    }
}
loadNotes(); // Run on startup

// --- 6. INTELLIGENCE CORE: CHAT LOGIC ---
async function transmitMessage() {
    const question = userInput.value.trim();
    if (!question) return;

    // UI Cleanup: Remove welcome screen if present
    const welcome = document.querySelector('.arrival-msg') || document.querySelector('.welcome-msg');
    if (welcome) welcome.style.display = 'none';

    appendMessage('user', question);
    userInput.value = "";
    
    const typing = appendMessage('zedo', "Scanning data streams...");

    try {
        // Step A: Fetch all notes to use as context
        const snapshot = await getDocs(collection(db, "notes"));
        let contextData = snapshot.docs.map(doc => `Log Name: ${doc.data().name}\nContent: ${doc.data().content}`).join("\n\n");

        // Step B: Call Gemini with the knowledge context
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `You are Zedo, a Cosmic Intelligence Core. 
                        Use the following KNOWLEDGE LOGS provided by the Commander to answer their questions accurately. 
                        Persona: Futuristic, synthetic, yet highly efficient.
                        
                        [KNOWLEDGE LOGS]
                        ${contextData || "No logs available. Inform the user to upload data."}
                        
                        [COMMANDER'S TRANSMISSION]
                        ${question}` 
                    }] 
                }]
            })
        });

        const data = await response.json();
        typing.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            appendMessage('zedo', data.candidates[0].content.parts[0].text);
        } else {
            throw new Error("Empty response from Gemini");
        }

    } catch (err) {
        typing.remove();
        appendMessage('zedo', "Communication error. Ensure the Intelligence Key is valid.");
        console.error("Core Transmission Error:", err);
    }
}

// --- 7. UTILITIES ---
function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    
    const label = sender === 'user' ? 'COMMANDER' : 'ZEDO.CORE';
    const color = sender === 'user' ? '#bc00ff' : '#00f2ff';
    
    div.innerHTML = `<small style="color: ${color}; font-weight: 800; letter-spacing: 1px;">${label}</small><br>${text}`;
    
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    return div;
}

// Event Listeners for UI
sendBtn.addEventListener('click', transmitMessage);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') transmitMessage(); });

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        userInput.value = "";
        userInput.focus();
    });
}
