// ============================================
// HASAN AI - VERCEL COMPATIBLE VERSION
// ============================================

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function
function extractText(resp) {
    try {
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.response.candidates[0].content.parts[0].text;
        }
        if (resp?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.candidates[0].content.parts[0].text;
        }
        return "Maaf, saya tidak bisa memproses permintaan ini.";
    } catch (err) {
        return "Terjadi kesalahan.";
    }
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. Text Chat
app.post('/api/chat/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
        }
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Image Analysis
app.post('/api/chat/image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'File gambar diperlukan' });
        }
        
        const base64Data = file.buffer.toString('base64');
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Jelaskan gambar ini secara detail dalam bahasa Indonesia' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Document Analysis
app.post('/api/chat/document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'File dokumen diperlukan' });
        }
        
        const base64Data = file.buffer.toString('base64');
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || `Ringkas dokumen berikut: ${file.originalname} dalam bahasa Indonesia` },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Audio Transcription
app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'File audio diperlukan' });
        }
        
        const base64Data = file.buffer.toString('base64');
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Transkripsikan audio ini ke teks dalam bahasa Indonesia' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ]
        });
        
        res.json({ output: extractText(response) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Route untuk text generate (backward compatibility)
app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt required' });
        }
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        
        res.json({ output: extractText(response) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CHAT INTERFACE (HTML)
// ============================================

app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hasan AI - Personal Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f7f7f8;
            --text-primary: #1f1f1f;
            --text-secondary: #6e6e6e;
            --border-color: #e5e5e5;
            --user-bg: #e9ecef;
            --accent: #10a37f;
        }
        
        body.dark {
            --bg-primary: #1e1e2e;
            --bg-secondary: #181825;
            --text-primary: #cdd6f4;
            --text-secondary: #a6adc8;
            --border-color: #313244;
            --user-bg: #313244;
            --accent: #89b4fa;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-secondary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
            transition: all 0.3s;
        }
        
        .header {
            background: var(--bg-primary);
            border-bottom: 1px solid var(--border-color);
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #10a37f, #1a7f64);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
        }
        
        .logo h1 {
            font-size: 18px;
            font-weight: 600;
        }
        
        .model-badge {
            background: var(--bg-secondary);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            color: var(--accent);
        }
        
        .theme-btn {
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
        }
        
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
        }
        
        .message {
            display: flex;
            gap: 12px;
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
            font-size: 11px;
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 6px;
        }
        
        .input-area {
            padding: 20px 24px;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-color);
        }
        
        .input-wrapper {
            max-width: 900px;
            margin: 0 auto;
        }
        
        .input-container {
            display: flex;
            gap: 12px;
            align-items: flex-end;
            background: var(--bg-secondary);
            border-radius: 24px;
            padding: 8px 16px;
            border: 1px solid var(--border-color);
        }
        
        .input-container:focus-within {
            border-color: var(--accent);
        }
        
        .action-btn {
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            color: var(--text-secondary);
        }
        
        .action-btn:hover {
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
            color: white;
        }
        
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: var(--bg-secondary);
            border-radius: 20px;
            width: fit-content;
            margin: 0 auto 16px;
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
        
        @media (max-width: 768px) {
            .messages-container { padding: 16px; }
            .user-message .message-content { max-width: 95%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">🧠</div>
            <h1>Hasan AI</h1>
        </div>
        <div class="model-badge">Gemini 2.5 Flash</div>
        <button class="theme-btn" onclick="toggleTheme()">🌙</button>
    </div>
    
    <div class="messages-container" id="messagesContainer">
        <div class="message ai-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                Halo! Saya <strong>Hasan AI</strong>, asisten pribadi Anda.<br><br>
                Saya bisa:<br>
                • 💬 Chat teks<br>
                • 🖼️ Analisis gambar<br>
                • 📄 Baca dokumen<br>
                • 🎵 Transkrip audio<br><br>
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
        <div class="input-wrapper">
            <div class="input-container">
                <div class="action-btn" onclick="document.getElementById('fileInput').click()">📎</div>
                <textarea 
                    id="messageInput" 
                    placeholder="Ketik pesan atau upload file..."
                    rows="1"
                    onkeydown="handleEnter(event)"
                ></textarea>
                <button id="sendBtn" onclick="sendMessage()">➤</button>
            </div>
        </div>
    </div>
    
    <input type="file" id="fileInput" style="display: none" onchange="handleFileSelect(this)">
    
    <script>
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const typingIndicator = document.getElementById('typingIndicator');
        let selectedFile = null;
        
        document.getElementById('welcomeTime').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        function getTime() {
            return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        
        function autoResize() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        }
        
        messageInput.addEventListener('input', autoResize);
        
        function handleFileSelect(input) {
            selectedFile = input.files[0];
            if (selectedFile) {
                addMessage(\`📎 Upload: \${selectedFile.name} (size: \${(selectedFile.size/1024).toFixed(1)} KB)\`, 'user');
                sendMessageWithFile();
            }
        }
        
        async function sendMessageWithFile() {
            if (!selectedFile) return;
            
            typingIndicator.classList.add('active');
            
            const formData = new FormData();
            let endpoint = '/api/chat/image';
            
            if (selectedFile.type.startsWith('image/')) {
                endpoint = '/api/chat/image';
            } else if (selectedFile.type.startsWith('audio/')) {
                endpoint = '/api/chat/audio';
            } else {
                endpoint = '/api/chat/document';
            }
            
            formData.append(endpoint === '/api/chat/image' ? 'image' : (endpoint === '/api/chat/audio' ? 'audio' : 'document'), selectedFile);
            formData.append('prompt', messageInput.value.trim() || 'Analisis file ini');
            
            try {
                const response = await fetch(endpoint, { method: 'POST', body: formData });
                const data = await response.json();
                addMessage(data.output || 'Maaf, terjadi kesalahan.', 'ai');
            } catch (error) {
                addMessage('❌ Error: ' + error.message, 'ai');
            } finally {
                typingIndicator.classList.remove('active');
                selectedFile = null;
                document.getElementById('fileInput').value = '';
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message && !selectedFile) return;
            
            if (selectedFile) {
                sendMessageWithFile();
                return;
            }
            
            addMessage(message, 'user');
            messageInput.value = '';
            messageInput.style.height = 'auto';
            typingIndicator.classList.add('active');
            
            try {
                const response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message })
                });
                const data = await response.json();
                addMessage(data.output || 'Maaf, terjadi kesalahan.', 'ai');
            } catch (error) {
                addMessage('❌ Error: ' + error.message, 'ai');
            } finally {
                typingIndicator.classList.remove('active');
            }
        }
        
        function addMessage(text, sender) {
            const div = document.createElement('div');
            div.className = \`message \${sender === 'user' ? 'user-message' : 'ai-message'}\`;
            div.innerHTML = \`
                <div class="message-avatar">\${sender === 'user' ? '👤' : '🤖'}</div>
                <div class="message-content">
                    \${text.replace(/\\n/g, '<br>')}
                    <div class="message-time">\${getTime()}</div>
                    <button class="copy-btn" onclick="copyText(this)">📋 Copy</button>
                </div>
            \`;
            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function copyText(btn) {
            const text = btn.parentElement.children[0].innerText;
            navigator.clipboard.writeText(text);
            btn.textContent = '✅ Tersalin';
            setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
        }
        
        function handleEnter(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }
        
        function toggleTheme() {
            document.body.classList.toggle('dark');
            const btn = document.querySelector('.theme-btn');
            btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
        }
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
            document.querySelector('.theme-btn').textContent = '☀️';
        }
    </script>
</body>
</html>
    `);
});

app.get('/', (req, res) => {
    res.redirect('/chat');
});

// ============================================
// EXPORT FOR VERCEL (WAJIB!)
// ============================================

export default app;