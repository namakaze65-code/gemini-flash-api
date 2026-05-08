import express from 'express';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import path from 'path';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

// ============================================
// HELPER: Extract Text dari Response
// ============================================
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
        return "Terjadi kesalahan pada server.";
    }
}

// ============================================
// FUNCTION: Generate dengan Parameter Gemini
// ============================================
async function generateWithConfig(prompt, systemInstruction, options = {}) {
    const {
        temperature = 0.7,
        top_k = 40,
        top_p = 0.95,
        maxOutputTokens = 2048
    } = options;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            temperature: temperature,
            topK: top_k,
            topP: top_p,
            maxOutputTokens: maxOutputTokens,
            systemInstruction: systemInstruction
        }
    });
    return extractText(response);
}

// ============================================
// API ENDPOINT: Chat dengan Parameter Lengkap
// ============================================
app.post('/api/chat/text', async (req, res) => {
    try {
        const { 
            prompt, 
            mode = 'fast',
            temperature,
            top_k,
            top_p,
            history = [] 
        } = req.body;
        
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        
        // System Instructions per mode (Sesi 3 - Halaman 21-22)
        const systemInstructions = {
            fast: {
                instruction: `Kamu adalah AIBH (Artificial Intelligence Brain of Hasan), asisten AI yang responsif dan ramah. 
Gunakan bahasa Indonesia yang santai dan mudah dipahami. 
Berikan jawaban singkat, langsung ke poin, dan hindari informasi yang berlebihan.
Jangan pernah memberikan nasihat medis, hukum, atau keuangan.`,
                temperature: 0.7,
                top_k: 40,
                top_p: 0.95
            },
            expert: {
                instruction: `Kamu adalah AIBH dalam mode PAKAR. Berikan analisis mendalam dengan pendekatan akademis.
Gunakan bahasa Indonesia formal, sertakan penjelasan yang detail dan terstruktur.
Jika memungkinkan, berikan contoh atau referensi.
Jangan pernah memberikan informasi yang tidak akurat.`,
                temperature: 0.3,
                top_k: 30,
                top_p: 0.85
            },
            vision: {
                instruction: `Kamu adalah AIBH dalam mode PENGliHATAN. Fokus pada analisis visual dan deskripsi gambar.
Berikan deskripsi yang detail, akurat, dan informatif tentang gambar yang diupload.
Jelaskan warna, objek, suasana, dan konteks gambar.`,
                temperature: 0.5,
                top_k: 35,
                top_p: 0.9
            },
            deep: {
                instruction: `Kamu adalah AIBH dalam mode PIKIR MENDALAM. Pecah masalah menjadi langkah-langkah logis.
Gunakan pendekatan chain-of-thought untuk menjelaskan proses berpikir.
Tampilkan analisis bertahap sebelum memberikan kesimpulan.`,
                temperature: 0.4,
                top_k: 25,
                top_p: 0.88
            },
            search: {
                instruction: `Kamu adalah AIBH dalam mode CARI. Prioritaskan akurasi informasi dan sumber terpercaya.
Berikan jawaban berdasarkan pengetahuan yang valid.
Jika tidak yakin, katakan "Saya tidak yakin dengan informasi tersebut".
Gunakan bahasa Indonesia yang jelas dan informatif.`,
                temperature: 0.2,
                top_k: 20,
                top_p: 0.8
            }
        };
        
        const config = systemInstructions[mode] || systemInstructions.fast;
        
        // Override dengan parameter custom jika dikirim
        const finalTemp = temperature !== undefined ? temperature : config.temperature;
        const finalTopK = top_k !== undefined ? top_k : config.top_k;
        const finalTopP = top_p !== undefined ? top_p : config.top_p;
        
        // Buat prompt dengan history (multi-turn conversation)
        let fullPrompt = prompt;
        if (history && history.length > 0) {
            const historyText = history.map(msg => 
                `${msg.role === 'user' ? 'Pengguna' : 'AIBH'}: ${msg.content}`
            ).join('\n');
            fullPrompt = `Riwayat percakapan:\n${historyText}\n\nPertanyaan terbaru: ${prompt}`;
        }
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: fullPrompt,
            config: {
                temperature: finalTemp,
                topK: finalTopK,
                topP: finalTopP,
                maxOutputTokens: 2048,
                systemInstruction: config.instruction
            }
        });
        
        const output = extractText(response);
        
        res.json({ 
            output: output,
            config: {
                mode: mode,
                temperature: finalTemp,
                top_k: finalTopK,
                top_p: finalTopP
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// API ENDPOINT: Chat dengan Gambar (Upload File)
// ============================================
app.post('/api/chat/image', upload.single('image'), async (req, res) => {
    try {
        const { prompt, mode = 'vision' } = req.body;
        const file = req.file;
        
        if (!file) return res.status(400).json({ error: 'File gambar diperlukan' });
        
        // System instruction untuk vision mode
        const visionInstruction = `Kamu adalah AIBH (Artificial Intelligence Brain of Hasan) dalam mode PENGliHATAN.
Tugas kamu adalah menganalisis gambar yang diupload pengguna.
Berikan deskripsi yang detail tentang gambar tersebut, termasuk:
- Objek apa saja yang terlihat
- Warna dominan
- Suasana atau mood gambar
- Konteks atau kemungkinan lokasi
Gunakan bahasa Indonesia yang informatif dan mudah dipahami.`;
        
        const base64Data = file.buffer.toString('base64');
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Analisis gambar ini secara detail.' },
                { inlineData: { data: base64Data, mimeType: file.mimetype } }
            ],
            config: {
                temperature: 0.5,
                topK: 35,
                topP: 0.9,
                maxOutputTokens: 2048,
                systemInstruction: visionInstruction
            }
        });
        
        res.json({ output: extractText(response) });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// API ENDPOINT: Chat dengan Dokumen
// ============================================
app.post('/api/chat/document', upload.single('document'), async (req, res) => {
    try {
        const { prompt, mode = 'expert' } = req.body;
        const file = req.file;
        
        if (!file) return res.status(400).json({ error: 'File dokumen diperlukan' });
        
        const docInstruction = `Kamu adalah AIBH (Artificial Intelligence Brain of Hasan) dalam mode PAKAR.
Tugas kamu adalah menganalisis dokumen yang diupload pengguna.
Baca dan pahami isi dokumen, lalu berikan:
1. Ringkasan singkat dari dokumen tersebut
2. Poin-poin penting yang perlu diketahui
3. Analisis atau kesimpulan jika relevan
Gunakan bahasa Indonesia yang formal dan terstruktur.`;
        
        const base64Data = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Analisis dokumen ini: berikan ringkasan dan poin-poin penting.' },
                { inlineData: { data: base64Data, mimeType } }
            ],
            config: {
                temperature: 0.3,
                topK: 30,
                topP: 0.85,
                maxOutputTokens: 4096,
                systemInstruction: docInstruction
            }
        });
        
        res.json({ output: extractText(response) });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// API ENDPOINT: Chat dengan Audio
// ============================================
app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt, mode = 'search' } = req.body;
        const file = req.file;
        
        if (!file) return res.status(400).json({ error: 'File audio diperlukan' });
        
        const audioInstruction = `Kamu adalah AIBH (Artificial Intelligence Brain of Hasan).
Tugas kamu adalah mentranskripsikan audio yang diupload pengguna.
Dengarkan audio dengan seksama, lalu:
1. Tuliskan transkrip teks dari audio tersebut
2. Jika ada informasi penting, catat sebagai poin terpisah
3. Berikan ringkasan singkat dari isi audio
Gunakan bahasa Indonesia yang jelas dan akurat.`;
        
        const base64Data = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Transkripsikan audio ini ke dalam teks.' },
                { inlineData: { data: base64Data, mimeType } }
            ],
            config: {
                temperature: 0.2,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 4096,
                systemInstruction: audioInstruction
            }
        });
        
        res.json({ output: extractText(response) });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// FRONTEND - CHAT INTERFACE (AIBH)
