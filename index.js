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
            general: 'Kamu adalah AIBH, asisten AI yang ramah dan membantu. Jawab pertanyaan dengan akurat dan jelas.',
            javascript: 'Kamu adalah ahli JavaScript/TypeScript. Berikan kode yang clean dengan penjelasan.',
            python: 'Kamu adalah ahli Python. Berikan kode sesuai PEP 8 dengan docstring.',
            math: 'Kamu adalah ahli matematika. Selesaikan soal dengan langkah-langkah jelas.'
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

// Frontend
app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIBH - AI Profesional</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            height: 100vh;
            display: flex;
        }
        .sidebar {
            width: 280px;
            background: #0d0d0d;
            border-right: 1px solid #1f1f1f;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #1f1f1f;
        }
        .logo-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .logo-text h2 {
            font-size: 18px;
            background: linear-gradient(135deg, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .new-chat-btn {
            width: 100%;
            padding: 12px;
            background: #10a37f;
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .history-list {
            flex: 1;
            overflow-y: auto;
        }
        .history-item {
            padding: 10px;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 5px;
        }
        .history-item:hover {
            background: rgba(255,255,255,0.05);
        }
        .history-item.active {
            background: rgba(16,163,127,0.15);
            border-left: 3px solid #10a37f;
        }
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .mode-selector {
            padding: 15px 20px;
            border-bottom: 1px solid #1f1f1f;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .mode-btn {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid #1f1f1f;
            border-radius: 20px;
            color: #888;
            cursor: pointer;
        }
        .mode-btn.active {
            background: #10a37f;
            border-color: #10a37f;
            color: white;
        }
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .message {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .user-message .message-bubble {
            background: #2d2d2d;
            border-bottom-right-radius: 4px;
        }
        .ai-message .message-bubble {
            background: #1a1a1a;
            border: 1px solid #1f1f1f;
            border-bottom-left-radius: 4px;
        }
        .message-bubble {
            padding: 12px 16px;
            border-radius: 16px;
            line-height: 1.5;
        }
        .input-area {
            padding: 20px;
            border-top: 1px solid #1f1f1f;
        }
        .input-container {
            display: flex;
            gap: 12px;
            background: #111;
            border: 1px solid #1f1f1f;
            border-radius: 28px;
            padding: 8px 16px;
        }
        #messageInput {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            padding: 10px 0;
            outline: none;
        }
        #sendBtn {
            background: #10a37f;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
        }
        .typing-indicator {
            display: none;
            padding: 10px 20px;
            color: #888;
        }
        .typing-indicator.active {
            display: block;
        }
        @media (max-width: 768px) {
            .sidebar { display: none; }
        }
    </style>
</head>
<body>
    <div class="sidebar" id="sidebar">
        <div class="logo">
            <div class="logo-icon">A</div>
            <div class="logo-text"><h2>AIBH</h2></div>
        </div>
        <button class="new-chat-btn" onclick="newChat()">+ New Chat</button>
        <div class="history-list" id="historyList"></div>
    </div>
    <div class="main-chat">
        <div class="mode-selector" id="modeSelector">
            <button class="mode-btn active" data-mode="general" onclick="setMode('general')">General</button>
            <button class="mode-btn" data-mode="javascript" onclick="setMode('javascript')">JavaScript</button>
            <button class="mode-btn" data-mode="python" onclick="setMode('python')">Python</button>
            <button class="mode-btn" data-mode="math" onclick="setMode('math')">Math</button>
        </div>
        <div class="messages-container" id="messagesContainer">
            <div class="message ai-message">
                <div class="message-bubble">Halo! Saya AIBH. Ada yang bisa saya bantu?</div>
            </div>
        </div>
        <div class="typing-indicator" id="typingIndicator">AIBH sedang mengetik...</div>
        <div class="input-area">
            <div class="input-container">
                <textarea id="messageInput" placeholder="Ketik pesan..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){sendMessage();event.preventDefault();}"></textarea>
                <button id="sendBtn" onclick="sendMessage()">➤</button>
            </div>
        </div>
    </div>
    <script>
        let currentChatId = Date.now().toString();
        let chats = [{ id: currentChatId, date: new Date().toLocaleString(), messages: [] }];
        let currentMode = 'general';
        
        function loadChats() {
            const saved = localStorage.getItem('aibh_chats');
            if(saved) {
                chats = JSON.parse(saved);
                currentChatId = chats[0]?.id || Date.now().toString();
                renderHistory();
                loadMessages();
            } else {
                saveChats();
            }
        }
        
        function saveChats() {
            localStorage.setItem('aibh_chats', JSON.stringify(chats));
            renderHistory();
        }
        
        function renderHistory() {
            const container = document.getElementById('historyList');
            container.innerHTML = '';
            chats.forEach(chat => {
                const div = document.createElement('div');
                div.className = 'history-item' + (chat.id === currentChatId ? ' active' : '');
                const firstMsg = chat.messages.find(m => m.sender === 'user');
                const title = firstMsg ? firstMsg.text.substring(0, 30) : 'New Chat';
                div.innerHTML = '<div onclick="switchChat(\'' + chat.id + '\')">' + title + '<br><small style="font-size:10px;color:#666;">' + chat.date + '</small></div>';
                container.appendChild(div);
            });
        }
        
        function switchChat(id) {
            currentChatId = id;
            loadMessages();
            renderHistory();
        }
        
        function loadMessages() {
            const chat = chats.find(c => c.id === currentChatId);
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';
            if(chat && chat.messages) {
                chat.messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = 'message ' + (msg.sender === 'user' ? 'user-message' : 'ai-message');
                    div.innerHTML = '<div class="message-bubble">' + msg.text.replace(/\\n/g, '<br>') + '</div>';
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<div class="message ai-message"><div class="message-bubble">Halo! Saya AIBH. Ada yang bisa saya bantu?</div></div>';
            }
            container.scrollTop = container.scrollHeight;
        }
        
        function newChat() {
            currentChatId = Date.now().toString();
            chats.unshift({ id: currentChatId, date: new Date().toLocaleString(), messages: [] });
            saveChats();
            loadMessages();
        }
        
        function setMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.mode-btn[data-mode="' + mode + '"]').classList.add('active');
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if(!message) return;
            
            // Add user message
            const userDiv = document.createElement('div');
            userDiv.className = 'message user-message';
            userDiv.innerHTML = '<div class="message-bubble">' + message.replace(/\\n/g, '<br>') + '</div>';
            document.getElementById('messagesContainer').appendChild(userDiv);
            input.value = '';
            
            // Save to chat
            const chat = chats.find(c => c.id === currentChatId);
            if(chat) chat.messages.push({ sender: 'user', text: message, time: new Date().toLocaleTimeString() });
            saveChats();
            
            // Show typing
            document.getElementById('typingIndicator').classList.add('active');
            
            try {
                const response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message, mode: currentMode })
                });
                const data = await response.json();
                const aiText = data.output || 'Maaf, terjadi kesalahan.';
                
                // Add AI message
                const aiDiv = document.createElement('div');
                aiDiv.className = 'message ai-message';
                aiDiv.innerHTML = '<div class="message-bubble">' + aiText.replace(/\\n/g, '<br>') + '</div>';
                document.getElementById('messagesContainer').appendChild(aiDiv);
                
                // Save to chat
                if(chat) chat.messages.push({ sender: 'ai', text: aiText, time: new Date().toLocaleTimeString() });
                saveChats();
                
                document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
            } catch(error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message ai-message';
                errorDiv.innerHTML = '<div class="message-bubble">Error: ' + error.message + '</div>';
                document.getElementById('messagesContainer').appendChild(errorDiv);
            } finally {
                document.getElementById('typingIndicator').classList.remove('active');
            }
        }
        
        loadChats();
    </script>
</body>
</html>
    `);
});

app.get('/', (req, res) => { res.redirect('/chat'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('AIBH running on http://localhost:' + PORT);
});

export default app;