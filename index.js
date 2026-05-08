import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ============================================
// AGENTIC AI - PREMIUM WITH RESEARCH HISTORY
// ============================================

app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Hasan AI | Agentic Research Assistant</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            color: #fff;
            overflow-x: hidden;
        }

        /* Main Layout */
        .app {
            display: flex;
            min-height: 100vh;
            position: relative;
        }

        /* Sidebar */
        .sidebar {
            width: 320px;
            background: rgba(10, 10, 20, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
        }

        .sidebar.collapsed {
            transform: translateX(-320px);
        }

        /* Sidebar Toggle Button */
        .sidebar-toggle {
            position: fixed;
            left: 330px;
            top: 20px;
            width: 32px;
            height: 32px;
            background: rgba(102, 126, 234, 0.9);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 101;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .sidebar-toggle.collapsed {
            left: 20px;
        }

        .sidebar-toggle i {
            font-size: 14px;
            color: white;
        }

        /* Sidebar Header */
        .sidebar-header {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logo-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            font-size: 24px;
        }

        .sidebar-header h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .sidebar-header p {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        }

        .agent-badge {
            display: inline-block;
            background: rgba(102, 126, 234, 0.2);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            margin-top: 12px;
            color: #a78bfa;
        }

        /* New Research Button */
        .new-research-btn {
            margin: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            padding: 12px 16px;
            border-radius: 14px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 13px;
            transition: all 0.3s;
        }

        .new-research-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        /* History List */
        .history-section {
            flex: 1;
            overflow-y: auto;
            padding: 0 12px;
        }

        .history-title {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 12px 12px 8px;
        }

        .history-list {
            list-style: none;
        }

        .history-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
            position: relative;
        }

        .history-item:hover {
            background: rgba(102, 126, 234, 0.15);
        }

        .history-item.active {
            background: rgba(102, 126, 234, 0.25);
            border-left: 3px solid #667eea;
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
            color: rgba(255, 255, 255, 0.4);
            margin-top: 4px;
        }

        .history-preview {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 2px;
        }

        .delete-history-btn {
            background: rgba(239, 68, 68, 0);
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.4);
            transition: all 0.2s;
            opacity: 0;
        }

        .history-item:hover .delete-history-btn {
            opacity: 1;
        }

        .delete-history-btn:hover {
            background: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        /* Clear All Button */
        .clear-all-btn {
            margin: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px;
            border-radius: 12px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            transition: all 0.3s;
        }

        .clear-all-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            color: #ef4444;
        }

        /* Main Chat Area */
        .main-chat {
            flex: 1;
            margin-left: 320px;
            transition: margin-left 0.3s ease;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .main-chat.full-width {
            margin-left: 0;
        }

        /* Chat Header */
        .chat-header {
            padding: 20px 28px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(10, 10, 20, 0.5);
            backdrop-filter: blur(20px);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .chat-header h1 {
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .research-title {
            font-size: 14px;
            color: #a78bfa;
            margin-top: 8px;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            padding: 4px 10px;
            background: rgba(16, 185, 129, 0.15);
            border-radius: 20px;
            color: #10b981;
        }

        /* Messages Container */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 24px 28px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .messages-container::-webkit-scrollbar {
            width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.5);
            border-radius: 3px;
        }

        /* Message Bubbles */
        .message {
            display: flex;
            gap: 14px;
            animation: fadeInUp 0.3s ease;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .user-message .message-avatar {
            background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .ai-message .message-avatar {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .message-content {
            flex: 1;
        }

        .message-bubble {
            background: rgba(255, 255, 255, 0.05);
            padding: 14px 18px;
            border-radius: 20px;
            border-bottom-left-radius: 6px;
            line-height: 1.6;
            font-size: 14px;
        }

        .user-message .message-bubble {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-bottom-right-radius: 6px;
            border-bottom-left-radius: 20px;
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
            gap: 12px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            width: fit-content;
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
            animation: typingBounce 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-8px); opacity: 1; }
        }

        /* Input Area */
        .input-area {
            padding: 20px 28px 28px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(10, 10, 20, 0.5);
        }

        .input-wrapper {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }

        .input-wrapper:focus-within {
            border-color: #667eea;
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
        }

        .input-container {
            display: flex;
            align-items: flex-end;
            padding: 8px 12px 8px 20px;
            gap: 12px;
        }

        .input-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            color: rgba(255, 255, 255, 0.7);
        }

        .action-btn:hover {
            background: rgba(102, 126, 234, 0.3);
            color: #a78bfa;
        }

        #messageInput {
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 0;
            color: #fff;
            font-size: 14px;
            outline: none;
            resize: none;
            font-family: 'Inter', sans-serif;
            max-height: 100px;
        }

        #messageInput::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        #sendBtn {
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            color: white;
        }

        #sendBtn:hover {
            transform: scale(1.05);
        }

        #sendBtn:disabled {
            opacity: 0.5;
            transform: none;
        }

        /* File Preview */
        .file-preview {
            display: none;
            margin-bottom: 12px;
            padding: 8px 16px;
            background: rgba(102, 126, 234, 0.15);
            border-radius: 14px;
            align-items: center;
            gap: 12px;
            width: fit-content;
        }

        .file-preview.active {
            display: flex;
        }

        .remove-file {
            background: rgba(239, 68, 68, 0.2);
            border: none;
            padding: 4px 10px;
            border-radius: 8px;
            color: #fca5a5;
            cursor: pointer;
            font-size: 11px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 80px 20px;
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        .empty-state h3 {
            font-size: 20px;
            margin-bottom: 10px;
        }

        .empty-state p {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                width: 280px;
            }
            .main-chat {
                margin-left: 0;
            }
            .chat-header, .messages-container, .input-area {
                padding: 16px 20px;
            }
        }
    </style>
