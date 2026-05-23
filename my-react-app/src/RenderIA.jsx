import { useState, useRef, useCallback } from "react";

const RENDER_PROMPT =
  "Render a photorealistic image of a minimalist bedroom based strictly on the provided 3D model. " +
  "Maintain 100% fidelity to the original scene — do not add, remove, or modify any objects, furniture, materials, proportions, or layout. " +
  "Preserve all elements exactly as they appear in the 3D model. Focus only on enhancing lighting, textures, shadows, and realism. " +
  "Use natural lighting, soft shadows, high-resolution materials, and realistic reflections. " +
  "Keep the original composition, camera angle, colors, and design untouched. " +
  "Ultra-realistic render, high detail, clean minimal aesthetic, physically accurate lighting.";

/** Converte qualquer dataURL em PNG e retorna também as dimensões originais */
const toPngDataUrl = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve({ png: canvas.toDataURL("image/png"), width: img.width, height: img.height });
    };
    img.src = dataUrl;
  });

/**
 * Escolhe o size suportado pela API mais próximo do aspect ratio original.
 * gpt-image-1 suporta: 1024x1024 | 1536x1024 (landscape) | 1024x1536 (portrait)
 */
const pickSize = (width, height) => {
  const ratio = width / height;
  if (ratio > 1.2) return "1536x1024";   // landscape
  if (ratio < 0.83) return "1024x1536";  // portrait
  return "1024x1024";                    // quadrado / quase quadrado
};

