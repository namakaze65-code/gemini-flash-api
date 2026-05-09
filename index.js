import express from 'express';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

function extractText(resp) {
    try {
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.response.candidates[0].content.parts[0].text;
        }
        if (resp?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.candidates[0].content.parts[0].text;
        }
        return "Maaf, terjadi kesalahan.";
    } catch (err) {
        return "Terjadi kesalahan.";
    }
}

// API Endpoint dengan 3 Mode
app.post('/api/chat/text', async (req, res) => {
    try {
        const { prompt, mode = 'chat' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt required' });
        }
        
        const systemInstructions = {
            chat: 'Kamu adalah AIBH, asisten AI yang ramah, hangat, dan membantu. Jawab pertanyaan dengan bahasa yang santai dan mudah dipahami.',
            deep: 'Kamu adalah AIBH dalam mode PIKIR MENDALAM. Analisis pertanyaan dengan sangat mendalam, jabarkan langkah demi langkah, berikan reasoning yang jelas.',
            search: 'Kamu adalah AIBH dalam mode PENCARIAN CERDAS. Prioritaskan akurasi informasi, berikan fakta yang terverifikasi, jawab singkat padat.'
        };
        
        const instruction = systemInstructions[mode] || systemInstructions.chat;
        
        let temperature = 0.7;
        if (mode === 'deep') temperature = 0.4;
        if (mode === 'search') temperature = 0.2;
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                temperature: temperature,
                maxOutputTokens: 2048,
                systemInstruction: instruction
            }
        });
        
        const output = extractText(response);
        res.json({ output });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload endpoints
