// ============================================
// IMPORT LIBRARY
// ============================================

import 'dotenv/config';           // Memuat variabel dari file .env
import express from 'express';    // Framework web untuk Node.js
import multer from 'multer';      // Middleware untuk handle upload file
import { GoogleGenAI } from '@google/genai';  // SDK Gemini AI dari Google

// ============================================
// INISIALISASI APLIKASI
// ============================================

const app = express();            // Membuat instance aplikasi Express
const upload = multer();          // Setup multer (simpan file di memory, bukan disk)
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY  // Ambil API key dari .env
});

const GEMINI_MODEL = 'gemini-2.5-flash';  // Model yang digunakan (hemat biaya & cepat)
const PORT = process.env.PORT || 3000;    // Ambil port dari .env, fallback ke 3000

app.use(express.json());          // Middleware: biar Express bisa baca JSON dari body request

// ============================================
// HELPER FUNCTION: Extract Text dari Response Gemini
// ============================================

function extractText(resp) {
    try {
        // Coba ambil text dari berbagai kemungkinan struktur response
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.response.candidates[0].content.parts[0].text;
        }
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            return resp.response.candidates[0].content.parts[0].inlineData.data;
        }
        if (resp?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.candidates[0].content.parts[0].text;
        }
        return JSON.stringify(resp); // Fallback: tampilkan semua response
    } catch (err) {
        return "";
    }
}

// ============================================
// ENDPOINT 1: GENERATE TEXT (Input: Teks)
// ============================================
// URL: POST http://localhost:3000/generate-text
// Body: { "prompt": "Jelaskan apa itu AI" }

app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;  // Ambil prompt dari body request
        
        // Panggil Gemini AI untuk generate content
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt  // Kirim prompt ke AI
        });

        // Kirim hasil ke client
        res.status(200).json({
            output: extractText(response)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// ============================================
// ENDPOINT 2: GENERATE FROM IMAGE (Input: Gambar + Prompt)
// ============================================
// URL: POST http://localhost:3000/generate-from-image
// Body: form-data
//   - image: (file) upload gambar .jpg/.png
//   - prompt: (text) "Deskripsikan gambar ini"

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;           // Ambil prompt teks
        const file = req.file;                 // Ambil file dari multer

        // Konversi file gambar ke Base64 (format yang diterima Gemini)
        const base64Image = file.buffer.toString('base64');

        // Panggil Gemini dengan input multimodal (teks + gambar)
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Describe this image' },  // Prompt teks
                {
                    inlineData: {                             // Data gambar
                        data: base64Image,
                        mimeType: file.mimetype              // Contoh: image/jpeg
                    }
                }
            ]
        });

        res.status(200).json({
            output: extractText(response)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// ============================================
// ENDPOINT 3: GENERATE FROM DOCUMENT (Input: Dokumen + Prompt)
// ============================================
// URL: POST http://localhost:3000/generate-from-document
// Body: form-data
//   - document: (file) upload .pdf/.txt/.docx
//   - prompt: (text) opsional

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;

        // Konversi dokumen ke Base64
        const base64Doc = file.buffer.toString('base64');

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Summarize this document' },
                {
                    inlineData: {
                        data: base64Doc,
                        mimeType: file.mimetype  // Contoh: application/pdf
                    }
                }
            ]
        });

        res.status(200).json({
            output: extractText(response)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// ============================================
// ENDPOINT 4: GENERATE FROM AUDIO (Input: Audio + Prompt)
// ============================================
// URL: POST http://localhost:3000/generate-from-audio
// Body: form-data
//   - audio: (file) upload .mp3/.wav
//   - prompt: (text) opsional, contoh: "Transcribe this audio"

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;

        // Konversi audio ke Base64
        const base64Audio = file.buffer.toString('base64');

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || 'Transcribe this audio' },
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: file.mimetype  // Contoh: audio/mp3
                    }
                }
            ]
        });

        res.status(200).json({
            output: extractText(response)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// ============================================
// JALANKAN SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server ready on http://localhost:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   POST /generate-text`);
    console.log(`   POST /generate-from-image`);
    console.log(`   POST /generate-from-document`);
    console.log(`   POST /generate-from-audio`);
});