import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Halaman chat
app.get('/chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hasan AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: #1a1a1a;
            padding: 16px 20px;
            border-bottom: 1px solid #333;
        }
        .header h1 { font-size: 20px; color: #10a37f; }
        .header p { font-size: 12px; color: #888; margin-top: 4px; }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .message {
            margin-bottom: 16px;
            padding: 12px 16px;
            border-radius: 12px;
            max-width: 85%;
        }
        .user {
            background: #10a37f;
            margin-left: auto;
            text-align: right;
        }
        .ai {
            background: #1a1a1a;
            border: 1px solid #333;
        }
        .input-area {
            padding: 16px 20px;
            background: #1a1a1a;
            border-top: 1px solid #333;
            display: flex;
            gap: 12px;
        }
        .input-area input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #333;
            border-radius: 24px;
            background: #0a0a0a;
            color: #fff;
            outline: none;
        }
        .input-area button {
            padding: 12px 20px;
            background: #10a37f;
            border: none;
            border-radius: 24px;
            color: white;
            cursor: pointer;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 10px;
            color: #888;
        }
        .time {
            font-size: 10px;
            color: #666;
            margin-top: 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Hasan AI</h1>
        <p>Gemini 2.5 Flash • Personal Assistant</p>
    </div>
    <div class="messages" id="messages">
        <div class="message ai">
            Halo! Saya Hasan AI. Ada yang bisa saya bantu?
            <div class="time" id="welcomeTime"></div>
        </div>
    </div>
    <div class="loading" id="loading">🤖 Hasan AI sedang mengetik...</div>
    <div class="input-area">
        <input type="text" id="input" placeholder="Ketik pesan..." onkeypress="if(event.key==='Enter') sendMessage()">
        <button onclick="sendMessage()">Kirim</button>
    </div>

    <script>
        document.getElementById('welcomeTime').textContent = new Date().toLocaleTimeString();
        
        async function sendMessage() {
            const input = document.getElementById('input');
            const message = input.value.trim();
            if (!message) return;
            
            // Tampilkan pesan user
            addMessage(message, 'user');
            input.value = '';
            
            // Loading
            document.getElementById('loading').style.display = 'block';
            
            try {
                const response = await fetch('/api/chat/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message })
                });
                const data = await response.json();
                addMessage(data.output || 'Maaf, terjadi kesalahan.', 'ai');
            } catch (error) {
                addMessage('Error: ' + error.message, 'ai');
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }
        
        function addMessage(text, sender) {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + sender;
            div.innerHTML = text + '<div class="time">' + new Date().toLocaleTimeString() + '</div>';
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
    </script>
</body>
</html>
    `);
});

// API endpoint
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

// Redirect root ke chat
app.get('/', (req, res) => {
    res.redirect('/chat');
});

export default app;