export default function RenderIA() {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");

  const [phase, setPhase] = useState("idle"); // idle | generating | done | error
  const [log, setLog] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();

  /* ── Ficheiro ────────────────────────────────────── */
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageName(file.name);
      setResult(null);
      setPhase("idle");
      setLog("");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  /* ── OpenAI via backend proxy (/api/render) ─────── */
  const renderWithOpenAI = async (imageDataUrl) => {
    // Converte para PNG e captura dimensões originais
    const { png, width, height } = await toPngDataUrl(imageDataUrl);
    const size = pickSize(width, height);

    const base64 = png.split(",")[1];
    const bstr = atob(base64);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    const imageBlob = new Blob([u8], { type: "image/png" });

    // Envia para o servidor Express local (evita CORS)
    const formData = new FormData();
    formData.append("image", imageBlob, "model.png");
    formData.append("prompt", RENDER_PROMPT);
    formData.append("size", size);

    const response = await fetch("/api/render", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error("OpenAI: " + (data.error || response.statusText));
    }

    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("Resposta inesperada da OpenAI.");
    return `data:image/png;base64,${b64}`;
  };

  /* ── Gerar ───────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!image) return;
    try {
      setPhase("generating");
      setLog("Gerando render com OpenAI DALL‑E…");
      setResult(null);

      const rendered = await renderWithOpenAI(image);
      setResult(rendered);
      setPhase("done");
      setLog("");
    } catch (err) {
      setPhase("error");
      setLog(err.message);
    }
  };

  /* ── Download ────────────────────────────────────── */
  const downloadResult = () => {
    const a = document.createElement("a");
    a.href = result;
    a.download = `render_${Date.now()}.png`;
    a.click();
  };

  const isLoading = phase === "generating";

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
        .r-key-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
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
        .r-dropzone:hover,.r-dropzone.dragging{border-color:#c8a66a;background:#0f0d09}
        .r-dropzone.has-img{border-style:solid;border-color:#1c1912;cursor:default}
        .r-dropzone img{width:100%;height:100%;object-fit:cover;border-radius:9px}
        .r-drop-overlay{
          position:absolute;bottom:0;left:0;right:0;
          background:linear-gradient(transparent,rgba(13,11,8,0.9));
          padding:0.75rem;
          display:flex;align-items:center;justify-content:space-between;
        }
        .r-drop-hint{text-align:center}
        .r-drop-icon{
          width:36px;height:36px;border:1px solid #1c1912;border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 0.75rem;color:#3a3222;
        }
        .r-drop-text{font-size:0.78rem;color:#3a3222;line-height:1.5}
        .r-drop-text strong{color:#7a6a52;font-weight:500}
        .r-change{
          font-family:'DM Mono',monospace;font-size:0.6rem;color:#c8a66a;
          background:rgba(200,166,106,0.12);border:none;border-radius:5px;
          padding:3px 8px;cursor:pointer;transition:background 0.15s;
        }
        .r-change:hover{background:rgba(200,166,106,0.2)}
        .r-fname{font-family:'DM Mono',monospace;font-size:0.62rem;color:#7a6a52;
          max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .r-prompt-preview{
          background:#09080605;
          border:1px solid #1c1912;
          border-radius:7px;
          padding:0.65rem 0.75rem;
          font-family:'DM Mono',monospace;
          font-size:0.6rem;
          color:#3a3222;
          line-height:1.75;
          max-height:110px;
          overflow-y:auto;
        }
        .r-gen{
          width:100%;padding:0.8rem;background:#c8a66a;border:none;border-radius:9px;
          color:#140e04;font-family:'Syne',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:all 0.15s;
          display:flex;align-items:center;justify-content:center;gap:8px;flex-shrink:0;
        }
        .r-gen:hover:not(:disabled){background:#d4b478;transform:translateY(-1px)}
        .r-gen:active:not(:disabled){transform:translateY(0)}
        .r-gen:disabled{opacity:0.35;cursor:not-allowed}
        .r-mini-spin{
          width:13px;height:13px;border:2px solid rgba(20,14,4,0.25);
          border-top-color:#140e04;border-radius:50%;animation:rspin 0.6s linear infinite;
        }
        @keyframes rspin{to{transform:rotate(360deg)}}
        .r-result{
          flex:1;border:1px solid #1c1912;border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;position:relative;background:#09080605;min-height:0;
        }
        .r-result img{width:100%;height:100%;object-fit:contain;border-radius:9px}
        .r-placeholder{text-align:center;padding:2rem}
        .r-placeholder-title{
          font-family:'Cormorant Garamond',serif;font-size:1.15rem;
          color:#2a2318;margin-bottom:0.4rem;font-style:italic;
        }
        .r-placeholder-sub{font-family:'DM Mono',monospace;font-size:0.65rem;color:#1e1a12}
        .r-loading{text-align:center;padding:2rem}
        .r-spinner{
          width:28px;height:28px;border:2px solid #1c1912;
          border-top-color:#c8a66a;border-radius:50%;
          animation:rspin 0.7s linear infinite;margin:0 auto 1rem;
        }
        .r-loading-txt{font-family:'DM Mono',monospace;font-size:0.7rem;color:#5a5040}
        .r-error-box{
          background:#110808;border:1px solid #3a1414;border-radius:7px;
          padding:0.75rem;font-family:'DM Mono',monospace;font-size:0.68rem;
          color:#b04040;line-height:1.6;width:90%;word-break:break-word;
        }
        .r-actions{display:flex;gap:6px;flex-shrink:0}
        .r-act{
          flex:1;padding:0.55rem;background:transparent;border:1px solid #2a251c;
          border-radius:7px;color:#7a6a52;font-family:'Syne',sans-serif;
          font-size:0.75rem;cursor:pointer;transition:all 0.15s;
        }
        .r-act:hover{border-color:#c8a66a;color:#c8a66a}
        .r-divider{border:none;border-top:1px solid #1c1912;margin:0}
        .r-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.75);
          display:flex;align-items:center;justify-content:center;z-index:200;
        }
        .r-modal{
          background:#120f09;border:1px solid #2a251c;border-radius:12px;
          padding:1.5rem;width:420px;max-width:92vw;
        }
        .r-modal-title{
          font-family:'Cormorant Garamond',serif;font-size:1.3rem;
          font-weight:600;color:#f0e8d8;margin-bottom:4px;
        }
        .r-modal-sub{
          font-size:0.68rem;color:#4a4232;font-family:'DM Mono',monospace;
          line-height:1.7;margin-bottom:1.25rem;
        }
        .r-modal-sub a{color:#c8a66a;text-decoration:none}
        .r-in-label{
          display:block;font-family:'DM Mono',monospace;font-size:0.6rem;
          color:#4a4232;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px;
        }
        .r-input{
          width:100%;background:#080706;border:1px solid #2a251c;border-radius:7px;
          padding:0.55rem 0.75rem;color:#c8a66a;font-family:'DM Mono',monospace;
          font-size:0.75rem;outline:none;margin-bottom:0.75rem;transition:border 0.15s;
        }
        .r-input:focus{border-color:#c8a66a}
        .r-modal-btns{display:flex;gap:8px;justify-content:flex-end}
        .r-cancel{
          padding:0.45rem 1rem;background:transparent;border:1px solid #2a251c;
          border-radius:7px;color:#5a5040;font-family:'Syne',sans-serif;
          font-size:0.78rem;cursor:pointer;
        }
        .r-save{
          padding:0.45rem 1.25rem;background:#c8a66a;border:none;border-radius:7px;
          color:#140e04;font-family:'Syne',sans-serif;font-size:0.78rem;
          font-weight:600;cursor:pointer;
        }
        .r-badge{
          display:inline-flex;align-items:center;gap:5px;
          font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.08em;
          color:#3a6040;background:rgba(60,100,60,0.1);
          border:1px solid #1e3020;border-radius:20px;padding:2px 8px;
        }
      `}</style>

      <div className="r-root">
        {/* HEADER */}
        <div className="r-header">
          <div>
            <div className="r-logo">Render<em>IA</em></div>
            <div className="r-sub">SKETCHUP → RENDER FOTORREALISTA · OPENAI GPT‑IMAGE‑1</div>
          </div>
          <span className="r-badge" style={{ fontSize: "0.65rem", padding: "4px 10px" }}>
            ● API configurada
          </span>
        </div>

        <div className="r-body">
          {/* PAINEL ESQUERDO */}
          <div className="r-left">
            <div className="r-left-inner">

              {/* Upload */}
              <div>
                <div className="r-label">Print do SketchUp / modelo 3D</div>
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
                        <span className="r-fname" title={imageName}>{imageName || "modelo.png"}</span>
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

              {/* Prompt fixo */}
              <div>
                <div className="r-label">Prompt de render (fixo)</div>
                <div className="r-prompt-preview">{RENDER_PROMPT}</div>
              </div>

              <hr className="r-divider" />

              {/* Como funciona */}
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "#2e2818", lineHeight: 1.9 }}>
                <div style={{ color: "#4a4232", marginBottom: "0.4rem", fontSize: "0.65rem" }}>COMO FUNCIONA</div>
                <div>① Suba o print do modelo 3D</div>
                <div>② Clique em <strong style={{ color: "#7a6a52" }}>Gerar Render</strong></div>
                <div>③ OpenAI <span className="r-badge">gpt‑image‑1</span> renderiza</div>
                <div>④ Baixe o resultado em PNG</div>
              </div>
            </div>

            {/* Botão gerar */}
            <div style={{ padding: "0 1.25rem 1.25rem", flexShrink: 0 }}>
              <button
                className="r-gen"
                onClick={handleGenerate}
                disabled={!image || isLoading}
              >
                {isLoading ? (
                  <><div className="r-mini-spin" /> Gerando render…</>
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

          {/* PAINEL DIREITO */}
          <div className="r-right">
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
                <img src={result} alt="Render fotorrealista gerado por IA" />
              )}
              {phase === "error" && (
                <div className="r-error-box">⚠ {log}</div>
              )}
            </div>

            {phase === "done" && result && (
              <div className="r-actions">
                <button className="r-act" onClick={downloadResult}>↓ Baixar render (PNG)</button>
                <button
                  className="r-act"
                  onClick={() => {
                    setResult(null);
                    setPhase("idle");
                    setLog("");
                  }}
                >↺ Novo render</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input de arquivo oculto */}
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