</head>
<body>
<div class="app">
    <!-- Sidebar Toggle -->
    <div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
        <i class="fas fa-chevron-left" id="toggleIcon"></i>
    </div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo-icon">
                <i class="fas fa-brain"></i>
            </div>
            <h2>Hasan AI</h2>
            <p>Agentic Research Assistant</p>
            <div class="agent-badge">
                <i class="fas fa-robot"></i> AGENTIC AI v2.0
            </div>
        </div>

        <button class="new-research-btn" onclick="newResearch()">
            <i class="fas fa-plus-circle"></i> New Research
        </button>

        <div class="history-section">
            <div class="history-title">
                <i class="fas fa-history"></i> RESEARCH HISTORY
            </div>
            <ul class="history-list" id="historyList">
                <!-- History items will be added here -->
            </ul>
        </div>

        <button class="clear-all-btn" onclick="clearAllHistory()">
            <i class="fas fa-trash-alt"></i> Clear All History
        </button>
    </div>

    <!-- Main Chat Area -->
    <div class="main-chat" id="mainChat">
        <div class="chat-header">
            <h1>
                <i class="fas fa-microscope" style="color: #a78bfa;"></i>
                Agentic Research
            </h1>
            <div class="research-title" id="researchTitle">
                Current Research Session
            </div>
            <div style="margin-top: 8px;">
                <span class="status">
                    <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
                    Active
                </span>
            </div>
        </div>

        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <div class="empty-icon">🔬</div>
                <h3>Mulai Riset Baru</h3>
                <p>Ketik pertanyaan riset Anda di bawah. Hasil akan otomatis tersimpan di sidebar.</p>
            </div>
        </div>

        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span style="font-size: 13px; color: rgba(255,255,255,0.6);">Menganalisis...</span>
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
                            <i class="fas fa-headphones"></i>
                        </button>
                    </div>
                    <textarea 
                        id="messageInput" 
                        placeholder="Apa yang ingin Anda riset hari ini?..."
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

