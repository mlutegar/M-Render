import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Carrega o .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") });

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));

// Multer: armazena o arquivo em memória
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.post("/api/render", upload.single("image"), async (req, res) => {
  try {
    const openaiKey = process.env.VITE_OPENAI_KEY;
    if (!openaiKey) return res.status(500).json({ error: "VITE_OPENAI_KEY não configurada no servidor." });

    if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada." });

    const prompt = req.body.prompt || "";

    // Monta o FormData para a OpenAI
    const form = new FormData();
    form.append("image[]", req.file.buffer, {
      filename: "model.png",
      contentType: "image/png",
    });
    form.append("prompt", prompt);
    form.append("model", "gpt-image-1");
    form.append("n", "1");
    form.append("size", "1024x1024");
    form.append("quality", "high");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(response.status).json({ error: data.error?.message || "Erro na OpenAI." });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Proxy server rodando em http://localhost:${PORT}`);
});
