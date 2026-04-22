import { useState, useRef, useCallback } from "react";

const STYLES = [
  { id: "fotorrealista", label: "Diurno", emoji: "☀️", hint: "Luz natural, materiais reais" },
  { id: "noturno", label: "Noturno", emoji: "🌙", hint: "Luzes artificiais, céu noturno" },
  { id: "por_do_sol", label: "Pôr do Sol", emoji: "🌅", hint: "Golden hour, céu laranja" },
  { id: "dramatico", label: "Dramático", emoji: "⛈️", hint: "Nuvens pesadas, luz contrastada" },
  { id: "aquarela", label: "Aquarela", emoji: "🎨", hint: "Ilustração artística" },
];

const STYLE_PROMPTS = {
  fotorrealista: "photorealistic architectural render, bright natural daylight, clear blue sky, realistic materials and textures, sharp shadows, professional architectural visualization, 8k ultra detailed",
  noturno: "night architectural render, dramatic artificial lighting, warm glowing interior lights, dark sky, professional architectural visualization, photorealistic, 8k",
  por_do_sol: "golden hour architectural render, warm sunset lighting, orange and purple gradient sky, long soft shadows, photorealistic architectural visualization, 8k",
  dramatico: "dramatic cinematic architectural render, stormy clouds, god rays, high contrast moody lighting, professional architectural visualization, photorealistic, 8k",
  aquarela: "architectural watercolor illustration, hand-painted style, soft pastel tones, artistic, professional architectural rendering, beautifully crafted",
};

const NEGATIVE_PROMPT = "sketch lines, wireframe, CAD drawing, blueprint, blurry, low quality, distorted, ugly, unrealistic, 3d model artifacts, noise";

