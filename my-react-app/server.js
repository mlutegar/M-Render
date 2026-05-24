import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Em dev carrega .env.local; em produção as variáveis vêm do Render
dotenv.config({ path: path.join(__dirname, ".env.local") });

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// Em dev: só aceita o Vite local. Em produção: tudo está no mesmo domínio
if (!isProd) {
  app.use(cors({ origin: "http://localhost:5173" }));
}

app.use(express.json({ limit: "50mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/* ── /api/render ─────────────────────────────────────── */
app.post("/api/render", upload.single("image"), async (req, res) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_KEY;
    if (!openaiKey) return res.status(500).json({ error: "API key não configurada no servidor." });
    if (!req.file)  return res.status(400).json({ error: "Nenhuma imagem enviada." });

    const prompt = req.body.prompt || "";
    const VALID_SIZES = ["1024x1024", "1536x1024", "1024x1536"];
    const size = VALID_SIZES.includes(req.body.size) ? req.body.size : "1024x1024";

    console.log(`→ Render | size: ${size}`);

    const form = new FormData();
    form.append("image[]", req.file.buffer, { filename: "model.png", contentType: "image/png" });
    form.append("prompt", prompt);
    form.append("model", "gpt-image-1");
    form.append("n", "1");
    form.append("size", size);
    form.append("quality", "high");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, ...form.getHeaders() },
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

/* ── Em produção: serve o build do React ────────────── */
if (isProd) {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  // Qualquer rota não-API devolve o index.html (SPA)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT} (${isProd ? "produção" : "dev"})`);
});
