import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Firebase Configuration (Your Zedo Project)
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

// 2. Gemini API Configuration
const ZEDO_AI_KEY = "AIzaSyAyx-HliTT8iy0qjQzZ5rlCXU_7R8ZwnAo"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ZEDO_AI_KEY}`;

// UI Selectors
const fileInput = document.getElementById('fileInput');
const notesList = document.getElementById('notesList');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatDisplay = document.getElementById('chatDisplay');

// --- FEATURE: SYNC DATA STREAM (Upload .txt) ---
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    try {
        await addDoc(collection(db, "notes"), {
            name: file.name,
            content: text,
            timestamp: new Date()
        });
        alert(`Data Stream Synced: ${file.name}`);
        loadNotes();
    } catch (err) {
        console.error("Transmission Interrupted:", err);
    }
});

// --- FEATURE: LOAD ARCHIVED LOGS ---
async function loadNotes() {
    notesList.innerHTML = "";
    const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
        const li = document.createElement('li');
        li.innerHTML = `🪐 ${doc.data().name}`;
        li.title = "View log content";
        notesList.appendChild(li);
    });
}
loadNotes();

// --- FEATURE: COSMIC TRANSMISSION (Chat) ---
async function transmitMessage() {
    const question = userInput.value.trim();
    if (!question) return;

    // Remove welcome screen on first message
    const welcome = document.querySelector('.arrival-msg');
    if (welcome) welcome.remove();

    appendMessage('user', question);
    userInput.value = "";
    
    const typing = appendMessage('zedo', "Establishing neural link...");

    try {
        // Step 1: Gather Knowledge Logs for context
        const snapshot = await getDocs(collection(db, "notes"));
        let context = snapshot.docs.map(doc => `Log [${doc.data().name}]: ${doc.data().content}`).join("\n\n");

        // Step 2: Request Analysis from Gemini
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `You are Zedo, a Cosmic Intelligence Core. 
                        Use the following KNOWLEDGE LOGS to answer the Commander's transmission.
                        Stay in your futuristic persona. If the logs don't contain the answer, say the data stream is limited.
                        
                        [KNOWLEDGE LOGS]
                        ${context}
                        
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
            throw new Error("Empty transmission");
        }

    } catch (err) {
        typing.remove();
        appendMessage('zedo', "Signal lost. Check your API key or network connection.");
        console.error("Core Error:", err);
    }
}

// Event Listeners
sendBtn.addEventListener('click', transmitMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') transmitMessage();
});

// --- HELPER: UI MESSAGE APPEND ---
function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    
    // Formatting the output for a synthetic feel
    const prefix = sender === 'user' ? 'COMMANDER' : 'ZEDO.CORE';
    div.innerHTML = `<small style="color: var(--neon-${sender === 'user' ? 'purple' : 'blue'}); font-weight: 800; letter-spacing: 1px;">${prefix}</small><br>${text}`;
    
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    return div;
}
