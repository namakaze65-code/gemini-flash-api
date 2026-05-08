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

// API Endpoint
app.post('/api/chat/text', async (req, res) => {
    try {
        const { prompt, mode = 'general' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt required' });
        }
        
        const systemInstructions = {
            general: 'Kamu adalah AIBH, asisten AI premium yang ramah, cerdas, dan membantu. Jawab pertanyaan dengan akurat, jelas, dan hangat.',
            javascript: 'Kamu adalah ahli JavaScript/TypeScript senior. Berikan kode modern, clean, dengan best practices dan penjelasan detail.',
            python: 'Kamu adalah ahli Python senior. Berikan kode sesuai PEP 8, dengan docstring, type hints, dan penjelasan.',
            math: 'Kamu adalah ahli matematika dan aljabar linier. Selesaikan soal dengan langkah-langkah jelas, sistematis, dan mudah dipahami.'
        };
        
        const instruction = systemInstructions[mode] || systemInstructions.general;
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                temperature: 0.7,
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

// Frontend - PREMIUM DESIGN
app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            min-height: 100vh;
            color: #fff;
            overflow-x: hidden;
        }

        /* Animated Background */
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            overflow: hidden;
        }

        .bg-animation::before {
            content: '';
            position: absolute;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.2) 0%, transparent 50%);
            animation: rotate 25s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Floating Particles */
        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
            animation: float 8s infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            50% { opacity: 0.5; }
        }

        /* Main Container */
        .app {
            position: relative;
            z-index: 10;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* ========== SIDEBAR PREMIUM ========== */
        .sidebar {
            width: 300px;
            background: rgba(15, 15, 35, 0.8);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-direction: column;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 5px 0 30px rgba(0, 0, 0, 0.3);
        }

        .sidebar.collapsed {
            transform: translateX(-300px);
        }

        /* Sidebar Header */
        .sidebar-header {
            padding: 30px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .logo-icon {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            font-weight: 700;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            animation: glow 3s infinite;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
            50% { box-shadow: 0 8px 35px rgba(236, 72, 153, 0.6); }
        }

        .logo-text h1 {
            font-size: 22px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff, #a78bfa, #e879f9);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo-text p {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 4px;
        }

        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 4px 12px;
            border-radius: 30px;
            font-size: 10px;
            font-weight: 600;
            margin-top: 16px;
        }

        /* New Chat Button */
        .new-chat-btn {
            width: calc(100% - 48px);
            margin: 20px 24px;
            padding: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 40px;
            color: white;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .new-chat-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.6);
        }

        /* History Section */
        .history-section {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px;
        }

        .history-title {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 16px 12px 8px;
        }

        .history-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-radius: 14px;
            cursor: pointer;
            margin-bottom: 6px;
            transition: all 0.3s;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .history-item:hover {
            background: rgba(102, 126, 234, 0.15);
            border-color: rgba(102, 126, 234, 0.3);
            transform: translateX(5px);
        }

        .history-item.active {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.25));
            border-left: 3px solid #a78bfa;
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
            color: rgba(255, 255, 255, 0.4);
            margin-top: 4px;
        }

        .delete-history {
            background: rgba(239, 68, 68, 0);
            border: none;
            color: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            padding: 8px;
            border-radius: 10px;
            transition: all 0.2s;
            opacity: 0;
        }

        .history-item:hover .delete-history {
            opacity: 1;
        }

        .delete-history:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
        }

        /* Clear Button */
        .clear-btn {
            margin: 16px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 40px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 13px;
            transition: all 0.3s;
        }

        .clear-btn:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: #ef4444;
            color: #fca5a5;
        }

        /* Sidebar Toggle */
        .sidebar-toggle {
            position: absolute;
            left: 310px;
            top: 24px;
            width: 36px;
            height: 36px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
            transition: all 0.3s;
        }

        .sidebar-toggle.collapsed {
            left: 20px;
        }

        .sidebar-toggle:hover {
            background: rgba(102, 126, 234, 0.3);
            border-color: #667eea;
        }

        /* ========== MAIN CHAT AREA ========== */
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Chat Header */
        .chat-header {
            padding: 20px 28px;
            background: rgba(15, 15, 35, 0.6);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chat-header h1 {
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.15);
            padding: 5px 12px;
            border-radius: 30px;
            font-size: 11px;
            color: #34d399;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #34d399;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* Mode Selector - Premium Badges */
        .mode-selector {
            padding: 16px 28px;
            background: rgba(15, 15, 35, 0.4);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            overflow-x: auto;
            white-space: nowrap;
        }

        .mode-buttons {
            display: inline-flex;
            gap: 12px;
        }

        .mode-btn {
            padding: 10px 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 60px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .mode-btn i {
            font-size: 14px;
        }

        .mode-btn.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-color: transparent;
            color: white;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .mode-btn:hover:not(.active) {
            background: rgba(102, 126, 234, 0.2);
            border-color: rgba(102, 126, 234, 0.5);
            transform: translateY(-2px);
        }

        .mode-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 12px;
        }

        /* Messages Container */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 28px;
        }

        .messages-container::-webkit-scrollbar {
            width: 5px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 10px;
        }

        /* Message Bubbles */
        .message {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-avatar {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }

        .user-message .message-avatar {
            background: linear-gradient(135deg, #667eea, #764ba2);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .ai-message .message-avatar {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-content {
            flex: 1;
        }

        .message-bubble {
            padding: 14px 20px;
            border-radius: 24px;
            line-height: 1.6;
            font-size: 14px;
        }

        .user-message .message-bubble {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85));
            border-bottom-right-radius: 8px;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
        }

        .ai-message .message-bubble {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-bottom-left-radius: 8px;
            backdrop-filter: blur(10px);
        }

        .message-bubble pre {
            background: #0a0a0a;
            padding: 14px;
            border-radius: 14px;
            overflow-x: auto;
            margin: 12px 0;
            font-size: 12px;
            font-family: 'Fira Code', monospace;
        }

        .message-bubble code {
            background: #0a0a0a;
            padding: 2px 8px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
        }

        .message-time {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 8px;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 14px;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 30px;
            width: fit-content;
            margin: 0 28px 16px;
        }

        .typing-indicator.active {
            display: flex;
        }

        .typing-dots {
            display: flex;
            gap: 6px;
        }

        .typing-dots span {
            width: 8px;
            height: 8px;
            background: #a78bfa;
            border-radius: 50%;
            animation: bounce 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-10px); opacity: 1; }
        }

        /* Input Area */
        .input-area {
            padding: 20px 28px 28px;
            background: rgba(15, 15, 35, 0.6);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .input-wrapper {
            max-width: 1000px;
            margin: 0 auto;
        }

        .input-container {
            display: flex;
            align-items: flex-end;
            gap: 14px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 60px;
            padding: 8px 12px 8px 24px;
            transition: all 0.3s;
        }

        .input-container:focus-within {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .input-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
            transition: all 0.3s;
        }

        .action-btn:hover {
            background: rgba(102, 126, 234, 0.3);
            color: #a78bfa;
            transform: scale(1.05);
        }

        #messageInput {
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 0;
            color: #fff;
            font-size: 15px;
            outline: none;
            resize: none;
            font-family: 'Inter', sans-serif;
            max-height: 120px;
        }

        #messageInput::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        #sendBtn {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            color: white;
            font-size: 16px;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        #sendBtn:hover {
            transform: scale(1.08);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        #sendBtn:disabled {
            opacity: 0.5;
            transform: none;
        }

        /* File Preview */
        .file-preview {
            display: none;
            margin-bottom: 14px;
            padding: 10px 18px;
            background: rgba(102, 126, 234, 0.15);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 50px;
            align-items: center;
            gap: 14px;
            width: fit-content;
        }

        .file-preview.active {
            display: flex;
        }

        .file-preview img {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            object-fit: cover;
        }

        .remove-file {
            background: rgba(239, 68, 68, 0.2);
            border: none;
            padding: 6px 14px;
            border-radius: 30px;
            color: #fca5a5;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.3s;
        }

        .remove-file:hover {
            background: rgba(239, 68, 68, 0.4);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 80px 20px;
        }

        .empty-icon {
            font-size: 80px;
            margin-bottom: 24px;
            animation: floatIcon 4s ease-in-out infinite;
        }

        @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .empty-state h3 {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
        }

        .empty-state p {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }

        /* Mobile Menu */
        .mobile-menu-btn {
            display: none;
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 55px;
            height: 55px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 200;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                left: 0;
                top: 0;
                height: 100%;
                z-index: 200;
                transform: translateX(-100%);
            }
            
            .sidebar.mobile-open {
                transform: translateX(0);
            }
            
            .sidebar-toggle {
                left: 20px;
                top: 16px;
            }
            
            .chat-header, .mode-selector {
                padding: 12px 16px;
            }
            
            .messages-container {
                padding: 16px;
            }
            
            .input-area {
                padding: 12px 16px 20px;
            }
            
            .mobile-menu-btn {
                display: flex;
            }
            
            .mode-btn {
                padding: 6px 14px;
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
<div class="bg-animation"></div>
<div id="particles"></div>

<div class="app">
    <!-- Sidebar Toggle -->
    <div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
        <i class="fas fa-chevron-left"></i>
    </div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <div class="logo-icon">🧠</div>
                <div class="logo-text">
                    <h1>AIBH</h1>
                    <p>Artificial Intelligence Brain of Hasan</p>
                </div>
            </div>
            <div class="badge">
                <i class="fas fa-crown"></i> PREMIUM AI
            </div>
        </div>

        <button class="new-chat-btn" onclick="newChat()">
            <i class="fas fa-plus-circle"></i> New Conversation
        </button>

        <div class="history-section">
            <div class="history-title">
                <i class="fas fa-clock"></i> RECENT CHATS
            </div>
            <div class="history-list" id="historyList"></div>
        </div>

        <button class="clear-btn" onclick="clearAllHistory()">
            <i class="fas fa-trash-alt"></i> Clear All History
        </button>
    </div>

    <!-- Main Chat -->
    <div class="main-chat">
        <div class="chat-header">
            <h1>
                <i class="fas fa-brain" style="color: #a78bfa;"></i>
                AIBH Assistant
                <span class="status">
                    <span class="status-dot"></span>
                    Active
                </span>
            </h1>
        </div>

        <div class="mode-selector">
            <div class="mode-buttons">
                <button class="mode-btn active" data-mode="general" onclick="setMode('general')">
                    <i class="fas fa-comment-dots"></i> General
                </button>
                <button class="mode-btn" data-mode="javascript" onclick="setMode('javascript')">
                    <i class="fab fa-js"></i> JavaScript
                </button>
                <button class="mode-btn" data-mode="python" onclick="setMode('python')">
                    <i class="fab fa-python"></i> Python
                </button>
                <button class="mode-btn" data-mode="math" onclick="setMode('math')">
                    <i class="fas fa-square-root-alt"></i> Mathematics
                </button>
            </div>
            <div class="mode-desc" id="modeDesc">
                💬 Mode General: Siap membantu percakapan sehari-hari Anda
            </div>
        </div>

        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <h3>AIBH - AI Profesional</h3>
                <p>Ahli Coding • Matematika • Pengetahuan Umum</p>
            </div>
        </div>

        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span style="color: rgba(255,255,255,0.6);">AIBH sedang mengetik...</span>
        </div>

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
                        placeholder="Tanyakan apa saja... Coding, Matematika, atau Obrolan Santai"
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

<div class="mobile-menu-btn" id="mobileMenuBtn" onclick="openMobileMenu()">
    <i class="fas fa-bars"></i>
</div>

<input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleFileSelect('image', this)">
<input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display:none" onchange="handleFileSelect('document', this)">
<input type="file" id="audioInput" accept="audio/*" style="display:none" onchange="handleFileSelect('audio', this)">

<script>
    // Generate particles
    function createParticles() {
        const container = document.getElementById('particles');
        for (let i = 0; i < 80; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.width = Math.random() * 4 + 2 + 'px';
            p.style.height = p.style.width;
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = Math.random() * 10 + 5 + 's';
            container.appendChild(p);
        }
    }

    // State
    let currentChatId = null;
    let chats = [];
    let currentMessages = [];
    let currentFile = null;
    let currentFileType = null;
    let currentMode = 'general';

    // Load from localStorage
    function loadData() {
        const saved = localStorage.getItem('aibh_chats_v2');
        if (saved) {
            chats = JSON.parse(saved);
            renderHistory();
            const lastId = localStorage.getItem('aibh_current_id_v2');
            if (lastId && chats.find(c => c.id === lastId)) {
                loadChat(lastId);
            } else if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                newChat();
            }
        } else {
            newChat();
        }
    }

    function saveData() {
        localStorage.setItem('aibh_chats_v2', JSON.stringify(chats));
        if (currentChatId) {
            localStorage.setItem('aibh_current_id_v2', currentChatId);
        }
        renderHistory();
    }

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
            const title = firstMsg ? (firstMsg.text.substring(0, 30) + (firstMsg.text.length > 30 ? '...' : '')) : 'New Chat';
            
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

    function renderMessages() {
        const container = document.getElementById('messagesContainer');
        
        if (currentMessages.length === 0) {
            container.innerHTML = \`
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>AIBH - AI Profesional</h3>
                    <p>Ahli Coding • Matematika • Pengetahuan Umum</p>
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

    function setMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(\`.mode-btn[data-mode="\${mode}"]\`).classList.add('active');
        
        const desc = {
            general: '💬 Mode General: Siap membantu percakapan sehari-hari Anda',
            javascript: '💻 Mode JavaScript: Ahli coding JavaScript/TypeScript dengan best practices',
            python: '🐍 Mode Python: Ahli Python dengan kode clean dan optimal',
            math: '📐 Mode Matematika: Ahli aljabar, kalkulus, dan transformasi linier'
        };
        document.getElementById('modeDesc').textContent = desc[mode];
    }

    // File handlers
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
                let endpoint = '/api/chat/';
                if (currentFileType === 'image') endpoint += 'image';
                else if (currentFileType === 'document') endpoint += 'document';
                else endpoint += 'audio';
                
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

    // Close mobile menu on click outside
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
    createParticles();
    loadData();
    setMode('general');
</script>
</body>
</html>
    `);
});

app.get('/', (req, res) => { res.redirect('/chat'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     ✨ AIBH - PREMIUM AI ASSISTANT ✨                         ║');
    console.log('║     🎨 Glassmorphism Design | Modern | Colorful              ║');
    console.log('║     💻 Coding | 📐 Math | 💬 General Chat                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
});

export default app;