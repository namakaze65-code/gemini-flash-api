// ============================================
// HASAN AI - FINAL VERSION
// Personal AI Assistant dengan Gemini 2.5 Flash
// Fitur: Text, Image, Document, Audio, History
// Style: Minimalis Modern (Dark/Light Mode)
// ============================================

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import os from 'os';
import fs from 'fs';
import path from 'path';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractText(resp) {
    try {
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.response.candidates[0].content.parts[0].text;
        }
        if (resp?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.candidates[0].content.parts[0].text;
        }
        return JSON.stringify(resp);
    } catch (err) {
        return "Maaf, terjadi kesalahan.";
    }
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && name.includes('Wi-Fi')) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. Text Chat
app.post('/api/chat/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Image Analysis
app.post('/api/chat/image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Image required' });
        
        const base64Data = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Jelaskan gambar ini secara detail dalam bahasa Indonesia' },
                { inlineData: { data: base64Data, mimeType } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Document Analysis
app.post('/api/chat/document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Document required' });
        
        const base64Data = file.buffer.toString('base64');
        const mimeType = getMimeType(file.originalname);
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || `Ringkas dokumen ini dalam bahasa Indonesia. Judul file: ${file.originalname}` },
                { inlineData: { data: base64Data, mimeType } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Audio Transcription
app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Audio required' });
        
        const base64Data = file.buffer.toString('base64');
        const mimeType = getMimeType(file.originalname);
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || `Transkripsikan audio ini ke teks dalam bahasa Indonesia` },
                { inlineData: { data: base64Data, mimeType } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MAIN PAGE
// ============================================

app.get('/', (req, res) => {
    res.redirect('/chat');
});

// ============================================
// CHAT INTERFACE - FINAL VERSION
// ============================================

app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Hasan AI - Personal Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            /* Light mode (default) */
            --bg-primary: #ffffff;
            --bg-secondary: #f7f7f8;
            --bg-sidebar: #f9f9fb;
            --text-primary: #1f1f1f;
            --text-secondary: #6e6e6e;
            --border-color: #e5e5e5;
            --user-bg: #e9ecef;
            --ai-bg: #ffffff;
            --accent: #10a37f;
            --accent-hover: #0d8a6b;
            --shadow: 0 1px 3px rgba(0,0,0,0.05);
            --code-bg: #f1f3f4;
        }

        body.dark {
            --bg-primary: #1e1e2e;
            --bg-secondary: #181825;
            --bg-sidebar: #11111b;
            --text-primary: #cdd6f4;
            --text-secondary: #a6adc8;
            --border-color: #313244;
            --user-bg: #313244;
            --ai-bg: #1e1e2e;
            --accent: #89b4fa;
            --accent-hover: #6c98e0;
            --shadow: 0 1px 3px rgba(0,0,0,0.3);
            --code-bg: #313244;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-secondary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            transition: background 0.3s, color 0.3s;
        }

        /* SIDEBAR */
        .sidebar {
            width: 260px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            padding: 20px;
            transition: all 0.3s;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #10a37f, #1a7f64);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
        }

        .logo-text h1 {
            font-size: 18px;
            font-weight: 600;
        }

        .logo-text p {
            font-size: 11px;
            color: var(--text-secondary);
        }

        .new-chat-btn {
            background: var(--accent);
            border: none;
            padding: 12px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 20px;
            transition: all 0.2s;
        }

        .new-chat-btn:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
        }

        .history-section {
            flex: 1;
            overflow-y: auto;
        }

        .history-title {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            font-weight: 500;
        }

        .history-list {
            list-style: none;
        }

        .history-item {
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 13px;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.2s;
        }

        .history-item:hover {
            background: var(--bg-secondary);
        }

        .history-item.active {
            background: var(--accent);
            color: white;
        }

        .sidebar-footer {
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            margin-top: auto;
        }

        .theme-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: var(--bg-secondary);
            border-radius: 12px;
            cursor: pointer;
            margin-bottom: 12px;
        }

        .clear-history {
            background: transparent;
            border: 1px solid var(--border-color);
            padding: 10px;
            border-radius: 12px;
            width: 100%;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 12px;
            transition: all 0.2s;
        }

        .clear-history:hover {
            background: #e74c3c20;
            border-color: #e74c3c;
            color: #e74c3c;
        }

        .export-btn {
            background: transparent;
            border: 1px solid var(--border-color);
            padding: 10px;
            border-radius: 12px;
            width: 100%;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 12px;
            margin-top: 8px;
        }

        .export-btn:hover {
            background: var(--accent);
            border-color: var(--accent);
            color: white;
        }

        /* MAIN CHAT AREA */
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header h2 {
            font-size: 16px;
            font-weight: 500;
        }

        .model-badge {
            background: var(--bg-secondary);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            color: var(--accent);
        }

        /* MESSAGES */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        .message {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .user-message .message-avatar {
            background: var(--accent);
        }

        .ai-message .message-avatar {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
        }

        .message-content {
            flex: 1;
            line-height: 1.6;
            font-size: 15px;
        }

        .user-message .message-content {
            background: var(--user-bg);
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 85%;
        }

        .ai-message .message-content {
            padding: 0 4px;
        }

        .ai-message .message-content pre {
            background: var(--code-bg);
            padding: 12px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 10px 0;
            font-size: 13px;
        }

        .message-time {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 6px;
        }

        .copy-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 12px;
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 6px;
        }

        .copy-btn:hover {
            background: var(--bg-secondary);
        }

        /* INPUT AREA */
        .input-area {
            padding: 20px 24px;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-color);
        }

        .input-wrapper {
            max-width: 900px;
            margin: 0 auto;
            position: relative;
        }

        .input-container {
            display: flex;
            gap: 12px;
            align-items: flex-end;
            background: var(--bg-secondary);
            border-radius: 24px;
            padding: 8px 16px;
            border: 1px solid var(--border-color);
            transition: all 0.2s;
        }

        .input-container:focus-within {
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.1);
        }

        .input-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
            color: var(--text-secondary);
        }

        .action-btn:hover {
            background: var(--bg-primary);
            color: var(--accent);
        }

        #messageInput {
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 0;
            font-size: 15px;
            color: var(--text-primary);
            outline: none;
            resize: none;
            font-family: inherit;
        }

        #messageInput::placeholder {
            color: var(--text-secondary);
        }

        #sendBtn {
            background: var(--accent);
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #sendBtn:hover {
            transform: scale(1.05);
        }

        .file-preview-area {
            max-width: 900px;
            margin: 0 auto 12px;
            display: none;
        }

        .file-preview-area.active {
            display: block;
        }

        .file-preview-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 10px 16px;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            border: 1px solid var(--border-color);
        }

        .file-preview-card img {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            object-fit: cover;
        }

        .file-preview-card .remove-file {
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 18px;
        }

        .typing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: var(--bg-secondary);
            border-radius: 20px;
            width: fit-content;
            margin-bottom: 16px;
        }

        .typing-indicator.active {
            display: flex;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-10px); opacity: 1; }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }
            .sidebar.mobile-open {
                display: flex;
                position: fixed;
                width: 80%;
                height: 100%;
                z-index: 1000;
            }
        }
    </style>