app.post('/api/chat/image', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'File gambar diperlukan' });
        const base64Data = file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: 'Analisis gambar ini secara detail dalam bahasa Indonesia.' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat/document', upload.single('document'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'File dokumen diperlukan' });
        const base64Data = file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: 'Baca dan ringkas dokumen ini dalam bahasa Indonesia.' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'File audio diperlukan' });
        const base64Data = file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: 'Transkripsikan audio ini ke teks dalam bahasa Indonesia.' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        res.json({ output: extractText(response) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Frontend - Final Version
app.get('/chat', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>AIBH - Artificial Intelligence Brain of Hasan</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            color: #f3f4f6;
            overflow: hidden;
        }

        .app {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 100%;
            position: relative;
        }

        /* ========== HEADER ========== */
        .header {
            background: #0a0a0a;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 50;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .menu-btn {
            background: transparent;
            border: none;
            color: #9ca3af;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .menu-btn:hover {
            background: rgba(255,255,255,0.05);
            color: #3b82f6;
        }

        /* Logo AIBH - Modern Bridge (A dan H terhubung) */
        .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-svg {
            width: 36px;
            height: 36px;
        }

        .logo-text {
            font-size: 16px;
            font-weight: 600;
            color: #f3f4f6;
        }

        .logo-text span {
            background: linear-gradient(135deg, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-right .status {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(16,185,129,0.12);
            padding: 5px 12px;
            border-radius: 30px;
            font-size: 12px;
            color: #10b981;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%,100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* ========== MAIN CHAT ========== */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            align-items: center;
        }

        .chat-container {
            max-width: 800px;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 0 20px;
        }

        /* Messages Area */
        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .messages-area::-webkit-scrollbar {
            width: 5px;
        }

        .messages-area::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.03);
            border-radius: 10px;
        }

        .messages-area::-webkit-scrollbar-thumb {
            background: #3b82f6;
            border-radius: 10px;
        }

        /* Message Bubbles */
        .message {
            display: flex;
            gap: 12px;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message-bot {
            justify-content: flex-start;
        }

        .bot-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            flex-shrink: 0;
        }

        .bot-bubble {
            background: #1f2937;
            padding: 12px 16px;
            border-radius: 16px 16px 16px 4px;
            line-height: 1.6;
            font-size: 14px;
            max-width: 85%;
        }

        .message-user {
            justify-content: flex-end;
        }

        .user-bubble {
            background: #2563eb;
            padding: 12px 16px;
            border-radius: 16px 16px 4px 16px;
            line-height: 1.6;
            font-size: 14px;
            max-width: 85%;
        }

        /* Preview gambar di dalam chat (sebelum enter) */
        .pending-file-preview {
            background: #1f2937;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            width: fit-content;
            margin-bottom: 12px;
        }

        .pending-file-preview img {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            object-fit: cover;
        }

        .pending-file-preview .file-info {
            font-size: 13px;
        }

        .pending-file-preview .remove-pending {
            background: rgba(239,68,68,0.2);
            border: none;
            padding: 6px 12px;
            border-radius: 20px;
            color: #fca5a5;
            cursor: pointer;
            font-size: 11px;
        }

        .pending-file-preview .remove-pending:hover {
            background: rgba(239,68,68,0.4);
        }

        .user-image-in-chat {
            max-width: 200px;
            max-height: 200px;
            border-radius: 12px;
            margin-bottom: 8px;
            display: block;
        }

        .message-time {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 6px;
        }

        .user-bubble .message-time {
            color: rgba(255,255,255,0.6);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
        }

        .empty-state h3 {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .empty-state p {
            color: #9ca3af;
            font-size: 13px;
            margin-top: 8px;
        }

        /* Mode Selector */
        .mode-selector {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 16px 0;
            flex-wrap: wrap;
        }

        .mode-btn {
            padding: 8px 20px;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 40px;
            color: #9ca3af;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .mode-btn.active {
            background: rgba(59,130,246,0.15);
            border-color: #3b82f6;
            color: #60a5fa;
            box-shadow: 0 0 12px rgba(59,130,246,0.3);
        }

        .mode-btn:hover:not(.active) {
            background: rgba(255,255,255,0.05);
            border-color: rgba(59,130,246,0.5);
        }

        /* Input Area */
        .input-area {
            padding: 16px 0 24px 0;
        }

        .input-wrapper {
            background: #1f2937;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 60px;
            padding: 8px 12px 8px 18px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .input-wrapper:focus-within {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }

        .input-actions {
            display: flex;
            gap: 6px;
        }

        .action-btn {
            background: transparent;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            color: #9ca3af;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .action-btn:hover {
            background: rgba(59,130,246,0.2);
            color: #60a5fa;
        }

        #messageInput {
            flex: 1;
            background: transparent;
            border: none;
            padding: 10px 0;
            color: #f3f4f6;
            font-size: 14px;
            outline: none;
            resize: none;
            font-family: 'Inter', sans-serif;
            max-height: 100px;
        }

        #messageInput::placeholder {
            color: #6b7280;
        }

        #sendBtn {
            width: 40px;
            height: 40px;
            background: #2563eb;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            color: white;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #sendBtn:hover {
            transform: scale(1.05);
            background: #3b82f6;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            background: #1f2937;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 30px;
            width: fit-content;
            margin: 8px 0;
        }

        .typing-indicator.active {
            display: flex;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dots span {
            width: 7px;
            height: 7px;
            background: #60a5fa;
            border-radius: 50%;
            animation: bounce 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
            0%,60%,100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-8px); opacity: 1; }
        }

        /* Drawer Sidebar */
        .drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 200;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }

        .drawer-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .drawer {
            position: fixed;
            top: 0;
            left: 0;
            width: 300px;
            height: 100%;
            background: #111827;
            z-index: 201;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        }

        .drawer.active {
            transform: translateX(0);
        }

        .drawer-header {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .drawer-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .drawer-logo .logo-svg {
            width: 40px;
            height: 40px;
        }

        .drawer-logo span {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .drawer-new-chat {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .drawer-history {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .history-title {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }

        .history-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 4px;
            transition: all 0.2s;
        }

        .history-item:hover {
            background: rgba(59,130,246,0.1);
        }

        .history-item.active {
            background: rgba(59,130,246,0.15);
        }

        .history-content {
            flex: 1;
            overflow: hidden;
        }

        .history-title-text {
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .history-date {
            font-size: 10px;
            color: #6b7280;
            margin-top: 2px;
        }

        .delete-history {
            background: transparent;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            opacity: 0;
        }

        .history-item:hover .delete-history {
            opacity: 1;
        }

        .delete-history:hover {
            background: rgba(239,68,68,0.2);
            color: #ef4444;
        }

        .drawer-clear {
            margin: 16px;
            padding: 10px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 10px;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .chat-container { padding: 0 12px; }
            .mode-btn { padding: 6px 14px; font-size: 11px; }
            .drawer { width: 85vw; }
            .header { padding: 10px 16px; }
        }
    </style>
</head>
<body>
<div class="app">
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <button class="menu-btn" onclick="openDrawer()">
                <i class="fas fa-bars"></i>
            </button>
            <div class="logo-container">
                <!-- Logo Modern Bridge - A dan H terhubung -->
                <svg class="logo-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#6366f1"/>
                            <stop offset="50%" style="stop-color:#8b5cf6"/>
                            <stop offset="100%" style="stop-color:#3b82f6"/>
                        </linearGradient>
                    </defs>
                    <!-- Huruf A -->
                    <path d="M20 65 L40 20 L60 65" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M32 50 L48 50" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <!-- Huruf H terhubung seperti jembatan -->
                    <path d="M65 65 L65 20" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M65 42 L75 42" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M75 65 L75 20" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M60 65 L55 65" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
                </svg>
                <div class="logo-text"><span>AIBH</span> Assistant</div>
            </div>
        </div>
        <div class="header-right">
            <div class="status">
                <span class="status-dot"></span>
                Online
            </div>
        </div>
    </div>

    <!-- Drawer -->
    <div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer()"></div>
    <div class="drawer" id="drawer">
        <div class="drawer-header">
            <div class="drawer-logo">
                <svg class="logo-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 65 L40 20 L60 65" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M32 50 L48 50" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M65 65 L65 20" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M65 42 L75 42" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M75 65 L75 20" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                </svg>
                <span>AIBH</span>
            </div>
            <button class="drawer-new-chat" onclick="newChat(); closeDrawer();">
                <i class="fas fa-plus-circle"></i> New Chat
            </button>
        </div>
        <div class="drawer-history">
            <div class="history-title">RECENT CHATS</div>
            <div class="history-list" id="historyList"></div>
        </div>
        <button class="drawer-clear" onclick="clearAllHistory(); closeDrawer();">
            <i class="fas fa-trash-alt"></i> Clear History
        </button>
    </div>

    <!-- Main Chat -->
    <div class="chat-main">
        <div class="chat-container">
            <div class="messages-area" id="messagesArea">
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>AIBH - Artificial Intelligence Brain of Hasan</h3>
                    <p>Asisten AI dengan 3 mode: Percakapan | Pikir Mendalam | Pencarian Cerdas</p>
                </div>
            </div>

            <!-- Area untuk preview file sebelum dikirim (di dalam chat) -->
            <div id="pendingFilePreview" style="display: none;"></div>

            <div class="typing-indicator" id="typingIndicator">
                <div class="typing-dots"><span></span><span></span><span></span></div>
                <span>AIBH sedang mengetik...</span>
            </div>

            <!-- Mode Selector -->
            <div class="mode-selector">
                <button class="mode-btn active" data-mode="chat" onclick="setMode('chat')">
                    <i class="fas fa-comment-dots"></i> Percakapan
                </button>
                <button class="mode-btn" data-mode="deep" onclick="setMode('deep')">
                    <i class="fas fa-brain"></i> Pikir Mendalam
                </button>
                <button class="mode-btn" data-mode="search" onclick="setMode('search')">
                    <i class="fas fa-search"></i> Pencarian Cerdas
                </button>
            </div>

            <!-- Input Area -->
            <div class="input-area">
                <div class="input-wrapper">
                    <div class="input-actions">
                        <button class="action-btn" onclick="triggerFileUpload('image')" title="Upload Gambar">
                            <i class="fas fa-image"></i>
                        </button>
                        <button class="action-btn" onclick="triggerFileUpload('document')" title="Upload Dokumen">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="action-btn" onclick="triggerFileUpload('audio')" title="Upload Audio">
                            <i class="fas fa-microphone"></i>
                        </button>
                    </div>
                    <textarea 
                        id="messageInput" 
                        placeholder="Tanyakan apa saja... (Coding, Matematika, Pengetahuan Umum)"
                        rows="1"
                        onkeydown="handleEnter(event)"
                    ></textarea>
                    <button id="sendBtn" onclick="sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleFileSelect('image', this)">
<input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display:none" onchange="handleFileSelect('document', this)">
<input type="file" id="audioInput" accept="audio/*" style="display:none" onchange="handleFileSelect('audio', this)">

<script>
    // ========== STATE ==========
    let currentChatId = null;
    let chats = [];
    let currentMessages = [];
    let pendingFile = null;
    let pendingFileType = null;
    let pendingFilePreview = null;
    let currentMode = 'chat';

    // ========== LOAD & SAVE ==========
    function loadData() {
        const saved = localStorage.getItem('aibh_chats_final_v4');
        if (saved) {
            chats = JSON.parse(saved);
            const lastId = localStorage.getItem('aibh_current_id_final_v4');
            if (lastId && chats.find(c => c.id === lastId)) {
                loadChat(lastId);
            } else if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                newChat();
            }
            renderHistory();
        } else {
            newChat();
        }
    }

    function saveData() {
        localStorage.setItem('aibh_chats_final_v4', JSON.stringify(chats));
        if (currentChatId) {
            localStorage.setItem('aibh_current_id_final_v4', currentChatId);
        }
        renderHistory();
    }

    // ========== DRAWER ==========
    function openDrawer() {
        document.getElementById('drawer').classList.add('active');
        document.getElementById('drawerOverlay').classList.add('active');
    }

    function closeDrawer() {
        document.getElementById('drawer').classList.remove('active');
        document.getElementById('drawerOverlay').classList.remove('active');
    }

    // ========== HISTORY ==========
    function renderHistory() {
        const container = document.getElementById('historyList');
        if (chats.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#6b7280;">Belum ada chat</div>';
            return;
        }
        
        container.innerHTML = '';
        chats.forEach(chat => {
            const div = document.createElement('div');
            div.className = 'history-item';
            if (chat.id === currentChatId) div.classList.add('active');
            
            const firstMsg = chat.messages.find(m => m.sender === 'user');
            const title = firstMsg ? (firstMsg.text.substring(0, 30) + (firstMsg.text.length > 30 ? '...' : '')) : 'New Chat';
            
            div.innerHTML = \`
                <div class="history-content" onclick="loadChat('\${chat.id}'); closeDrawer();">
                    <div class="history-title-text">\${escapeHtml(title)}</div>
                    <div class="history-date">\${chat.date}</div>
                </div>
                <button class="delete-history" onclick="deleteChat('\${chat.id}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            \`;
            container.appendChild(div);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function newChat() {
        const newId = Date.now().toString();
        chats.unshift({
            id: newId,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            messages: []
        });
        currentChatId = newId;
        currentMessages = [];
        saveData();
        renderMessages();
        clearPendingFile();
    }

    function loadChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        currentMessages = [...chat.messages];
        renderMessages();
        saveData();
        clearPendingFile();
    }

    function deleteChat(chatId, event) {
        event.stopPropagation();
        if (confirm('Hapus chat ini?')) {
            const index = chats.findIndex(c => c.id === chatId);
            if (index !== -1) {
                chats.splice(index, 1);
                if (chats.length > 0) {
                    loadChat(chats[0].id);
                } else {
                    newChat();
                }
                saveData();
            }
        }
    }

    function clearAllHistory() {
        if (confirm('Hapus SEMUA riwayat chat?')) {
            chats = [];
            newChat();
            saveData();
        }
    }

    // ========== RENDER MESSAGES ==========
    function renderMessages() {
        const container = document.getElementById('messagesArea');
        
        if (currentMessages.length === 0) {
            container.innerHTML = \`
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>AIBH - Artificial Intelligence Brain of Hasan</h3>
                    <p>Asisten AI dengan 3 mode: Percakapan | Pikir Mendalam | Pencarian Cerdas</p>
                </div>
            \`;
            return;
        }
        
        container.innerHTML = '';
        currentMessages.forEach(msg => {
            if (msg.sender === 'user') {
                const div = document.createElement('div');
                div.className = 'message message-user';
                let imageHtml = '';
                if (msg.imageData) {
                    imageHtml = \`<img src="\${msg.imageData}" class="user-image-in-chat" alt="user image">\`;
                }
                div.innerHTML = \`
                    <div class="user-bubble">
                        \${imageHtml}
                        \${msg.text ? msg.text.replace(/\\n/g, '<br>') : ''}
                        <div class="message-time">\${msg.time}</div>
                    </div>
                \`;
                container.appendChild(div);
            } else {
                const div = document.createElement('div');
                div.className = 'message message-bot';
                div.innerHTML = \`
                    <div class="bot-avatar"><i class="fas fa-brain"></i></div>
                    <div class="bot-bubble">
                        \${msg.text.replace(/\\n/g, '<br>')}
                        <div class="message-time">\${msg.time}</div>
                    </div>
                \`;
                container.appendChild(div);
            }
        });
        container.scrollTop = container.scrollHeight;
    }

    function addMessage(text, sender, imageData = null) {
        const msg = {
            id: Date.now(),
            text: text,
            sender: sender,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
        if (imageData) {
            msg.imageData = imageData;
        }
        currentMessages.push(msg);
        
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        if (chatIndex !== -1) {
            chats[chatIndex].messages = [...currentMessages];
        }
        saveData();
        renderMessages();
    }

    // ========== MODE ==========
    function setMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(\`.mode-btn[data-mode="\${mode}"]\`).classList.add('active');
    }

    // ========== PENDING FILE PREVIEW (DI DALAM CHAT, SEBELUM ENTER) ==========
    function showPendingFilePreview(file, type, previewData) {
        const container = document.getElementById('pendingFilePreview');
        
        let html = '';
        if (type === 'image') {
            html = \`
                <div class="pending-file-preview">
                    <img src="\${previewData}" alt="preview">
                    <div class="file-info">
                        <div><strong>\${file.name}</strong></div>
                        <div style="font-size: 11px; color: #9ca3af;">\${(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button class="remove-pending" onclick="clearPendingFile()">✕ Hapus</button>
                </div>
            \`;
        } else {
            const icon = type === 'document' ? 'fa-file-pdf' : 'fa-music';
            html = \`
                <div class="pending-file-preview">
                    <i class="fas \${icon}" style="font-size: 32px; color: #60a5fa;"></i>
                    <div class="file-info">
                        <div><strong>\${file.name}</strong></div>
                        <div style="font-size: 11px; color: #9ca3af;">\${(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button class="remove-pending" onclick="clearPendingFile()">✕ Hapus</button>
                </div>
            \`;
        }
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Scroll ke bawah agar preview terlihat
        const messagesArea = document.getElementById('messagesArea');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function clearPendingFile() {
        pendingFile = null;
        pendingFileType = null;
        pendingFilePreview = null;
        document.getElementById('pendingFilePreview').style.display = 'none';
        document.getElementById('pendingFilePreview').innerHTML = '';
    }

    // ========== FILE UPLOAD ==========
    function triggerFileUpload(type) {
        if (type === 'image') document.getElementById('imageInput').click();
        else if (type === 'document') document.getElementById('documentInput').click();
        else if (type === 'audio') document.getElementById('audioInput').click();
    }

    function handleFileSelect(type, input) {
        const file = input.files[0];
        if (!file) return;
        
        pendingFile = file;
        pendingFileType = type;
        
        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
                pendingFilePreview = e.target.result;
                showPendingFilePreview(file, type, pendingFilePreview);
            };
            reader.readAsDataURL(file);
        } else {
            showPendingFilePreview(file, type, null);
        }
        
        input.value = '';
    }

    // ========== SEND MESSAGE ==========
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!pendingFile && !message) return;
        
        // Handle file upload
        if (pendingFile) {
            const file = pendingFile;
            const fileType = pendingFileType;
            const filePreview = pendingFilePreview;
            
            // Tampilkan pesan user dengan preview gambar di chat
            let userMessageText = message || (fileType === 'image' ? '📷 Mengirim gambar' : \`📎 \${file.name}\`);
            
            if (fileType === 'image' && filePreview) {
                addMessage(userMessageText, 'user', filePreview);
            } else {
                addMessage(userMessageText, 'user');
            }
            
            input.value = '';
            input.style.height = 'auto';
            clearPendingFile();
            
            const typing = document.getElementById('typingIndicator');
            const sendBtn = document.getElementById('sendBtn');
            typing.classList.add('active');
            sendBtn.disabled = true;
            
            try {
                const formData = new FormData();
                let endpoint = '';
                
                if (fileType === 'image') endpoint = '/api/chat/image';
                else if (fileType === 'document') endpoint = '/api/chat/document';
                else endpoint = '/api/chat/audio';
                
                formData.append(fileType, file);
                if (message) formData.append('prompt', message);
                
                const response = await fetch(endpoint, { method: 'POST', body: formData });
                const data = await response.json();
                addMessage(data.output || 'Maaf, terjadi kesalahan.', 'bot');
            } catch (error) {
                addMessage('❌ Error: ' + error.message, 'bot');
            } finally {
                typing.classList.remove('active');
                sendBtn.disabled = false;
            }
        } 
        // Handle text only
        else if (message) {
            addMessage(message, 'user');
            input.value = '';
            input.style.height = 'auto';
            
            const typing = document.getElementById('typingIndicator');
            const sendBtn = document.getElementById('sendBtn');
            typing.classList.add('active');
            sendBtn.disabled = true;
            
            try {
                const response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message, mode: currentMode })
                });
                const data = await response.json();
                addMessage(data.output || 'Maaf, terjadi kesalahan.', 'bot');
            } catch (error) {
                addMessage('❌ Error: ' + error.message, 'bot');
            } finally {
                typing.classList.remove('active');
                sendBtn.disabled = false;
            }
        }
    }

    function handleEnter(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // Auto resize textarea
    document.getElementById('messageInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Initialize
    loadData();
    setMode('chat');
</script>
</body>
</html>
    `);
});

app.get('/', (req, res) => {
    res.redirect('/chat');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     ✨ AIBH - FINAL VERSION ✨                               ║');
    console.log('║     ✅ Logo Modern Bridge (A dan H terhubung)                ║');
    console.log('║     ✅ Preview file DI DALAM CHAT sebelum enter              ║');
    console.log('║     ✅ Bot Kiri | User Kanan | 3 Mode                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
});

export default app;