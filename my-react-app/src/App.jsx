import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';

const STYLE_PROMPTS = {
  fotorrealista: "photorealistic architectural render, bright natural daylight, clear blue sky, realistic materials and textures, sharp shadows, professional architectural visualization, 8k ultra detailed",
  noturno: "night architectural render, dramatic artificial lighting, warm glowing interior lights, dark sky, professional architectural visualization, photorealistic, 8k",
  por_do_sol: "golden hour architectural render, warm sunset lighting, orange and purple gradient sky, long soft shadows, photorealistic architectural visualization, 8k",
};

const NEGATIVE_PROMPT = "sketch lines, wireframe, CAD drawing, blueprint, blurry, low quality, distorted, ugly, unrealistic, 3d model artifacts, noise";

// ══════════════════════════════════════════════════════════════
// MOCK INITIAL DATA FOR DEMO MODE
// ══════════════════════════════════════════════════════════════
const INITIAL_DATA = {
  room_style: {
    nome: "minimalista contemporâneo",
    descricao: "Quarto minimalista com estética limpa, paleta neutra, linhas retas, simetria visual, iluminação natural suave e detalhes metálicos dourados/brass.",
    paleta_geral: [
      { cor: "cinza quente claro", hex_aproximado: "#B8B4AA" },
      { cor: "branco quente", hex_aproximado: "#F2EFE6" },
      { cor: "bege claro", hex_aproximado: "#D8CDBA" },
      { cor: "dourado fosco", hex_aproximado: "#A8894F" },
      { cor: "grafite escuro", hex_aproximado: "#2B2B28" }
    ],
    materiais_predominantes: [
      "tecido natural", "cerâmica ou porcelanato fosco", "metal dourado fosco",
      "vidro", "madeira ou MDF laqueado", "papel artístico emoldurado"
    ]
  },
  objects: [
    { name: "cama central", color: { nome: "bege acinzentado claro", hex_aproximado: "#C8C2B6" }, material: "base estofada ou estrutura baixa revestida em tecido neutro", descricao: "Cama posicionada ao centro da composição, alinhada frontalmente com a parede principal." },
    { name: "edredom principal", color: { nome: "cinza taupe quente", hex_aproximado: "#A9A59B" }, material: "tecido macio com textura levemente aveludada ou algodão fosco", descricao: "Edredom volumoso e levemente amassado, cobrindo a parte frontal da cama." },
    { name: "manta dobrada sobre a cama", color: { nome: "cinza médio frio", hex_aproximado: "#8F938E" }, material: "tecido têxtil macio, possivelmente linho ou algodão pesado", descricao: "Manta posicionada horizontalmente sobre a região central da cama." },
    { name: "travesseiros traseiros", color: { nome: "branco quente", hex_aproximado: "#EEE9DC" }, material: "algodão ou linho fosco", descricao: "Conjunto de travesseiros maiores apoiados na cabeceira, com aparência macia e natural." },
    { name: "almofadas frontais", color: { nome: "creme claro", hex_aproximado: "#F3EEDC" }, material: "tecido de algodão ou linho natural", descricao: "Almofadas retangulares claras posicionadas na frente dos travesseiros." },
    { name: "mesa de cabeceira esquerda", color: { nome: "branco quente", hex_aproximado: "#F0EDE4" }, material: "MDF ou madeira laqueada fosca com tampo escuro", descricao: "Criado-mudo de linhas retas com gavetas e estrutura leve." },
    { name: "mesa de cabeceira direita", color: { nome: "branco quente", hex_aproximado: "#F0EDE4" }, material: "MDF ou madeira laqueada fosca com tampo escuro", descricao: "Criado-mudo simétrico ao da esquerda, com gavetas e pés finos." },
    { name: "pés das mesas de cabeceira", color: { nome: "dourado fosco", hex_aproximado: "#A8894F" }, material: "metal com acabamento latão escovado ou dourado fosco", descricao: "Pés finos e delicados sob os criados-mudos." },
    { name: "luminária de mesa esquerda", color: { nome: "branco leitoso e dourado claro", hex_aproximado: "#F5F2EA" }, material: "cúpula esférica em vidro leitoso e base metálica dourada fosca", descricao: "Luminária decorativa com globo branco sobre base cilíndrica." },
    { name: "vela ou pequeno recipiente decorativo", color: { nome: "branco creme", hex_aproximado: "#E9E2D3" }, material: "cera, cerâmica ou vidro fosco", descricao: "Pequeno objeto decorativo sobre a mesa de cabeceira esquerda." },
    { name: "luminária de mesa direita", color: { nome: "preto fosco e cobre envelhecido", hex_aproximado: "#2A2925" }, material: "haste em metal preto fosco com foco em metal cobre ou bronze", descricao: "Luminária vertical fina com pequeno refletor direcionável." },
    { name: "porta-retrato sobre mesa direita", color: { nome: "branco texturizado", hex_aproximado: "#E5E0D6" }, material: "moldura texturizada clara com vidro frontal", descricao: "Pequeno porta-retrato apoiado sobre o criado-mudo direito." },
    { name: "quadros abstratos sobre a cama", color: { nome: "bege claro, preto suave e dourado", hex_aproximado: "#E9E1CF" }, material: "papel artístico impresso, vidro protetor e moldura metálica dourada fosca", descricao: "Dois quadros com arte abstrata linear emoldurados acima da cama." },
    { name: "molduras dos quadros", color: { nome: "dourado fosco", hex_aproximado: "#A98A4F" }, material: "metal fino com acabamento latão escovado", descricao: "Molduras estreitas que contornam as duas obras de arte." },
    { name: "parede principal", color: { nome: "cinza claro quente", hex_aproximado: "#D6D5CD" }, material: "pintura lisa fosca sobre alvenaria ou drywall", descricao: "Parede plana atrás da cama, com acabamento limpo e uniforme." },
    { name: "parede lateral esquerda", color: { nome: "cinza quente médio", hex_aproximado: "#A7A49B" }, material: "pintura fosca sobre alvenaria ou drywall", descricao: "Superfície arquitetônica lateral formando recuo próximo à área do espelho." },
    { name: "parede lateral direita", color: { nome: "cinza azulado suave", hex_aproximado: "#AEB8B7" }, material: "pintura lisa fosca", descricao: "Parede estreita junto à janela, com tonalidade fria e discreta." },
    { name: "piso", color: { nome: "cinza cimento quente", hex_aproximado: "#8E8B82" }, material: "porcelanato ou cerâmica fosca de grande formato", descricao: "Piso com placas grandes, juntas finas e aparência mineral." },
    { name: "janela ampla lateral direita", color: { nome: "vidro translúcido levemente azulado", hex_aproximado: "#BFD3D8" }, material: "vidro com reflexo suave", descricao: "Grande abertura lateral responsável pela entrada de luz natural." },
    { name: "persiana horizontal dupla", color: { nome: "branco acinzentado", hex_aproximado: "#D8D8D2" }, material: "tecido translúcido sintético em faixas horizontais", descricao: "Persiana tipo rolô dupla ou zebra, filtrando a luz natural em faixas." },
    { name: "estrutura da janela", color: { nome: "cinza escuro", hex_aproximado: "#4D514D" }, material: "alumínio pintado ou anodizado", descricao: "Perfis discretos da esquadria ao redor da janela." },
    { name: "espelho de corpo inteiro", color: { nome: "reflexo prateado com borda dourada", hex_aproximado: "#B8B6AD" }, material: "vidro espelhado com moldura metálica dourada fosca", descricao: "Espelho alto apoiado na lateral esquerda do ambiente." },
    { name: "estrutura do espelho", color: { nome: "dourado envelhecido", hex_aproximado: "#9A7A3E" }, material: "metal tubular com acabamento latão fosco", descricao: "Moldura fina e suporte traseiro em formato de cavalete." },
    { name: "prateleira superior esquerda", color: { nome: "branco quente", hex_aproximado: "#EAE6DC" }, material: "madeira pintada ou MDF laqueado fosco", descricao: "Prateleira reta posicionada na lateral esquerda superior." },
    { name: "livros na prateleira", color: { nome: "branco, bege, cinza e preto", hex_aproximado: "#E8E3D8" }, material: "papel impresso com capas foscas e lombadas variadas", descricao: "Conjunto de livros alinhados na prateleira, com capas predominantemente neutras." },
    { name: "abertura ou corredor lateral esquerdo", color: { nome: "cinza claro sombreado", hex_aproximado: "#B7B5AC" }, material: "paredes pintadas foscas e piso cerâmico contínuo", descricao: "Recuo arquitetônico lateral que cria profundidade no lado esquerdo do quarto." }
  ]
};