</head>
<body>
    <div class="sidebar" id="sidebar">
        <div class="logo">
            <div class="logo-icon">🧠</div>
            <div class="logo-text">
                <h1>Hasan AI</h1>
                <p>Gemini 2.5 Flash</p>
            </div>
        </div>
        
        <button class="new-chat-btn" onclick="newChat()">
            + New Chat
        </button>
        
        <div class="history-section">
            <div class="history-title">Recent Chats</div>
            <ul class="history-list" id="historyList"></ul>
        </div>
        
        <div class="sidebar-footer">
            <div class="theme-toggle" onclick="toggleTheme()">
                <span>🌙 Dark Mode</span>
                <span id="themeIcon">🌞</span>
            </div>
            <button class="clear-history" onclick="clearAllHistory()">🗑️ Clear All History</button>
            <button class="export-btn" onclick="exportChat()">📎 Export Chat</button>
        </div>
    </div>
    
    <div class="main">
        <div class="chat-header">
            <h2>💬 Hasan AI Assistant</h2>
            <div class="model-badge">Gemini 2.5 Flash • Multimodal</div>
        </div>
        
        <div class="messages-container" id="messagesContainer">
            <div class="message ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    Halo! Saya <strong>Hasan AI</strong>, asisten pribadi Anda.<br>
                    Saya bisa:<br>
                    • 💬 Chat teks<br>
                    • 🖼️ Analisis gambar<br>
                    • 📄 Baca dokumen (PDF, TXT, DOCX)<br>
                    • 🎵 Transkrip audio (MP3, WAV)<br>
                    • 📜 Menyimpan history chat<br><br>
                    Ada yang bisa saya bantu?
                    <div class="message-time" id="welcomeTime"></div>
                </div>
            </div>
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span style="font-size: 13px;">Hasan AI sedang mengetik...</span>
        </div>
        
        <div class="input-area">
            <div class="file-preview-area" id="filePreviewArea">
                <div class="file-preview-card" id="filePreviewCard">
                    <img id="previewImage" src="">
                    <span id="previewFileName"></span>
                    <button class="remove-file" onclick="clearFile()">✕</button>
                </div>
            </div>
            
            <div class="input-wrapper">
                <div class="input-container">
                    <div class="input-actions">
                        <button class="action-btn" onclick="triggerFileUpload('image')" title="Upload Gambar">🖼️</button>
                        <button class="action-btn" onclick="triggerFileUpload('document')" title="Upload Dokumen">📄</button>
                        <button class="action-btn" onclick="triggerFileUpload('audio')" title="Upload Audio">🎵</button>
                    </div>
                    <textarea 
                        id="messageInput" 
                        placeholder="Ketik pesan... atau upload file"
                        rows="1"
                        onkeydown="handleEnter(event)"
                    ></textarea>
                    <button id="sendBtn" onclick="sendMessage()">➤</button>
                </div>
            </div>
        </div>
    </div>
    
    <input type="file" id="imageInput" accept="image/*" style="display: none" onchange="handleFileSelect('image', this)">
    <input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display: none" onchange="handleFileSelect('document', this)">
    <input type="file" id="audioInput" accept="audio/*" style="display: none" onchange="handleFileSelect('audio', this)">
    
    <script>
        // ============================================
        // CONFIGURATION
        // ============================================
        
        const HISTORY_KEY = 'hasan_ai_chats';
        let currentFile = null;
        let currentFileType = null;
        let currentFileName = null;
        let currentChatId = Date.now().toString();
        let chats = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{"chats": [], "currentId": null}');
        
        // Initialize
        function init() {
            loadChats();
            document.getElementById('welcomeTime').textContent = getTime();
            // Auto-resize textarea
            document.getElementById('messageInput').addEventListener('input', autoResize);
        }
        
        function autoResize() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        }
        
        function getTime() {
            return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        
        function getFullTime() {
            return new Date().toLocaleString('id-ID');
        }
        
        // ============================================
        // CHAT MANAGEMENT
        // ============================================
        
        function loadChats() {
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = '';
            
            const chatList = chats.chats || [];
            chatList.forEach(chat => {
                const li = document.createElement('li');
                li.className = 'history-item';
                if (chat.id === currentChatId) li.classList.add('active');
                li.textContent = chat.title || 'New Chat';
                li.onclick = () => switchChat(chat.id);
                historyList.appendChild(li);
            });
            
            if (chatList.length === 0) {
                newChat();
            } else {
                const current = chatList.find(c => c.id === currentChatId);
                if (current) {
                    renderMessages(current.messages || []);
                } else {
                    switchChat(chatList[0].id);
                }
            }
        }
        
        function saveChats() {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(chats));
            loadChats();
        }
        
        function newChat() {
            currentChatId = Date.now().toString();
            if (!chats.chats) chats.chats = [];
            chats.chats.unshift({
                id: currentChatId,
                title: 'Chat Baru',
                timestamp: getFullTime(),
                messages: []
            });
            chats.currentId = currentChatId;
            saveChats();
            renderMessages([]);
            clearFile();
        }
        
        function switchChat(chatId) {
            currentChatId = chatId;
            const chat = chats.chats.find(c => c.id === chatId);
            if (chat) {
                renderMessages(chat.messages || []);
            }
            saveChats();
        }
        
        function addMessage(text, sender) {
            const message = {
                id: Date.now(),
                text: text,
                sender: sender,
                timestamp: getTime(),
                fullTime: getFullTime()
            };
            
            let chat = chats.chats.find(c => c.id === currentChatId);
            if (!chat) {
                newChat();
                chat = chats.chats.find(c => c.id === currentChatId);
            }
            
            if (!chat.messages) chat.messages = [];
            chat.messages.push(message);
            
            // Update title if first user message
            if (sender === 'user' && chat.messages.filter(m => m.sender === 'user').length === 1) {
                chat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            }
            
            saveChats();
            renderMessages(chat.messages);
        }
        
        function renderMessages(messages) {
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';
            
            if (messages.length === 0) {
                container.innerHTML = \`
                    <div class="message ai-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            Halo! Saya <strong>Hasan AI</strong>, asisten pribadi Anda.<br>
                            Saya bisa:<br>
                            • 💬 Chat teks<br>
                            • 🖼️ Analisis gambar<br>
                            • 📄 Baca dokumen (PDF, TXT, DOCX)<br>
                            • 🎵 Transkrip audio (MP3, WAV)<br>
                            • 📜 Menyimpan history chat<br><br>
                            Ada yang bisa saya bantu?
                            <div class="message-time">\${getTime()}</div>
                        </div>
                    </div>
                \`;
                return;
            }
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = \`message \${msg.sender === 'user' ? 'user-message' : 'ai-message'}\`;
                div.innerHTML = \`
                    <div class="message-avatar">\${msg.sender === 'user' ? '👤' : '🤖'}</div>
                    <div class="message-content">
                        \${formatMessage(msg.text)}
                        <div class="message-time">\${msg.timestamp}</div>
                        <button class="copy-btn" onclick="copyText('\${escapeHtml(msg.text)}')">📋 Copy</button>
                    </div>
                \`;
                container.appendChild(div);
            });
            
            container.scrollTop = container.scrollHeight;
        }
        
        function formatMessage(text) {
            return text.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
        }
        
        function escapeHtml(text) {
            return text.replace(/['"]/g, '&quot;').replace(/\\n/g, ' ');
        }
        
        function copyText(text) {
            navigator.clipboard.writeText(text);
            alert('Pesan disalin!');
        }
        
        // ============================================
        // FILE UPLOAD
        // ============================================
        
        function triggerFileUpload(type) {
            if (type === 'image') document.getElementById('imageInput').click();
            else if (type === 'document') document.getElementById('documentInput').click();
            else if (type === 'audio') document.getElementById('audioInput').click();
        }
        
        function handleFileSelect(type, input) {
            const file = input.files[0];
            if (!file) return;
            
            currentFile = file;
            currentFileType = type;
            currentFileName = file.name;
            
            const previewArea = document.getElementById('filePreviewArea');
            const previewImage = document.getElementById('previewImage');
            const previewFileName = document.getElementById('previewFileName');
            
            if (type === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                previewImage.src = type === 'document' ? '📄' : '🎵';
            }
            
            previewFileName.textContent = file.name;
            previewArea.classList.add('active');
        }
        
        function clearFile() {
            currentFile = null;
            currentFileType = null;
            currentFileName = null;
            document.getElementById('filePreviewArea').classList.remove('active');
            document.getElementById('imageInput').value = '';
            document.getElementById('documentInput').value = '';
            document.getElementById('audioInput').value = '';
        }
        
        // ============================================
        // SEND MESSAGE
        // ============================================
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message && !currentFile) return;
            
            // Add user message
            let userDisplay = message || '📎 ' + currentFileName;
            addMessage(userDisplay, 'user');
            
            input.value = '';
            input.style.height = 'auto';
            
            // Show typing indicator
            document.getElementById('typingIndicator').classList.add('active');
            
            try {
                let response;
                let formData = new FormData();
                
                if (currentFile) {
                    formData.append(currentFileType, currentFile);
                    if (message) formData.append('prompt', message);
                    
                    if (currentFileType === 'image') {
                        response = await fetch('/api/chat/image', { method: 'POST', body: formData });
                    } else if (currentFileType === 'document') {
                        response = await fetch('/api/chat/document', { method: 'POST', body: formData });
                    } else {
                        response = await fetch('/api/chat/audio', { method: 'POST', body: formData });
                    }
                    clearFile();
                } else {
                    response = await fetch('/api/chat/text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: message })
                    });
                }
                
                const data = await response.json();
                const aiResponse = data.output || 'Maaf, terjadi kesalahan.';
                addMessage(aiResponse, 'ai');
                
            } catch (error) {
                addMessage('❌ Error: ' + error.message, 'ai');
            } finally {
                document.getElementById('typingIndicator').classList.remove('active');
            }
        }
        
        function handleEnter(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }
        
        // ============================================
        // UTILITIES
        // ============================================
        
        function clearAllHistory() {
            if (confirm('Hapus semua riwayat chat? Tindakan ini tidak bisa dibatalkan.')) {
                localStorage.removeItem(HISTORY_KEY);
                chats = { chats: [], currentId: null };
                newChat();
                loadChats();
            }
        }
        
        function exportChat() {
            const chat = chats.chats.find(c => c.id === currentChatId);
            if (!chat || !chat.messages || chat.messages.length === 0) {
                alert('Tidak ada chat untuk diekspor');
                return;
            }
            
            let content = \`HASAN AI CHAT EXPORT\\n\\nTanggal: \${getFullTime()}\\n\\n\`;
            chat.messages.forEach(msg => {
                content += \`[\${msg.timestamp}] \${msg.sender === 'user' ? '👤 User' : '🤖 Hasan AI'}:\\n\${msg.text}\\n\\n---\\n\\n\`;
            });
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`hasan_ai_chat_\${new Date().toISOString().slice(0,19)}.txt\`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function toggleTheme() {
            document.body.classList.toggle('dark');
            const icon = document.getElementById('themeIcon');
            icon.textContent = document.body.classList.contains('dark') ? '🌙' : '🌞';
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
        }
        
        init();
    </script>
</body>
</html>
    `);
});

// ============================================
// START SERVER (Untuk Local & Vercel)
// ============================================

const PORT = process.env.PORT || 3000;

// Untuk Vercel: export app (tanpa app.listen)
// Untuk Local: app.listen

if (process.env.VERCEL) {
    // Running di Vercel (serverless)
    export default app;
} else {
    // Running di local
    const IP = getLocalIP();
    app.listen(PORT, '0.0.0.0', () => {
        console.log('╔═══════════════════════════════════════╗');
        console.log('║        🧠 HASAN AI - FINAL            ║');
        console.log('║     Personal AI Assistant v1.0        ║');
        console.log('╠═══════════════════════════════════════╣');
        console.log(`║   Local:   http://localhost:${PORT}      ║`);
        console.log(`║   Network: http://${IP}:${PORT}         ║`);
        console.log(`║   HP:      http://${IP}:${PORT}/chat     ║`);
        console.log('╚═══════════════════════════════════════╝');
    });
}