<input type="file" id="imageInput" accept="image/*" style="display: none" onchange="handleFileSelect('image', this)">
<input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display: none" onchange="handleFileSelect('document', this)">
<input type="file" id="audioInput" accept="audio/*" style="display: none" onchange="handleFileSelect('audio', this)">

<script>
    // ============================================
    // AGENTIC AI - WITH RESEARCH HISTORY
    // ============================================

    // State
    let currentResearchId = null;
    let researches = [];
    let currentMessages = [];
    let currentFile = null;
    let currentFileType = null;

    // Load from localStorage
    function loadData() {
        const saved = localStorage.getItem('hasan_ai_researches');
        if (saved) {
            researches = JSON.parse(saved);
            renderHistory();
            
            // Load last active research
            const lastId = localStorage.getItem('hasan_ai_current_id');
            if (lastId && researches.find(r => r.id === lastId)) {
                loadResearch(lastId);
            } else if (researches.length > 0) {
                loadResearch(researches[0].id);
            } else {
                newResearch();
            }
        } else {
            newResearch();
        }
    }

    // Save all data
    function saveData() {
        localStorage.setItem('hasan_ai_researches', JSON.stringify(researches));
        if (currentResearchId) {
            localStorage.setItem('hasan_ai_current_id', currentResearchId);
        }
        renderHistory();
    }

    // Render history sidebar
    function renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (researches.length === 0) {
            historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px;">Belum ada riset. Klik "New Research" untuk memulai.</div>';
            return;
        }
        
        historyList.innerHTML = '';
        researches.forEach(research => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (research.id === currentResearchId) li.classList.add('active');
            
            // Get first user message as title
            const firstUserMsg = research.messages.find(m => m.sender === 'user');
            const title = firstUserMsg ? (firstUserMsg.text.substring(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '')) : 'New Research';
            
            li.innerHTML = \`
                <div class="history-content" onclick="loadResearch('\${research.id}')">
                    <div class="history-title-text">\${escapeHtml(title)}</div>
                    <div class="history-date">\${research.date}</div>
                    <div class="history-preview">\${research.messageCount || research.messages.length} messages</div>
                </div>
                <button class="delete-history-btn" onclick="deleteResearch('\${research.id}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            \`;
            historyList.appendChild(li);
        });
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create new research
    function newResearch() {
        const newId = Date.now().toString();
        const newResearch = {
            id: newId,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            messages: [],
            messageCount: 0
        };
        researches.unshift(newResearch);
        currentResearchId = newId;
        currentMessages = [];
        saveData();
        renderMessages();
        updateResearchTitle();
        
        // Update URL
        document.getElementById('researchTitle').innerHTML = \`<i class="fas fa-plus-circle"></i> New Research Session\`;
    }

    // Load existing research
    function loadResearch(researchId) {
        const research = researches.find(r => r.id === researchId);
        if (!research) return;
        
        currentResearchId = researchId;
        currentMessages = [...research.messages];
        renderMessages();
        saveData();
        updateResearchTitle();
        
        // Update title display
        const firstUserMsg = research.messages.find(m => m.sender === 'user');
        const title = firstUserMsg ? firstUserMsg.text.substring(0, 50) : 'New Research';
        document.getElementById('researchTitle').innerHTML = \`<i class="fas fa-folder-open"></i> \${escapeHtml(title)}\`;
    }

    // Delete single research
    function deleteResearch(researchId, event) {
        event.stopPropagation();
        
        if (confirm('Hapus riset ini? Tindakan tidak bisa dibatalkan.')) {
            const index = researches.findIndex(r => r.id === researchId);
            if (index !== -1) {
                researches.splice(index, 1);
                
                if (researches.length > 0) {
                    loadResearch(researches[0].id);
                } else {
                    newResearch();
                }
                saveData();
            }
        }
    }

    // Clear all history
    function clearAllHistory() {
        if (confirm('Hapus SEMUA riwayat riset? Tindakan tidak bisa dibatalkan.')) {
            researches = [];
            newResearch();
            saveData();
        }
    }

    // Update research title in sidebar
    function updateResearchTitle() {
        const research = researches.find(r => r.id === currentResearchId);
        if (research) {
            research.messageCount = research.messages.length;
            saveData();
        }
    }

    // Render messages to main chat
    function renderMessages() {
        const container = document.getElementById('messagesContainer');
        
        if (currentMessages.length === 0) {
            container.innerHTML = \`
                <div class="empty-state">
                    <div class="empty-icon">🔬</div>
                    <h3>Mulai Riset Baru</h3>
                    <p>Ketik pertanyaan riset Anda di bawah. Hasil akan otomatis tersimpan di sidebar.</p>
                </div>
            \`;
            return;
        }
        
        container.innerHTML = '';
        currentMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = \`message \${msg.sender === 'user' ? 'user-message' : 'ai-message'}\`;
            div.innerHTML = \`
                <div class="message-avatar">
                    \${msg.sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        \${msg.text.replace(/\\n/g, '<br>')}
                    </div>
                    <div class="message-time">\${msg.time}</div>
                </div>
            \`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    // Add message to current research
    function addMessage(text, sender) {
        const msg = {
            id: Date.now(),
            text: text,
            sender: sender,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
        
        currentMessages.push(msg);
        
        // Update research in array
        const researchIndex = researches.findIndex(r => r.id === currentResearchId);
        if (researchIndex !== -1) {
            researches[researchIndex].messages = [...currentMessages];
            researches[researchIndex].messageCount = currentMessages.length;
        }
        
        saveData();
        renderMessages();
        updateResearchTitle();
    }

    // File upload handlers
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
        } else {
            previewImg.src = type === 'document' ? '📄' : '🎵';
            previewImg.style.width = '32px';
            previewImg.style.height = '32px';
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

    // Send message to API
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message && !currentFile) return;
        
        // Add user message
        let userText = message || (currentFile ? \`📎 \${currentFile.name}\` : '');
        addMessage(userText, 'user');
        
        input.value = '';
        input.style.height = 'auto';
        
        const typing = document.getElementById('typingIndicator');
        typing.classList.add('active');
        
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;
        
        try {
            let response;
            
            if (currentFile) {
                const formData = new FormData();
                let endpoint = '/api/chat/';
                
                if (currentFileType === 'image') {
                    endpoint += 'image';
                } else if (currentFileType === 'document') {
                    endpoint += 'document';
                } else {
                    endpoint += 'audio';
                }
                
                formData.append(currentFileType, currentFile);
                if (message) formData.append('prompt', message);
                
                response = await fetch(endpoint, { method: 'POST', body: formData });
                clearFile();
            } else {
                response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message })
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

    // Enter key handler
    function handleEnter(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // Sidebar toggle
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainChat = document.getElementById('mainChat');
        const toggleBtn = document.getElementById('sidebarToggle');
        const icon = document.getElementById('toggleIcon');
        
        sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        mainChat.classList.toggle('full-width');
        
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    }

    // Auto resize textarea
    document.getElementById('messageInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Initialize
    loadData();
</script>
</body>
</html>
    `);
});

// API endpoints
app.post('/api/chat/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        let output = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, error';
        res.json({ output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat/image', async (req, res) => {
    res.json({ output: "Fitur analisis gambar akan segera hadir!" });
});

app.post('/api/chat/document', async (req, res) => {
    res.json({ output: "Fitur analisis dokumen akan segera hadir!" });
});

app.post('/api/chat/audio', async (req, res) => {
    res.json({ output: "Fitur transkrip audio akan segera hadir!" });
});

app.get('/', (req, res) => {
    res.redirect('/chat');
});

export default app;