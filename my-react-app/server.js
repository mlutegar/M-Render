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
app.use(express.json({ limit: "50mb" }));

// Multer: armazena o arquivo em memória
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.post("/api/render", upload.single("image"), async (req, res) => {
  try {
    // Tenta ler do header Authorization primeiro, se não cai de volta pro .env.local
    const openaiKey = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : process.env.VITE_OPENAI_KEY;

    if (!openaiKey) {
      return res.status(401).json({ error: "VITE_OPENAI_KEY não configurada no servidor e nenhuma chave foi fornecida na interface." });
    }

    if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada." });

    const prompt = req.body.prompt || "";

    // size vem do frontend (calculado pelo aspect ratio da imagem original)
    const VALID_SIZES = ["1024x1024", "1536x1024", "1024x1536"];
    const size = VALID_SIZES.includes(req.body.size) ? req.body.size : "1024x1024";

    console.log(`→ Gerando render | size: ${size} | prompt: ${prompt.slice(0, 60)}…`);

    // Monta o FormData para a OpenAI
    const form = new FormData();
    form.append("image[]", req.file.buffer, {
      filename: "model.png",
      contentType: "image/png",
    });
    form.append("prompt", prompt);
    form.append("model", "gpt-image-1");
    form.append("n", "1");
    form.append("size", size);
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

app.post("/api/analyze-room", async (req, res) => {
  try {
    const openaiKey = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : process.env.VITE_OPENAI_KEY;

    if (!openaiKey) {
      return res.status(401).json({ error: "VITE_OPENAI_KEY não configurada no servidor e nenhuma chave foi fornecida na interface." });
    }

    const { image, prompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Nenhuma imagem base64 fornecida." });
    }

    console.log("→ Analisando ambiente com OpenAI GPT Vision…");

    // Fazer a chamada ao GPT-4o-mini com visão
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: image, // data:image/png;base64,...
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Chat Vision error:", data);
      return res.status(response.status).json({ error: data.error?.message || "Erro no GPT Vision." });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "Resposta vazia da OpenAI." });
    }

    res.json({ result: content });
  } catch (err) {
    console.error("Server error in analyze-room:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Proxy server rodando em http://localhost:${PORT}`);
});