// ============================================

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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg-dark: #0a0a0a;
            --bg-card: #111111;
            --bg-sidebar: #0d0d0d;
            --border: #1f1f1f;
            --primary: #10a37f;
            --primary-dark: #0d8a6b;
            --secondary: #3b82f6;
            --text: #e5e5e5;
            --text-dim: #6b7280;
            --user-bg: #2d2d2d;
            --ai-bg: #1a1a1a;
        }
        body { font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text); height: 100vh; overflow: hidden; }
        .app { display: flex; height: 100vh; position: relative; }
        
        /* Sidebar */
        .sidebar { width: 280px; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.3s; z-index: 100; }
        .sidebar.collapsed { transform: translateX(-280px); position: fixed; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid var(--border); }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: white; }
        .logo-text h2 { font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #fff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-text p { font-size: 10px; color: var(--text-dim); }
        .new-chat-btn { width: 100%; padding: 12px; background: var(--primary); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; transition: all 0.2s; }
        .new-chat-btn:hover { background: var(--primary-dark); transform: translateY(-1px); }
        .history-section { flex: 1; overflow-y: auto; padding: 0 12px; }
        .history-title { font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; padding: 12px 8px 8px; }
        .history-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; cursor: pointer; margin-bottom: 4px; }
        .history-item:hover { background: rgba(255,255,255,0.05); }
        .history-item.active { background: rgba(16,163,127,0.15); border-left: 3px solid var(--primary); }
        .history-content { flex: 1; overflow: hidden; }
        .history-title-text { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-date { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
        .delete-history { background: transparent; border: none; color: var(--text-dim); cursor: pointer; padding: 6px; border-radius: 6px; opacity: 0; transition: all 0.2s; }
        .history-item:hover .delete-history { opacity: 1; }
        .delete-history:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .clear-history { margin: 12px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; }
        .clear-history:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
        
        /* Sidebar Toggle */
        .sidebar-toggle { position: absolute; left: 280px; top: 20px; width: 30px; height: 30px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 101; transition: all 0.3s; }
        .sidebar-toggle.collapsed { left: 20px; }
        
        /* Main Chat */
        .main-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-dark); }
        
        /* Mode Selector */
        .mode-selector { padding: 16px 24px; border-bottom: 1px solid var(--border); background: var(--bg-dark); overflow-x: auto; white-space: nowrap; }
        .mode-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .mode-btn { padding: 8px 18px; background: transparent; border: 1px solid var(--border); border-radius: 30px; color: var(--text-dim); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .mode-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
        .mode-btn:hover:not(.active) { background: rgba(255,255,255,0.05); border-color: var(--primary); color: var(--primary); }
        .mode-desc { font-size: 11px; color: var(--text-dim); margin-top: 10px; }
        
        /* Parameter Display */
        .param-display { margin-top: 8px; font-size: 10px; color: var(--text-dim); display: flex; gap: 12px; flex-wrap: wrap; }
        .param-tag { background: rgba(16,163,127,0.1); padding: 2px 8px; border-radius: 12px; }
        
        /* Messages */
        .messages-container { flex: 1; overflow-y: auto; padding: 24px; }
        .messages-container::-webkit-scrollbar { width: 5px; }
        .messages-container::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
        .message { display: flex; gap: 14px; margin-bottom: 24px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .user-message .message-avatar { background: linear-gradient(135deg, #667eea, #764ba2); }
        .ai-message .message-avatar { background: var(--primary); }
        .message-content { flex: 1; }
        .message-bubble { padding: 12px 16px; border-radius: 18px; line-height: 1.6; font-size: 14px; }
        .user-message .message-bubble { background: var(--user-bg); border-bottom-right-radius: 6px; }
        .ai-message .message-bubble { background: var(--ai-bg); border: 1px solid var(--border); border-bottom-left-radius: 6px; }
        .message-time { font-size: 10px; color: var(--text-dim); margin-top: 6px; }
        
        /* Empty State */
        .empty-state { text-align: center; padding: 60px 20px; }
        .empty-icon { font-size: 64px; margin-bottom: 20px; }
        .empty-state h3 { font-size: 20px; margin-bottom: 10px; }
        .empty-state p { color: var(--text-dim); font-size: 14px; }
        
        /* Typing Indicator */
        .typing-indicator { display: none; align-items: center; gap: 12px; padding: 12px 16px; background: var(--ai-bg); border: 1px solid var(--border); border-radius: 20px; width: fit-content; margin-bottom: 16px; }
        .typing-indicator.active { display: flex; }
        .typing-dots { display: flex; gap: 6px; }
        .typing-dots span { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: typingAnim 1.4s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingAnim { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-8px); opacity: 1; } }
        
        /* Input Area */
        .input-area { padding: 20px 24px 24px; border-top: 1px solid var(--border); background: var(--bg-dark); }
        .input-wrapper { max-width: 900px; margin: 0 auto; }
        .input-container { display: flex; align-items: flex-end; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px; padding: 8px 12px 8px 18px; transition: all 0.2s; }
        .input-container:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(16,163,127,0.1); }
        .input-actions { display: flex; gap: 6px; }
        .action-btn { background: transparent; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: var(--text-dim); font-size: 16px; transition: all 0.2s; }
        .action-btn:hover { background: rgba(255,255,255,0.05); color: var(--primary); }
        #messageInput { flex: 1; background: transparent; border: none; padding: 12px 0; color: var(--text); font-size: 14px; outline: none; resize: none; font-family: 'Inter', sans-serif; max-height: 120px; }
        #messageInput::placeholder { color: var(--text-dim); }
        #sendBtn { width: 38px; height: 38px; background: var(--primary); border: none; border-radius: 50%; cursor: pointer; color: white; font-size: 14px; transition: all 0.2s; }
        #sendBtn:hover { transform: scale(1.05); background: var(--primary-dark); }
        #sendBtn:disabled { opacity: 0.5; transform: none; }
        
        /* File Preview */
        .file-preview { display: none; margin-bottom: 12px; padding: 8px 16px; background: rgba(16,163,127,0.1); border-radius: 14px; align-items: center; gap: 12px; width: fit-content; }
        .file-preview.active { display: flex; }
        .file-preview img { width: 32px; height: 32px; border-radius: 8px; }
        .remove-file { background: rgba(239,68,68,0.2); border: none; padding: 4px 10px; border-radius: 8px; color: #fca5a5; cursor: pointer; font-size: 11px; }
        
        /* Mobile Menu */
        .mobile-menu-btn { display: none; position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: var(--primary); border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; z-index: 200; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        @media (max-width: 768px) { .sidebar { position: fixed; height: 100%; z-index: 200; transform: translateX(-280px); } .sidebar.mobile-open { transform: translateX(0); } .sidebar-toggle { left: 20px; top: 16px; } .mode-selector { padding: 12px 16px; } .messages-container { padding: 16px; } .input-area { padding: 12px 16px 20px; } .mobile-menu-btn { display: flex; } .mode-btn { padding: 6px 12px; font-size: 11px; } }
    </style>
</head>
<body>
<div class="app">
    <div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()"><i class="fas fa-chevron-left" style="font-size: 12px;"></i></div>
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo"><div class="logo-icon">A</div><div class="logo-text"><h2>AIBH</h2><p>Artificial Intelligence Brain of Hasan</p></div></div>
            <button class="new-chat-btn" onclick="newChat()"><i class="fas fa-plus"></i> New Chat</button>
        </div>
        <div class="history-section"><div class="history-title">Recent Chats</div><div class="history-list" id="historyList"><div style="padding:20px;text-align:center;color:#666;font-size:12px;">Belum ada chat</div></div></div>
        <button class="clear-history" onclick="clearAllHistory()"><i class="fas fa-trash-alt"></i> Clear History</button>
    </div>
    <div class="main-chat">
        <div class="mode-selector">
            <div class="mode-buttons">
                <button class="mode-btn active" data-mode="fast" onclick="setMode('fast')"><i class="fas fa-bolt"></i> Cepat</button>
                <button class="mode-btn" data-mode="expert" onclick="setMode('expert')"><i class="fas fa-graduation-cap"></i> Pakar</button>
                <button class="mode-btn" data-mode="vision" onclick="setMode('vision')"><i class="fas fa-eye"></i> Penglihatan</button>
                <button class="mode-btn" data-mode="deep" onclick="setMode('deep')"><i class="fas fa-brain"></i> Pikir Mendalam</button>
                <button class="mode-btn" data-mode="search" onclick="setMode('search')"><i class="fas fa-search"></i> Cari</button>
            </div>
            <div class="mode-desc" id="modeDesc">⚡ Cocok untuk percakapan sehari-hari, respons instan.</div>
            <div class="param-display" id="paramDisplay"></div>
        </div>
        <div class="messages-container" id="messagesContainer">
            <div class="empty-state"><div class="empty-icon">🧠</div><h3>AIBH - Artificial Intelligence Brain of Hasan</h3><p>Asisten AI cerdas dengan parameter Gemini (temperature, top_k, top_p) yang bisa diatur</p></div>
        </div>
        <div class="typing-indicator" id="typingIndicator"><div class="typing-dots"><span></span><span></span><span></span></div><span style="font-size:13px;color:#888;">AIBH sedang berpikir...</span></div>
        <div class="input-area">
            <div class="file-preview" id="filePreview"><img id="previewImg" src=""><span id="fileName"></span><button class="remove-file" onclick="clearFile()">✕</button></div>
            <div class="input-wrapper">
                <div class="input-container">
                    <div class="input-actions">
                        <button class="action-btn" onclick="triggerFileUpload('image')" title="Upload Gambar"><i class="fas fa-image"></i></button>
                        <button class="action-btn" onclick="triggerFileUpload('document')" title="Upload Dokumen"><i class="fas fa-file-pdf"></i></button>
                        <button class="action-btn" onclick="triggerFileUpload('audio')" title="Upload Audio"><i class="fas fa-microphone"></i></button>
                    </div>
                    <textarea id="messageInput" placeholder="Ketik pesan atau upload file..." rows="1" onkeydown="handleEnter(event)"></textarea>
                    <button id="sendBtn" onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="mobile-menu-btn" id="mobileMenuBtn" onclick="openMobileMenu()"><i class="fas fa-bars" style="color:white;font-size:20px;"></i></div>

<input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleFileSelect('image', this)">
<input type="file" id="documentInput" accept=".pdf,.txt,.docx,.doc" style="display:none" onchange="handleFileSelect('document', this)">
<input type="file" id="audioInput" accept="audio/*" style="display:none" onchange="handleFileSelect('audio', this)">

<script>
    let currentChatId = null, chats = [], currentMessages = [], currentFile = null, currentFileType = null, currentMode = 'fast';
    
    const modeParams = {
        fast: { temp: 0.7, top_k: 40, top_p: 0.95, desc: '⚡ Respons instan, kreatif & ramah' },
        expert: { temp: 0.3, top_k: 30, top_p: 0.85, desc: '🎓 Analisis mendalam, formal & terstruktur' },
        vision: { temp: 0.5, top_k: 35, top_p: 0.9, desc: '👁️ Fokus analisis visual & detail gambar' },
        deep: { temp: 0.4, top_k: 25, top_p: 0.88, desc: '🧠 Pemikiran bertahap, logis & analitis' },
        search: { temp: 0.2, top_k: 20, top_p: 0.8, desc: '🔍 Akurat, faktual & informatif' }
    };
    
    function loadData() {
        const saved = localStorage.getItem('aibh_chats');
        if(saved) { chats = JSON.parse(saved); renderHistory(); const lastId = localStorage.getItem('aibh_current_id'); if(lastId && chats.find(c=>c.id===lastId)) loadChat(lastId); else if(chats.length>0) loadChat(chats[0].id); else newChat(); }
        else newChat();
        updateParamDisplay();
    }
    function saveData() { localStorage.setItem('aibh_chats', JSON.stringify(chats)); if(currentChatId) localStorage.setItem('aibh_current_id', currentChatId); renderHistory(); }
    function renderHistory() {
        const container = document.getElementById('historyList');
        if(chats.length===0) { container.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:12px;">Belum ada chat</div>'; return; }
        container.innerHTML='';
        chats.forEach(chat=>{
            const div=document.createElement('div'); div.className='history-item'; if(chat.id===currentChatId) div.classList.add('active');
            const firstMsg=chat.messages.find(m=>m.sender==='user'); const title=firstMsg?(firstMsg.text.substring(0,35)+(firstMsg.text.length>35?'...':'')):'New Chat';
            div.innerHTML=\`<div class="history-content" onclick="loadChat('\${chat.id}')"><div class="history-title-text">\${escapeHtml(title)}</div><div class="history-date">\${chat.date}</div></div><button class="delete-history" onclick="deleteChat('\${chat.id}', event)"><i class="fas fa-trash"></i></button>\`;
            container.appendChild(div);
        });
    }
    function escapeHtml(t){ const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
    function newChat(){ const nId=Date.now().toString(); chats.unshift({id:nId,date:new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),messages:[]}); currentChatId=nId; currentMessages=[]; saveData(); renderMessages(); }
    function loadChat(id){ const c=chats.find(c=>c.id===id); if(!c) return; currentChatId=id; currentMessages=[...c.messages]; renderMessages(); saveData(); if(window.innerWidth<=768) document.getElementById('sidebar').classList.remove('mobile-open'); }
    function deleteChat(id,e){ e.stopPropagation(); if(confirm('Hapus chat ini?')){ const i=chats.findIndex(c=>c.id===id); if(i!==-1){ chats.splice(i,1); if(chats.length>0) loadChat(chats[0].id); else newChat(); saveData(); } } }
    function clearAllHistory(){ if(confirm('Hapus semua riwayat chat?')){ chats=[]; newChat(); saveData(); } }
    function renderMessages(){
        const c=document.getElementById('messagesContainer');
        if(currentMessages.length===0){ c.innerHTML='<div class="empty-state"><div class="empty-icon">🧠</div><h3>AIBH - Artificial Intelligence Brain of Hasan</h3><p>Asisten AI cerdas dengan parameter Gemini (temperature, top_k, top_p) yang bisa diatur</p></div>'; return; }
        c.innerHTML='';
        currentMessages.forEach(m=>{
            const d=document.createElement('div'); d.className=\`message \${m.sender==='user'?'user-message':'ai-message'}\`;
            d.innerHTML=\`<div class="message-avatar">\${m.sender==='user'?'<i class="fas fa-user"></i>':'<i class="fas fa-brain"></i>'}</div><div class="message-content"><div class="message-bubble">\${m.text.replace(/\\n/g,'<br>')}</div><div class="message-time">\${m.time}</div></div>\`;
            c.appendChild(d);
        });
        c.scrollTop=c.scrollHeight;
    }
    function addMessage(t,s){ const m={id:Date.now(),text:t,sender:s,time:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}; currentMessages.push(m); const ci=chats.findIndex(c=>c.id===currentChatId); if(ci!==-1) chats[ci].messages=[...currentMessages]; saveData(); renderMessages(); }
    function setMode(m){ currentMode=m; document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active')); document.querySelector(\`.mode-btn[data-mode="\${m}"]\`).classList.add('active'); document.getElementById('modeDesc').textContent=modeParams[m].desc; updateParamDisplay(); }
    function updateParamDisplay(){ const p=modeParams[currentMode]; document.getElementById('paramDisplay').innerHTML=\`<span class="param-tag">🌡️ Temperature: \${p.temp}</span><span class="param-tag">📊 Top-k: \${p.top_k}</span><span class="param-tag">🎯 Top-p: \${p.top_p}</span>\`; }
    function triggerFileUpload(t){ if(t==='image') document.getElementById('imageInput').click(); else if(t==='document') document.getElementById('documentInput').click(); else if(t==='audio') document.getElementById('audioInput').click(); }
    function handleFileSelect(t,i){ const f=i.files[0]; if(!f) return; currentFile=f; currentFileType=t; const p=document.getElementById('filePreview'), pr=document.getElementById('previewImg'), fn=document.getElementById('fileName'); if(t==='image'){ const r=new FileReader(); r.onload=(e)=>{ pr.src=e.target.result; }; r.readAsDataURL(f); } fn.textContent=f.name; p.classList.add('active'); }
    function clearFile(){ currentFile=null; currentFileType=null; document.getElementById('filePreview').classList.remove('active'); document.getElementById('imageInput').value=''; document.getElementById('documentInput').value=''; document.getElementById('audioInput').value=''; }
    async function sendMessage(){
        const i=document.getElementById('messageInput'); const m=i.value.trim();
        if(!m && !currentFile) return;
        let ut=m||(currentFile?\`📎 \${currentFile.name}\`:'');
        addMessage(ut,'user');
        i.value=''; i.style.height='auto';
        const t=document.getElementById('typingIndicator'), sb=document.getElementById('sendBtn');
        t.classList.add('active'); sb.disabled=true;
        try{
            let r;
            if(currentFile){
                const fd=new FormData(); let ep='';
                if(currentFileType==='image') ep='/api/chat/image';
                else if(currentFileType==='document') ep='/api/chat/document';
                else ep='/api/chat/audio';
                fd.append(currentFileType,currentFile); if(m) fd.append('prompt',m);
                r=await fetch(ep,{method:'POST',body:fd});
                clearFile();
            }else{
                const history=currentMessages.slice(-6).filter(msg=>msg.sender!=='system').map(msg=>({role:msg.sender==='user'?'user':'model',content:msg.text}));
                r=await fetch('/api/chat/text',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:m,mode:currentMode,history:history})});
            }
            const d=await r.json();
            addMessage(d.output||'Maaf, terjadi kesalahan.','ai');
        }catch(e){ addMessage('❌ Error: '+e.message,'ai'); }
        finally{ t.classList.remove('active'); sb.disabled=false; }
    }
    function handleEnter(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }
    function toggleSidebar(){ const s=document.getElementById('sidebar'), tb=document.getElementById('sidebarToggle'); s.classList.toggle('collapsed'); tb.classList.toggle('collapsed'); }
    function openMobileMenu(){ document.getElementById('sidebar').classList.toggle('mobile-open'); }
    document.getElementById('messageInput').addEventListener('input',function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,100)+'px'; });
    document.addEventListener('click',function(e){ if(window.innerWidth<=768){ const s=document.getElementById('sidebar'), mb=document.getElementById('mobileMenuBtn'); if(!s.contains(e.target) && !mb.contains(e.target)) s.classList.remove('mobile-open'); } });
    loadData(); setMode('fast');
</script>
</body>
</html>
    `);
});

app.get('/', (req, res) => { res.redirect('/chat'); });

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║     🧠 AIBH - Artificial Intelligence Brain of Hasan  ║');
    console.log('║              Full Compliance Sesi 3 Hacktiv8          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║   Local:   http://localhost:${PORT}                    ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   ✅ Temperature (0.0 - 2.0)                          ║');
    console.log('║   ✅ Top_k (1 - 40)                                   ║');
    console.log('║   ✅ Top_p (0.0 - 1.0)                                ║');
    console.log('║   ✅ System Instruction per mode                      ║');
    console.log('║   ✅ Multi-turn conversation                          ║');
    console.log('║   ✅ Upload Image / Document / Audio                  ║');
    console.log('╚══════════════════════════════════════════════════════╝');
});

export default app;