// ══════════════════════════════════════════════════════════════
// CLAUDE RESPONSE MARKDOWN PARSER
// ══════════════════════════════════════════════════════════════
const parseJSONFromClaude = (text) => {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : text;
    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.error("Failed to parse JSON from Claude:", err);
    throw new Error("Não foi possível converter a resposta da IA em um formato estruturado válido. Saída crua da IA: " + text.slice(0, 100) + "...");
  }
};

function App() {
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Navigation & Workflow States: 'setup' | 'analyzing' | 'generating' | 'slider' | 'editor' | 'error'
  const [phase, setPhase] = useState('setup');
  const [log, setLog] = useState('');
  
  // API Keys (fetched from LocalStorage)
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("stabilityKey") || import.meta.env.VITE_STABILITY_KEY || ""
  );
  const [anthropicKey, setAnthropicKey] = useState(
    () => localStorage.getItem("anthropicKey") || import.meta.env.VITE_ANTHROPIC_KEY || ""
  );
  const [showKeysModal, setShowKeysModal] = useState(false);

  // Save keys to localStorage
  useEffect(() => { localStorage.setItem("stabilityKey", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("anthropicKey", anthropicKey); }, [anthropicKey]);

  // Model file details (upload screenshot as image)
  const [file, setFile] = useState(null);
  
  // Configurations
  const [lighting, setLighting] = useState('fotorrealista'); // 'fotorrealista' | 'noturno' | 'por_do_sol'
  const [preset, setPreset] = useState('modern');
  const [quality, setQuality] = useState('presentation');
  const [renderProgress, setRenderProgress] = useState(0);
  
  // Custom Render Outputs
  const [result, setResult] = useState(null); // Stability AI result (Base64)
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Deep Editor Mapped States (Phase 3)
  const [roomData, setRoomData] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState(null);

  // Interactive UI Selection states
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeMaterial, setActiveMaterial] = useState('grey_linen');

  // UI notifications
  const [notification, setNotification] = useState(null);

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Files handlers
  const handleFileSelected = (fileInfo) => {
    setFile(fileInfo);
    setIsDemoMode(false);
    setResult(null);
    setGeneratedPrompt('');
    setRoomData(null);
    setEditorError(null);
    setEditorLoading(false);
    setPhase('setup');
    triggerNotification(`Print "${fileInfo.name}" carregado.`);
  };

  const handleFileRemoved = () => {
    setFile(null);
    setResult(null);
    setGeneratedPrompt('');
    setIsDemoMode(false);
    setSelectedObject(null);
    setActiveMaterial('grey_linen');
    setRoomData(null);
    setEditorError(null);
    setEditorLoading(false);
    setPhase('setup');
    triggerNotification("Print removido.");
  };

  // Demo Project Loader
  const handleLoadDemo = () => {
    setIsDemoMode(true);
    setFile({
      name: 'sala_moderna_sketchup.png',
      size: '850 KB',
      type: 'Print Demonstrativo',
      dataUrl: `${baseUrl}assets/sketchup_view.png`
    });
    setRoomData(null);
    setEditorError(null);
    setEditorLoading(false);
    setPhase('slider');
    triggerNotification("Projeto demonstrativo carregado!");
  };

  // API Call: Claude Vision analyzes the sketch and generates prompt
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
              text: `You are an expert architectural visualization prompt engineer. Analyze this 3D model screenshot (likely SketchUp or similar) and write a Stable Diffusion img2img prompt for the following render style: ${STYLE_PROMPTS[lighting]}.
              
              Identify and describe: building type, architectural style (modern/contemporary/minimalist/etc), exterior or interior materials visible (glass, concrete, wood, brick, metal panels), vegetation, surrounding landscape, number of floors, notable structural elements.
              
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

  // API Call: Stability AI Sketch Control generates the final render
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

  // Main Generator orchestrator
  const handleRenderStart = async () => {
    if (!file || !file.dataUrl) return;
    if (!apiKey || !anthropicKey) {
      setShowKeysModal(true);
      triggerNotification("Insira suas chaves de API primeiro!");
      return;
    }

    try {
      setPhase('analyzing');
      setLog("Analisando a cena com Claude Vision...");
      setResult(null);
      setGeneratedPrompt("");
      setRoomData(null);
      setEditorError(null);
      setEditorLoading(false);
      setSelectedObject(null);

      // 1. Vision Analysis Prompt Generation
      const prompt = await analyzeWithClaude(file.dataUrl);
      
      // Inject selected preset styles into prompt for improved results
      let finalPrompt = prompt;
      if (preset === 'scandi') finalPrompt = `Scandinavian minimalist design, light wooden floors, soft neutral tones, ` + finalPrompt;
      else if (preset === 'industrial') finalPrompt = `Industrial loft style, brick walls, exposed pipes, steel columns, ` + finalPrompt;
      else if (preset === 'rustico') finalPrompt = `Rustic cabin interior, cozy stone and raw wood elements, warm ambient details, ` + finalPrompt;
      
      setGeneratedPrompt(finalPrompt);

      // 2. Sketch rendering
      setPhase('generating');
      setLog("Gerando render fotorrealista com Stable Diffusion...");

      const renderedImage = await renderWithStability(file.dataUrl, finalPrompt);
      
      setResult(renderedImage);
      setPhase('slider');
      triggerNotification("Projeto renderizado com sucesso!");
    } catch (err) {
      setPhase('error');
      setLog(err.message);
      triggerNotification("Falha na renderização.");
    }
  };

  // API Call: Claude Vision maps the rendered image room contents to JSON
  const analyzeRoomWithClaude = async (base64Image) => {
    const mediaType = base64Image.startsWith("data:") 
      ? base64Image.split(";")[0].split(":")[1]
      : "image/jpeg";
    const imageData = base64Image.startsWith("data:")
      ? base64Image.split(",")[1]
      : base64Image;

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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            {
              type: "text",
              text: `Analise esta imagem de design de interiores e converta todas as informações visuais em um formato JSON estruturado e altamente detalhado. Concentre-se especificamente em isolar objetos individuais. Para cada objeto principal, extraia sua cor precisa (usando nomes descritivos ou códigos hexadecimais) e seu material exato (ex: couro fosco, aço escovado, madeira de carvalho). Inclua JSON para 'room_style', e um array 'objects' contendo 'name', 'color' (com subcampos 'nome' e 'hex_aproximado'), 'material' e 'descricao'. Produza APENAS um JSON válido e formate a saída como um bloco de código JSON copiável usando Markdown (dentro de tags \`\`\`json e \`\`\`). Extraia em português esses dados.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error("Erro Claude (Mapeamento): " + (err.error?.message || response.statusText));
    }
    const data = await response.json();
    return data.content[0].text.trim();
  };

  const handleEnterEditor = async () => {
    setPhase('editor');
    if (roomData) {
      triggerNotification("Mapeamento inteligente ativo.");
      return;
    }

    setEditorLoading(true);
    setEditorError(null);
    triggerNotification("Mapeando elementos do ambiente...");

    if (isDemoMode) {
      // Simulate mapping lag (1.5 seconds) for UX realism
      setTimeout(() => {
        setRoomData(INITIAL_DATA);
        setEditorLoading(false);
        triggerNotification("Sala de demonstração mapeada!");
      }, 1500);
      return;
    }

    try {
      const activeImage = result; // base64 stability output
      if (!activeImage) {
        throw new Error("Nenhuma imagem renderizada disponível para análise.");
      }
      
      const rawText = await analyzeRoomWithClaude(activeImage);
      const parsedJSON = parseJSONFromClaude(rawText);
      
      setRoomData(parsedJSON);
      setEditorLoading(false);
      triggerNotification("Elementos do render mapeados com sucesso!");
    } catch (err) {
      console.error(err);
      setEditorError(err.message);
      setEditorLoading(false);
      triggerNotification("Erro ao mapear o ambiente.");
    }
  };

  const handleExportRender = () => {
    const a = document.createElement("a");
    a.href = getRenderImageLink();
    a.download = `mrender_${lighting}_${Date.now()}.jpg`;
    a.click();
    triggerNotification("Renderização baixada com sucesso!");
  };

  const getRenderImageLink = () => {
    if (isDemoMode) {
      if (lighting === 'fotorrealista') {
        return activeMaterial === 'camel_leather' 
          ? `${baseUrl}assets/day_render_modified.png` 
          : `${baseUrl}assets/day_render.png`;
      } else {
        return `${baseUrl}assets/night_render.png`;
      }
    } else {
      return result;
    }
  };

  const handleResetWorkspace = () => {
    if (window.confirm("Deseja redefinir o espaço de trabalho? Você perderá a renderização atual.")) {
      setPhase('setup');
      setFile(null);
      setResult(null);
      setGeneratedPrompt('');
      setIsDemoMode(false);
      setSelectedObject(null);
      setActiveMaterial('grey_linen');
      setRoomData(null);
      setEditorError(null);
      setEditorLoading(false);
      triggerNotification("Workspace reiniciado.");
    }
  };

  const handleBackToSlider = () => {
    setPhase('slider');
    setSelectedObject(null);
  };

  return (
    <div className="app-container">
      {/* GLOBAL NOTIFICATION BANNER */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          fontSize: '13px',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span>
          <span>{notification}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">M</div>
          <div className="logo-text">M<span>render</span></div>
        </div>

        <div className="header-status">
          {phase === 'setup' && (
            <div className="status-badge">
              <span className="status-dot"></span>
              <span>Aguardando Modelo</span>
            </div>
          )}
          {(phase === 'analyzing' || phase === 'generating') && (
            <div className="status-badge">
              <span className="status-dot" style={{ animation: 'pulse 1s infinite' }}></span>
              <span>Processando IA...</span>
            </div>
          )}
          {(phase === 'slider' || phase === 'editor') && (
            <div className="status-badge">
              <span className="status-dot active"></span>
              <span>Visualizador Ativo</span>
            </div>
          )}

          {file && (
            <button 
              onClick={handleResetWorkspace}
              style={{
                background: 'none',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Resetar Projeto
            </button>
          )}
        </div>
      </header>

      {/* WORKSPACE CONTENT */}
      <main className="workspace">
        {/* Sidebar Controls */}
        <Sidebar 
          phase={phase}
          file={file}
          onFileSelected={handleFileSelected}
          onFileRemoved={handleFileRemoved}
          lighting={lighting}
          setLighting={setLighting}
          preset={preset}
          setPreset={setPreset}
          quality={quality}
          setQuality={setQuality}
          onRenderStart={handleRenderStart}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          activeMaterial={activeMaterial}
          setActiveMaterial={setActiveMaterial}
          onBackToSlider={handleBackToSlider}
          hasKeys={!!apiKey && !!anthropicKey}
          onOpenKeysModal={() => setShowKeysModal(true)}
        />

        {/* Central Display Workspace */}
        <PreviewArea 
          phase={phase}
          lighting={lighting}
          file={file}
          renderProgress={renderProgress}
          onEnterEditor={handleEnterEditor}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          activeMaterial={activeMaterial}
          onExportRender={handleExportRender}
          log={log}
          result={result}
          generatedPrompt={generatedPrompt}
          isDemoMode={isDemoMode}
          onLoadDemo={handleLoadDemo}
          onReset={() => setPhase('setup')}
          onOpenKeysModal={() => setShowKeysModal(true)}
          
          // API Mapping states passed to PreviewArea
          roomData={roomData}
          setRoomData={setRoomData}
          editorLoading={editorLoading}
          editorError={editorError}
        />
      </main>

      {/* KEY CONFIGURATION MODAL (Glassmorphism Overlay) */}
      {showKeysModal && (
        <div className="r-overlay" onClick={() => setShowKeysModal(false)}>
          <div className="r-modal" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-accent)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 className="r-modal-title" style={{ color: 'var(--text-primary)' }}>Configurações de API</h3>
            <p className="r-modal-sub" style={{ color: 'var(--text-secondary)' }}>
              Insira suas chaves de API abaixo para conectar a aplicação ao <strong>Claude Vision (Anthropic)</strong> e ao <strong>Stability AI (Sketch Control)</strong>.
            </p>

            <div className="control-group" style={{ marginBottom: '16px' }}>
              <label className="r-in-label" style={{ color: 'var(--text-secondary)' }}>Chave Anthropic (Claude API)</label>
              <input 
                className="r-input" 
                type="password" 
                placeholder="sk-ant-..." 
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div className="control-group" style={{ marginBottom: '16px' }}>
              <label className="r-in-label" style={{ color: 'var(--text-secondary)' }}>Chave Stability AI</label>
              <input 
                className="r-input" 
                type="password" 
                placeholder="sk-..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px'
                }}
              />
            </div>

            <p className="r-modal-note" style={{ color: 'var(--text-muted)' }}>
              * Suas chaves ficam guardadas de forma segura apenas no navegador atual (LocalStorage) e são enviadas diretamente para as APIs das empresas parceiras.
            </p>

            <div className="r-modal-btns">
              <button className="r-cancel" onClick={() => setShowKeysModal(false)}>Fechar</button>
              <button className="r-save" onClick={() => {
                setShowKeysModal(false);
                triggerNotification("Configurações salvas.");
              }} style={{
                backgroundColor: 'var(--accent)',
                color: '#000',
                fontWeight: '700'
              }}>Salvar e Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
