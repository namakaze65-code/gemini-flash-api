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
            chat: 'Kamu adalah AIBH, asisten AI yang ramah, hangat, dan membantu. Jawab pertanyaan dengan bahasa yang santai dan mudah dipahami. Gunakan emoji sesekali untuk membuat percakapan lebih hidup.',
            deep: 'Kamu adalah AIBH dalam mode PIKIR MENDALAM. Analisis pertanyaan dengan sangat mendalam, jabarkan langkah demi langkah, berikan reasoning yang jelas, dan gunakan pendekatan sistematis. Tunjukkan proses berpikir Anda secara detail.',
            search: 'Kamu adalah AIBH dalam mode PENCARIAN CERDAS. Prioritaskan akurasi informasi, berikan fakta yang terverifikasi, dan jika perlu lakukan pencarian pengetahuan. Jawab dengan singkat, padat, dan informatif seperti hasil pencarian.'
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

// Frontend - FINAL PREMIUM VERSION
app.get('/chat', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>AIBH | Artificial Intelligence Brain of Hasan</title>
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
            background: #0a0a0f;
            min-height: 100vh;
            color: #e5e5e5;
            overflow: hidden;
        }

        /* Main Layout - seperti VS Code */
        .app {
            display: flex;
            height: 100vh;
            width: 100%;
            position: relative;
            background: radial-gradient(ellipse at 20% 30%, rgba(59,130,246,0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(139,92,246,0.06) 0%, transparent 50%);
        }

        /* ========== SIDEBAR - Kuat seperti VS Code ========== */
        .sidebar {
            width: 280px;
            background: rgba(18, 18, 24, 0.95);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(255,255,255,0.06);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
        }

        .sidebar.collapsed {
            transform: translateX(-280px);
            position: fixed;
            box-shadow: none;
        }

        /* Sidebar Header - Logo Modern Bridge */
        .sidebar-header {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* Logo AIBH Modern Bridge - SVG Kustom */
        .logo-svg {
            width: 48px;
            height: 48px;
            filter: drop-shadow(0 4px 12px rgba(59,130,246,0.3));
        }

        .logo-text h1 {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #94a3f8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 0.5px;
        }

        .logo-text p {
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            margin-top: 4px;
        }

        .premium-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            margin-top: 16px;
        }

        /* New Chat Button */
        .new-chat-btn {
            width: calc(100% - 32px);
            margin: 16px;
            padding: 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .new-chat-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59,130,246,0.4);
        }

        /* History Section */
        .history-section {
            flex: 1;
            overflow-y: auto;
            padding: 0 12px;
        }

        .history-title {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255,255,255,0.35);
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 16px 12px 8px;
        }

        .history-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 4px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            transition: all 0.2s;
        }

        .history-item:hover {
            background: rgba(59,130,246,0.1);
            border-color: rgba(59,130,246,0.2);
        }

        .history-item.active {
            background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15));
            border-left: 2px solid #3b82f6;
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
            color: rgba(255,255,255,0.35);
            margin-top: 4px;
        }

        .delete-history {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.3);
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            opacity: 0;
            transition: all 0.2s;
        }

        .history-item:hover .delete-history {
            opacity: 1;
        }

        .delete-history:hover {
            background: rgba(239,68,68,0.2);
            color: #f87171;
        }

        /* Clear Button */
        .clear-btn {
            margin: 16px;
            padding: 10px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
            color: rgba(255,255,255,0.5);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            transition: all 0.2s;
        }

        .clear-btn:hover {
            background: rgba(239,68,68,0.1);
            border-color: #ef4444;
            color: #f87171;
        }

        /* Sidebar Toggle */
        .sidebar-toggle {
            position: fixed;
            left: 290px;
            top: 20px;
            width: 32px;
            height: 32px;
            background: rgba(30,30,40,0.9);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 60;
            transition: all 0.3s;
        }

        .sidebar-toggle.collapsed {
            left: 20px;
        }

        .sidebar-toggle:hover {
            background: rgba(59,130,246,0.3);
            border-color: #3b82f6;
        }

        /* ========== MAIN CHAT AREA ========== */
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        /* Header */
        .chat-header {
            padding: 16px 28px;
            background: rgba(18,18,24,0.7);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header h2 {
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16,185,129,0.12);
            padding: 5px 12px;
            border-radius: 30px;
            font-size: 11px;
            color: #34d399;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            background: #34d399;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%,100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        /* 3 MODE BUTTONS - Diatas Kotak Pesan */
        .mode-container {
            padding: 20px 28px 12px 28px;
            background: transparent;
        }

        .mode-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .mode-btn {
            padding: 10px 24px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 40px;
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .mode-btn i {
            font-size: 14px;
        }

        /* Warna berbeda tiap mode */
        .mode-btn[data-mode="chat"] { border-left: 3px solid #3b82f6; }
        .mode-btn[data-mode="deep"] { border-left: 3px solid #8b5cf6; }
        .mode-btn[data-mode="search"] { border-left: 3px solid #10b981; }

        .mode-btn.active[data-mode="chat"] {
            background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05));
            border-color: #3b82f6;
            color: #60a5fa;
        }

        .mode-btn.active[data-mode="deep"] {
            background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05));
            border-color: #8b5cf6;
            color: #a78bfa;
        }

        .mode-btn.active[data-mode="search"] {
            background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05));
            border-color: #10b981;
            color: #34d399;
        }

        .mode-btn:hover:not(.active) {
            background: rgba(255,255,255,0.08);
            transform: translateY(-2px);
        }

        /* Messages Container */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 0 28px 20px;
        }

        .messages-container::-webkit-scrollbar {
            width: 5px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.03);
            border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: #3b82f6;
            border-radius: 10px;
        }

        /* Message Bubbles */
        .message {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
            animation: fadeInUp 0.3s ease;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(15px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-avatar {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .user-message .message-avatar {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .ai-message .message-avatar {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
        }

        .message-content {
            flex: 1;
        }

        .message-bubble {
            padding: 12px 18px;
            border-radius: 18px;
            line-height: 1.6;
            font-size: 14px;
        }

        .user-message .message-bubble {
            background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1));
            border: 1px solid rgba(59,130,246,0.2);
            border-bottom-right-radius: 6px;
        }

        .ai-message .message-bubble {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-bottom-left-radius: 6px;
        }

        .message-bubble pre {
            background: #0f0f14;
            padding: 12px;
            border-radius: 12px;
            overflow-x: auto;
            margin: 10px 0;
            font-size: 12px;
            font-family: 'Fira Code', monospace;
        }

        .message-bubble code {
            background: #0f0f14;
            padding: 2px 8px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
        }

        .message-time {
            font-size: 10px;
            color: rgba(255,255,255,0.35);
            margin-top: 6px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 80px 20px;
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
            font-size: 22px;
            font-weight: 700;
            background: linear-gradient(135deg, #fff, #94a3f8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .empty-state p {
            color: rgba(255,255,255,0.4);
            font-size: 13px;
            margin-top: 8px;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 12px;
            padding: 10px 18px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 30px;
            width: fit-content;
            margin: 0 28px 10px;
        }

        .typing-indicator.active {
            display: flex;
        }

        .typing-dots {
            display: flex;
            gap: 5px;
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

        /* Input Area - Kotak Pesan */
        .input-area {
            padding: 20px 28px 28px;
            background: transparent;
        }

        .input-wrapper {
            max-width: 900px;
            margin: 0 auto;
        }

        .input-container {
            display: flex;
            align-items: flex-end;
            gap: 12px;
            background: rgba(30,30,40,0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 28px;
            padding: 8px 12px 8px 20px;
            transition: all 0.3s;
        }

        .input-container:focus-within {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
            background: rgba(30,30,40,0.95);
        }

        .input-actions {
            display: flex;
            gap: 6px;
        }

        .action-btn {
            background: rgba(255,255,255,0.05);
            border: none;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            cursor: pointer;
            color: rgba(255,255,255,0.5);
            font-size: 15px;
            transition: all 0.2s;
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
            color: #fff;
            font-size: 14px;
            outline: none;
            resize: none;
            font-family: 'Inter', sans-serif;
            max-height: 100px;
        }

        #messageInput::placeholder {
            color: rgba(255,255,255,0.35);
        }

        #sendBtn {
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            color: white;
            font-size: 15px;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }

        #sendBtn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(59,130,246,0.5);
        }

        /* File Preview */
        .file-preview {
            display: none;
            margin-bottom: 12px;
            padding: 8px 16px;
            background: rgba(59,130,246,0.1);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 30px;
            align-items: center;
            gap: 12px;
            width: fit-content;
        }

        .file-preview.active {
            display: flex;
        }

        .file-preview img {
            width: 30px;
            height: 30px;
            border-radius: 8px;
        }

        .remove-file {
            background: rgba(239,68,68,0.15);
            border: none;
            padding: 4px 12px;
            border-radius: 20px;
            color: #fca5a5;
            cursor: pointer;
            font-size: 10px;
        }

        /* Mobile Menu */
        .mobile-menu-btn {
            display: none;
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                left: 0;
                top: 0;
                height: 100%;
                z-index: 100;
                transform: translateX(-100%);
            }
            .sidebar.mobile-open {
                transform: translateX(0);
            }
            .sidebar-toggle {
                left: 20px;
                top: 16px;
            }
            .mode-container {
                padding: 12px 16px;
            }
            .mode-buttons {
                gap: 10px;
            }
            .mode-btn {
                padding: 6px 14px;
                font-size: 11px;
            }
            .messages-container {
                padding: 0 16px 16px;
            }
            .input-area {
                padding: 12px 16px 20px;
            }
            .mobile-menu-btn {
                display: flex;
            }
        }
    </style>
</head>
<body>
<div class="app">
    <!-- Sidebar Toggle -->
    <div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo-container">
                <!-- Logo AIBH Modern Bridge - SVG Kustom -->
                <svg class="logo-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#3b82f6"/>
                            <stop offset="50%" style="stop-color:#8b5cf6"/>
                            <stop offset="100%" style="stop-color:#c084fc"/>
                        </linearGradient>
                        <linearGradient id="logoGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#3b82f6"/>
                            <stop offset="100%" style="stop-color:#8b5cf6"/>
                        </linearGradient>
                    </defs>
                    <!-- Huruf A - Modern Bridge Style -->
                    <path d="M20 65 L40 20 L60 65" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M32 50 L48 50" stroke="url(#logoGrad)" stroke-width="7" stroke-linecap="round"/>
                    <!-- Huruf H - Terhubung seperti jembatan -->
                    <path d="M65 65 L65 20" stroke="url(#logoGrad2)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M65 42 L75 42" stroke="url(#logoGrad2)" stroke-width="7" stroke-linecap="round"/>
                    <path d="M75 65 L75 20" stroke="url(#logoGrad2)" stroke-width="7" stroke-linecap="round"/>
                    <!-- Garis penghubung modern bridge -->
                    <path d="M60 65 L55 65" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
                </svg>
                <div class="logo-text">
                    <h1>AIBH</h1>
                    <p>Artificial Intelligence Brain of Hasan</p>
                </div>
            </div>
            <div class="premium-badge">
                <i class="fas fa-crown"></i> PREMIUM AI
            </div>
        </div>

        <button class="new-chat-btn" onclick="newChat()">
            <i class="fas fa-plus-circle"></i> New Chat
        </button>

        <div class="history-section">
            <div class="history-title">
                <i class="fas fa-clock"></i> RECENT CHATS
            </div>
            <div class="history-list" id="historyList"></div>
        </div>

        <button class="clear-btn" onclick="clearAllHistory()">
            <i class="fas fa-trash-alt"></i> Clear History
        </button>
    </div>

    <!-- Main Chat -->
    <div class="main-chat">
        <div class="chat-header">
            <h2>
                <i class="fas fa-brain" style="color: #60a5fa;"></i>
                AIBH Assistant
            </h2>
            <div class="status">
                <span class="status-dot"></span>
                Online
            </div>
        </div>

        <!-- Messages Container -->
        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <h3>AIBH - Artificial Intelligence Brain of Hasan</h3>
                <p>Asisten AI cerdas dengan 3 mode: Percakapan | Pikir Mendalam | Pencarian Cerdas</p>
            </div>
        </div>

        <!-- Typing Indicator -->
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <span>AIBH sedang mengetik...</span>
        </div>

        <!-- 3 MODE BUTTONS - Diatas Kotak Pesan -->
        <div class="mode-container">
            <div class="mode-buttons">
                <button class="mode-btn active" data-mode="chat" onclick="setMode('chat')">
                    <i class="fas fa-comment-dots"></i> 💬 Percakapan
                </button>
                <button class="mode-btn" data-mode="deep" onclick="setMode('deep')">
                    <i class="fas fa-brain"></i> 🧠 Pikir Mendalam
                </button>
                <button class="mode-btn" data-mode="search" onclick="setMode('search')">
                    <i class="fas fa-search"></i> 🔍 Pencarian Cerdas
                </button>
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
            <div class="file-preview" id="filePreview">
                <img id="previewImg" src="">
                <span id="fileName"></span>
                <button class="remove-file" onclick="clearFile()">✕ Hapus</button>
            </div>
            <div class="input-wrapper">
                <div class="input-container">
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

<!-- Mobile Menu Button -->
<div class="mobile-menu-btn" id="mobileMenuBtn" onclick="openMobileMenu()">
    <i class="fas fa-bars"></i>
</div>

<input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleFileSelect('image', this)">
<input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display:none" onchange="handleFileSelect('document', this)">
<input type="file" id="audioInput" accept="audio/*" style="display:none" onchange="handleFileSelect('audio', this)">

<script>
    // ========== STATE ==========
    let currentChatId = null;
    let chats = [];
    let currentMessages = [];
    let currentFile = null;
    let currentFileType = null;
    let currentMode = 'chat';

    // ========== LOAD & SAVE ==========
    function loadData() {
        const saved = localStorage.getItem('aibh_chats_final');
        if (saved) {
            chats = JSON.parse(saved);
            const lastId = localStorage.getItem('aibh_current_id_final');
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
        localStorage.setItem('aibh_chats_final', JSON.stringify(chats));
        if (currentChatId) {
            localStorage.setItem('aibh_current_id_final', currentChatId);
        }
        renderHistory();
    }

    // ========== HISTORY ==========
    function renderHistory() {
        const container = document.getElementById('historyList');
        if (chats.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">Belum ada chat</div>';
            return;
        }
        
        container.innerHTML = '';
        chats.forEach(chat => {
            const div = document.createElement('div');
            div.className = 'history-item';
            if (chat.id === currentChatId) div.classList.add('active');
            
            const firstMsg = chat.messages.find(m => m.sender === 'user');
            const title = firstMsg ? (firstMsg.text.substring(0, 28) + (firstMsg.text.length > 28 ? '...' : '')) : 'New Chat';
            
            div.innerHTML = \`
                <div class="history-content" onclick="loadChat('\${chat.id}')">
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
    }

    function loadChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        currentMessages = [...chat.messages];
        renderMessages();
        saveData();
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
        }
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
        if (confirm('Hapus SEMUA riwayat chat? Tindakan tidak bisa dibatalkan.')) {
            chats = [];
            newChat();
            saveData();
        }
    }

    // ========== MESSAGES ==========
    function renderMessages() {
        const container = document.getElementById('messagesContainer');
        
        if (currentMessages.length === 0) {
            container.innerHTML = \`
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>AIBH - Artificial Intelligence Brain of Hasan</h3>
                    <p>Asisten AI cerdas dengan 3 mode: Percakapan | Pikir Mendalam | Pencarian Cerdas</p>
                </div>
            \`;
            return;
        }
        
        container.innerHTML = '';
        currentMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = \`message \${msg.sender === 'user' ? 'user-message' : 'ai-message'}\`;
            
            let formattedText = msg.text
                .replace(/\\n/g, '<br>')
                .replace(/\\\`\\\`\\\`(\\w*)\\n([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre><code class="language-$1">$2</code></pre>');
            
            div.innerHTML = \`
                <div class="message-avatar">
                    \${msg.sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>'}
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        \${formattedText}
                    </div>
                    <div class="message-time">\${msg.time}</div>
                </div>
            \`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    function addMessage(text, sender) {
        const msg = {
            id: Date.now(),
            text: text,
            sender: sender,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
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

    // ========== FILE HANDLERS ==========
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
        
        const preview = document.getElementById('filePreview');
        const previewImg = document.getElementById('previewImg');
        const fileName = document.getElementById('fileName');
        
        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => { previewImg.src = e.target.result; };
            reader.readAsDataURL(file);
        }
        
        fileName.textContent = file.name;
        preview.classList.add('active');
    }

    function clearFile() {
        currentFile = null;
        currentFileType = null;
        document.getElementById('filePreview').classList.remove('active');
        document.getElementById('imageInput').value = '';
        document.getElementById('documentInput').value = '';
        document.getElementById('audioInput').value = '';
    }

    // ========== SEND MESSAGE ==========
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message && !currentFile) return;
        
        addMessage(message || (currentFile ? \`📎 \${currentFile.name}\` : ''), 'user');
        input.value = '';
        input.style.height = 'auto';
        
        const typing = document.getElementById('typingIndicator');
        const sendBtn = document.getElementById('sendBtn');
        typing.classList.add('active');
        sendBtn.disabled = true;
        
        try {
            let response;
            
            if (currentFile) {
                const formData = new FormData();
                let endpoint = '';
                if (currentFileType === 'image') endpoint = '/api/chat/image';
                else if (currentFileType === 'document') endpoint = '/api/chat/document';
                else endpoint = '/api/chat/audio';
                
                formData.append(currentFileType, currentFile);
                if (message) formData.append('prompt', message);
                
                response = await fetch(endpoint, { method: 'POST', body: formData });
                clearFile();
            } else {
                response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message, mode: currentMode })
                });
            }
            
            const data = await response.json();
            addMessage(data.output || 'Maaf, terjadi kesalahan.', 'ai');
            
        } catch (error) {
            addMessage('❌ Error: ' + error.message, 'ai');
        } finally {
            typing.classList.remove('active');
            sendBtn.disabled = false;
        }
    }

    function handleEnter(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // ========== UI HELPERS ==========
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        sidebar.classList.toggle('collapsed');
        toggle.classList.toggle('collapsed');
    }

    function openMobileMenu() {
        document.getElementById('sidebar').classList.toggle('mobile-open');
    }

    // Auto resize textarea
    document.getElementById('messageInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Close mobile menu on outside click
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.getElementById('mobileMenuBtn');
            if (sidebar && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
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
    console.log('║     ✨ AIBH - Artificial Intelligence Brain of Hasan ✨       ║');
    console.log('║             3 Modes: Percakapan | Pikir Mendalam | Cari       ║');
    console.log('║                   Premium Dark Theme + Glassmorphism          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
});

export default app;