export default function RenderIA() {
  const [image, setImage] = useState(null);
  const [style, setStyle] = useState(STYLES[0]);
  const [apiKey, setApiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [log, setLog] = useState("");
  const [result, setResult] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setResult(null);
      setPhase("idle");
      setLog("");
      setGeneratedPrompt("");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const analyzeWithClaude = async (base64Image) => {
    const mediaType = base64Image.split(";")[0].split(":")[1];
    const imageData = base64Image.split(",")[1];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            {
              type: "text",
              text: `You are an expert architectural visualization prompt engineer. Analyze this 3D model screenshot (likely SketchUp or similar) and write a Stable Diffusion img2img prompt for the following render style: ${STYLE_PROMPTS[style.id]}.

Identify and describe: building type, architectural style (modern/contemporary/minimalist/etc), exterior materials visible (glass, concrete, wood, brick, metal panels), vegetation, surrounding landscape, number of floors, notable structural elements.

Respond with ONLY the Stable Diffusion prompt, max 100 words, written in English as descriptive comma-separated terms. Always end with: "architectural visualization, professional render, photorealistic, high resolution". No explanations, no preamble.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error("Erro Claude: " + (err.error?.message || response.statusText));
    }
    const data = await response.json();
    return data.content[0].text.trim();
  };

  const renderWithStability = async (imageDataUrl, prompt) => {
    const arr = imageDataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const imageBlob = new Blob([u8arr], { type: mime });

    const formData = new FormData();
    formData.append("image", imageBlob, "input.png");
    formData.append("prompt", prompt);
    formData.append("negative_prompt", NEGATIVE_PROMPT);
    formData.append("control_strength", "0.7");
    formData.append("output_format", "jpeg");

    const response = await fetch("https://api.stability.ai/v2beta/stable-image/control/sketch", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "image/*",
      },
      body: formData,
    });

    if (!response.ok) {
      let msg;
      try {
        const txt = await response.text();
        msg = JSON.parse(txt)?.errors?.[0] || txt;
      } catch { msg = response.statusText; }
      throw new Error(`Stability AI (${response.status}): ${msg}`);
    }

    const blob = await response.blob();
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target.result);
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerate = async () => {
    if (!image) return;
    if (!apiKey || !anthropicKey) { setShowSettings(true); return; }

    try {
      setPhase("analyzing");
      setLog("Analisando a cena com Claude Vision...");
      setResult(null);
      setGeneratedPrompt("");

      const prompt = await analyzeWithClaude(image);
      setGeneratedPrompt(prompt);

      setPhase("generating");
      setLog("Gerando render com Stable Diffusion...");

      const rendered = await renderWithStability(image, prompt);
      setResult(rendered);
      setPhase("done");
      setLog("");
    } catch (err) {
      setPhase("error");
      setLog(err.message);
    }
  };

  const downloadResult = () => {
    const a = document.createElement("a");
    a.href = result;
    a.download = `render_${style.id}_${Date.now()}.jpg`;
    a.click();
  };

  const isLoading = phase === "analyzing" || phase === "generating";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Syne:wght@400;500;600&family=DM+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}
        .r-root{
          font-family:'Syne',sans-serif;
          background:#0d0b08;
          color:#e0d8cc;
          height:100vh;
          display:flex;
          flex-direction:column;
          overflow:hidden;
        }
        .r-header{
          padding:1.25rem 1.75rem;
          border-bottom:1px solid #1c1912;
          display:flex;
          align-items:center;
          justify-content:space-between;
          flex-shrink:0;
        }
        .r-logo{
          font-family:'Cormorant Garamond',serif;
          font-size:1.6rem;
          font-weight:600;
          color:#f0e8d8;
          letter-spacing:-0.01em;
          line-height:1;
        }
        .r-logo em{color:#c8a66a;font-style:normal}
        .r-sub{
          font-family:'DM Mono',monospace;
          font-size:0.62rem;
          color:#4a4232;
          letter-spacing:0.08em;
          margin-top:3px;
        }
        .r-key-btn{
          background:transparent;
          border:1px solid #2a251c;
          border-radius:6px;
          color:#5a5040;
          font-family:'DM Mono',monospace;
          font-size:0.65rem;
          letter-spacing:0.1em;
          padding:0.35rem 0.75rem;
          cursor:pointer;
          transition:all 0.15s;
          display:flex;
          align-items:center;
          gap:6px;
        }
        .r-key-btn:hover{border-color:#c8a66a;color:#c8a66a}
        .r-key-dot{
          width:6px;height:6px;border-radius:50%;
          background:${apiKey ? "#4a9060" : "#4a3020"};
          flex-shrink:0;
        }
        .r-body{
          display:grid;
          grid-template-columns:340px 1fr;
          flex:1;
          overflow:hidden;
        }
        .r-left{
          border-right:1px solid #1c1912;
          display:flex;
          flex-direction:column;
          overflow:hidden;
        }
        .r-left-inner{
          padding:1.25rem;
          display:flex;
          flex-direction:column;
          gap:1rem;
          flex:1;
          overflow-y:auto;
        }
        .r-right{
          display:flex;
          flex-direction:column;
          padding:1.25rem;
          gap:0.75rem;
          overflow:hidden;
        }
        .r-label{
          font-family:'DM Mono',monospace;
          font-size:0.6rem;
          letter-spacing:0.12em;
          color:#3a3222;
          text-transform:uppercase;
          margin-bottom:0.4rem;
        }
        .r-dropzone{
          border:1px dashed #272018;
          border-radius:10px;
          cursor:pointer;
          transition:all 0.15s;
          position:relative;
          overflow:hidden;
          height:200px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }
        .r-dropzone:hover,.r-dropzone.dragging{
          border-color:#c8a66a;
          background:#0f0d09;
        }
        .r-dropzone.has-img{
          border-style:solid;
          border-color:#1c1912;
          cursor:default;
        }
        .r-dropzone img{
          width:100%;height:100%;
          object-fit:cover;
          border-radius:9px;
        }
        .r-drop-overlay{
          position:absolute;
          bottom:0;left:0;right:0;
          background:linear-gradient(transparent,rgba(13,11,8,0.9));
          padding:0.75rem;
          display:flex;
          align-items:center;
          justify-content:space-between;
        }
        .r-drop-hint{text-align:center}
        .r-drop-icon{
          width:36px;height:36px;
          border:1px solid #1c1912;
          border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 0.75rem;
          color:#3a3222;
        }
        .r-drop-text{font-size:0.78rem;color:#3a3222;line-height:1.5}
        .r-drop-text strong{color:#7a6a52;font-weight:500}
        .r-change{
          font-family:'DM Mono',monospace;
          font-size:0.6rem;
          color:#c8a66a;
          background:rgba(200,166,106,0.12);
          border:none;border-radius:5px;
          padding:3px 8px;cursor:pointer;
          transition:background 0.15s;
        }
        .r-change:hover{background:rgba(200,166,106,0.2)}
        .r-fname{
          font-family:'DM Mono',monospace;
          font-size:0.62rem;
          color:#7a6a52;
        }
        .r-styles{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:5px;
        }
        .r-style{
          background:#0a0905;
          border:1px solid #1c1912;
          border-radius:7px;
          padding:0.45rem 0.2rem;
          cursor:pointer;
          text-align:center;
          transition:all 0.15s;
        }
        .r-style:hover{border-color:#2a251c}
        .r-style.on{border-color:#c8a66a;background:#141008}
        .r-style-icon{font-size:1rem;display:block;line-height:1.2}
        .r-style-lbl{
          font-size:0.62rem;
          color:#5a5040;
          display:block;
          margin-top:3px;
        }
        .r-style.on .r-style-lbl{color:#c8a66a}
        .r-gen{
          width:100%;
          padding:0.8rem;
          background:#c8a66a;
          border:none;
          border-radius:9px;
          color:#140e04;
          font-family:'Syne',sans-serif;
          font-size:0.85rem;
          font-weight:600;
          cursor:pointer;
          transition:all 0.15s;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          flex-shrink:0;
        }
        .r-gen:hover:not(:disabled){background:#d4b478;transform:translateY(-1px)}
        .r-gen:active:not(:disabled){transform:translateY(0)}
        .r-gen:disabled{opacity:0.35;cursor:not-allowed}
        .r-mini-spin{
          width:13px;height:13px;
          border:2px solid rgba(20,14,4,0.25);
          border-top-color:#140e04;
          border-radius:50%;
          animation:rspin 0.6s linear infinite;
        }
        @keyframes rspin{to{transform:rotate(360deg)}}
        .r-result{
          flex:1;
          border:1px solid #1c1912;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          position:relative;
          background:#09080605;
          min-height:0;
        }
        .r-result img{
          width:100%;height:100%;
          object-fit:contain;
          border-radius:9px;
        }
        .r-placeholder{text-align:center;padding:2rem}
        .r-placeholder-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.15rem;
          color:#2a2318;
          margin-bottom:0.4rem;
          font-style:italic;
        }
        .r-placeholder-sub{
          font-family:'DM Mono',monospace;
          font-size:0.65rem;
          color:#1e1a12;
        }
        .r-loading{text-align:center;padding:2rem}
        .r-spinner{
          width:28px;height:28px;
          border:2px solid #1c1912;
          border-top-color:#c8a66a;
          border-radius:50%;
          animation:rspin 0.7s linear infinite;
          margin:0 auto 1rem;
        }
        .r-loading-txt{
          font-family:'DM Mono',monospace;
          font-size:0.7rem;
          color:#5a5040;
        }
        .r-steps{
          display:flex;gap:5px;align-items:center;
        }
        .r-step{
          font-family:'DM Mono',monospace;
          font-size:0.58rem;
          padding:2px 8px;
          border-radius:20px;
          border:1px solid #1c1912;
          color:#2e2818;
          transition:all 0.2s;
        }
        .r-step.active{border-color:#c8a66a;color:#c8a66a;background:rgba(200,166,106,0.08)}
        .r-step.done{border-color:#1e3020;color:#3a6040;background:rgba(60,100,60,0.08)}
        .r-prompt-box{
          background:#09080605;
          border:1px solid #1c1912;
          border-radius:7px;
          padding:0.6rem 0.75rem;
          font-family:'DM Mono',monospace;
          font-size:0.62rem;
          color:#3a3222;
          line-height:1.7;
          flex-shrink:0;
          max-height:70px;
          overflow-y:auto;
        }
        .r-actions{display:flex;gap:6px;flex-shrink:0}
        .r-act{
          flex:1;
          padding:0.55rem;
          background:transparent;
          border:1px solid #2a251c;
          border-radius:7px;
          color:#7a6a52;
          font-family:'Syne',sans-serif;
          font-size:0.75rem;
          cursor:pointer;
          transition:all 0.15s;
        }
        .r-act:hover{border-color:#c8a66a;color:#c8a66a}
        .r-error-box{
          background:#110808;
          border:1px solid #3a1414;
          border-radius:7px;
          padding:0.75rem;
          font-family:'DM Mono',monospace;
          font-size:0.68rem;
          color:#b04040;
          line-height:1.6;
          width:90%;
          word-break:break-word;
        }
        .r-overlay{
          position:fixed;inset:0;
          background:rgba(0,0,0,0.75);
          display:flex;align-items:center;justify-content:center;
          z-index:200;
        }
        .r-modal{
          background:#120f09;
          border:1px solid #2a251c;
          border-radius:12px;
          padding:1.5rem;
          width:400px;
          max-width:92vw;
        }
        .r-modal-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.3rem;
          font-weight:600;
          color:#f0e8d8;
          margin-bottom:4px;
        }
        .r-modal-sub{
          font-size:0.68rem;
          color:#4a4232;
          font-family:'DM Mono',monospace;
          line-height:1.7;
          margin-bottom:1.25rem;
        }
        .r-modal-sub a{color:#c8a66a;text-decoration:none}
        .r-in-label{
          display:block;
          font-family:'DM Mono',monospace;
          font-size:0.6rem;
          color:#4a4232;
          letter-spacing:0.1em;
          text-transform:uppercase;
          margin-bottom:5px;
        }
        .r-input{
          width:100%;
          background:#080706;
          border:1px solid #2a251c;
          border-radius:7px;
          padding:0.55rem 0.75rem;
          color:#c8a66a;
          font-family:'DM Mono',monospace;
          font-size:0.78rem;
          outline:none;
          margin-bottom:0.75rem;
          transition:border 0.15s;
        }
        .r-input:focus{border-color:#c8a66a}
        .r-modal-note{
          font-size:0.62rem;
          color:#2e2818;
          font-family:'DM Mono',monospace;
          line-height:1.6;
          margin-bottom:1.25rem;
        }
        .r-modal-btns{display:flex;gap:8px;justify-content:flex-end}
        .r-cancel{
          padding:0.45rem 1rem;
          background:transparent;
          border:1px solid #2a251c;
          border-radius:7px;
          color:#5a5040;
          font-family:'Syne',sans-serif;
          font-size:0.78rem;
          cursor:pointer;
        }
        .r-save{
          padding:0.45rem 1.25rem;
          background:#c8a66a;
          border:none;
          border-radius:7px;
          color:#140e04;
          font-family:'Syne',sans-serif;
          font-size:0.78rem;
          font-weight:600;
          cursor:pointer;
        }
        .r-divider{
          border:none;
          border-top:1px solid #1c1912;
          margin:0;
        }
      `}</style>

      <div className="r-root">
        <div className="r-header">
          <div>
            <div className="r-logo">Render<em>IA</em></div>
            <div className="r-sub">SKETCHUP → RENDER FOTORREALISTA COM IA</div>
          </div>
          <button className="r-key-btn" onClick={() => setShowSettings(true)}>
            <span className="r-key-dot" />
            {apiKey && anthropicKey ? "APIs CONFIGURADAS" : "CONFIGURAR APIs"}
          </button>
        </div>

        <div className="r-body">
          <div className="r-left">
            <div className="r-left-inner">
              <div>
                <div className="r-label">Print do SketchUp</div>
                <div
                  className={`r-dropzone${image ? " has-img" : ""}${isDragging ? " dragging" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => !image && fileRef.current?.click()}
                >
                  {image ? (
                    <>
                      <img src={image} alt="Modelo 3D" />
                      <div className="r-drop-overlay">
                        <span className="r-fname">modelo.png</span>
                        <button
                          className="r-change"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                        >trocar</button>
                      </div>
                    </>
                  ) : (
                    <div className="r-drop-hint">
                      <div className="r-drop-icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="r-drop-text">
                        <strong>Arraste o print do SketchUp</strong><br />
                        ou clique para selecionar
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <hr className="r-divider" />

              <div>
                <div className="r-label">Estilo do Render</div>
                <div className="r-styles">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      className={`r-style${style.id === s.id ? " on" : ""}`}
                      onClick={() => setStyle(s)}
                      title={s.hint}
                    >
                      <span className="r-style-icon">{s.emoji}</span>
                      <span className="r-style-lbl">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="r-divider" />

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "#2e2818", lineHeight: 1.8 }}>
                <div style={{ color: "#4a4232", marginBottom: "0.4rem", fontSize: "0.65rem" }}>COMO FUNCIONA</div>
                <div>① Claude Vision analisa sua cena 3D</div>
                <div>② Gera prompt arquitetônico otimizado</div>
                <div>③ Stability AI renderiza em SD</div>
              </div>
            </div>

            <div style={{ padding: "0 1.25rem 1.25rem", flexShrink: 0 }}>
              <button
                className="r-gen"
                onClick={handleGenerate}
                disabled={!image || isLoading}
              >
                {isLoading ? (
                  <><div className="r-mini-spin" /> Processando...</>
                ) : (
                  <>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Gerar Render
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="r-right">
            {isLoading && (
              <div className="r-steps">
                <div className={`r-step${phase === "analyzing" ? " active" : phase === "generating" || phase === "done" ? " done" : ""}`}>
                  {phase === "analyzing" ? "▶ analisando cena" : "✓ cena analisada"}
                </div>
                <div style={{ color: "#1c1912", fontSize: "0.6rem" }}>→</div>
                <div className={`r-step${phase === "generating" ? " active" : phase === "done" ? " done" : ""}`}>
                  {phase === "generating" ? "▶ renderizando" : phase === "done" ? "✓ render pronto" : "— renderizar"}
                </div>
              </div>
            )}

            <div className="r-result">
              {phase === "idle" && !result && (
                <div className="r-placeholder">
                  <div className="r-placeholder-title">O render aparece aqui</div>
                  <div className="r-placeholder-sub">suba uma imagem e clique em gerar</div>
                </div>
              )}
              {isLoading && (
                <div className="r-loading">
                  <div className="r-spinner" />
                  <div className="r-loading-txt">{log}</div>
                </div>
              )}
              {phase === "done" && result && (
                <img src={result} alt="Render gerado por IA" />
              )}
              {phase === "error" && (
                <div className="r-error-box">{log}</div>
              )}
            </div>

            {generatedPrompt && (
              <div>
                <div className="r-label">Prompt gerado pelo Claude</div>
                <div className="r-prompt-box">{generatedPrompt}</div>
              </div>
            )}

            {phase === "done" && result && (
              <div className="r-actions">
                <button className="r-act" onClick={downloadResult}>↓ Baixar render</button>
                <button
                  className="r-act"
                  onClick={() => {
                    setResult(null);
                    setPhase("idle");
                    setGeneratedPrompt("");
                    setLog("");
                  }}
                >↺ Novo render</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="r-overlay" onClick={() => setShowSettings(false)}>
          <div className="r-modal" onClick={(e) => e.stopPropagation()}>
            <div className="r-modal-title">Configurar APIs</div>
            <div className="r-modal-sub">
              Duas chaves são necessárias para gerar o render.
            </div>

            <label className="r-in-label">Anthropic API Key</label>
            <input
              type="password"
              className="r-input"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />

            <label className="r-in-label">Stability AI API Key</label>
            <input
              type="password"
              className="r-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="r-modal-note">
              As chaves ficam salvas só nessa sessão do navegador. Não são enviadas para nenhum servidor intermediário.
            </div>

            <div className="r-modal-btns">
              <button className="r-cancel" onClick={() => setShowSettings(false)}>Cancelar</button>
              <button className="r-save" onClick={() => setShowSettings(false)}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </>
  );
}
