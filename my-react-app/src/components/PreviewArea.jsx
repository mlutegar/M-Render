import React, { useState } from 'react';
import RenderSlider from './RenderSlider';
import RoomEditor from './RoomEditor';

export default function PreviewArea({
  phase, // 'setup' | 'rendering' | 'slider' | 'editor' | 'error' | 'analyzing' | 'generating'
  lighting, // 'fotorrealista' | 'noturno' | 'por_do_sol'
  file,
  renderProgress,
  onEnterEditor,
  selectedObject,
  setSelectedObject,
  activeMaterial,
  onExportRender,
  log, // API logs
  result, // Stability AI result image (base64/url)
  generatedPrompt, // Claude generated prompt
  isDemoMode,
  onLoadDemo,
  onReset,
  onOpenKeysModal,
  
  // API Mapping states
  roomData,
  setRoomData,
  editorLoading,
  editorError
}) {
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Handle hotspot mouse moves to position tooltips
  const handleMouseMove = (e, name) => {
    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - parentRect.left,
      y: e.clientY - parentRect.top
    });
    setHoveredHotspot(name);
  };

  const handleMouseLeave = () => {
    setHoveredHotspot(null);
  };

  const baseUrl = import.meta.env.BASE_URL || '/';

  // Determine current active render image based on lighting and materials
  const getRenderImage = () => {
    if (isDemoMode) {
      if (lighting === 'fotorrealista') {
        return activeMaterial === 'camel_leather' 
          ? `${baseUrl}assets/day_render_modified.png` 
          : `${baseUrl}assets/day_render.png`;
      } else if (lighting === 'noturno') {
        return `${baseUrl}assets/night_render.png`;
      } else {
        return `${baseUrl}assets/night_render.png`; // Fallback
      }
    } else {
      return result; // Custom AI render result
    }
  };

  const getBeforeImage = () => {
    return isDemoMode ? `${baseUrl}assets/sketchup_view.png` : file?.dataUrl;
  };

  const isLoading = phase === 'analyzing' || phase === 'generating' || phase === 'rendering';

  return (
    <div className="preview-area">
      {/* 1. SETUP STATE */}
      {phase === 'setup' && (
        <div className="blueprint-grid">
          <div className="blueprint-content">
            <div className="blueprint-compass"></div>
            <h2 className="blueprint-title">Workspace Mrender</h2>
            <p className="blueprint-desc">
              {file 
                ? `Print "${file.name}" carregado. Clique em "Renderizar com IA" para iniciar o processamento.`
                : "Envie um print do seu modelo 3D (SketchUp, Revit, etc.) ou use o projeto demonstrativo abaixo para testar as interações."
              }
            </p>
            {!file && (
              <button 
                onClick={onLoadDemo}
                className="btn-prompt-yes"
                style={{ marginTop: '10px', display: 'inline-flex', alignSelf: 'center' }}
              >
                Carregar Projeto Demonstrativo
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. LOADING STATE (REAL AI OR MOCK) */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="laser-scanner"></div>

          <div className="loading-circle-container">
            <div className="loading-spinner"></div>
            <div className="loading-percentage">
              {phase === 'analyzing' ? '35%' : phase === 'generating' ? '75%' : `${renderProgress}%`}
            </div>
          </div>
          
          <div style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <p className="loading-status-text">
              {phase === 'analyzing' && "Preparando modelo e prompt..."}
              {phase === 'generating' && "OpenAI gpt‑image‑1 renderizando..."}
              {phase === 'rendering' && "Processando imagem..."}
            </p>
            <p style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '6px', fontFamily: 'monospace' }}>
              {log || "Processando matrizes de iluminação e profundidade..."}
            </p>
          </div>

          <div className="loading-stages">
            <div className={`stage-item ${(phase === 'analyzing' || phase === 'rendering') ? 'active' : 'completed'}`}>
              <span className="stage-dot"></span>
              <span>Preparando imagem e prompt</span>
            </div>
            <div className={`stage-item ${phase === 'generating' ? 'active' : (phase === 'slider' || result) ? 'completed' : ''}`}>
              <span className="stage-dot"></span>
              <span>Render fotorrealista (OpenAI)</span>
            </div>
            <div className={`stage-item ${phase === 'done' ? 'completed' : ''}`}>
              <span className="stage-dot"></span>
              <span>Finalização e pós-processamento</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLIDER COMPARISON STATE */}
      {phase === 'slider' && (
        <div className="preview-workspace">
          <RenderSlider 
            beforeImage={getBeforeImage()}
            afterImage={getRenderImage()}
          />

          {/* Floating Action dialogue card */}
          <div className="prompt-overlay">
            <div className="prompt-message">
              <span className="prompt-title">Renderização Concluída</span>
              <p className="prompt-text">
                Gostaria de fazer alguma alteração? Nossa IA mapeou o ambiente e você pode personalizar cada elemento individualmente.
              </p>
            </div>
            <div className="prompt-actions">
              <button className="btn-prompt-no" onClick={onExportRender}>
                Baixar Render
              </button>
              <button className="btn-prompt-yes" onClick={onEnterEditor}>
                Personalizar Elementos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEEP INTERACTIVE EDITOR STATE */}
      {phase === 'editor' && (
        <div className="editor-layout" style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>

          {/* Left panel: Render image preview (40% width) */}
          <div className="editor-image-panel" style={{
            width: '40%',
            height: '100%',
            position: 'relative',
            borderRight: '1px solid var(--border-primary)',
            backgroundColor: '#050607'
          }}>
            {!isDemoMode && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(223, 177, 91, 0.95)',
                color: '#000',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                zIndex: 10,
                boxShadow: 'var(--shadow-md)',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                Ajuste os valores nos cards do painel
              </div>
            )}
            
            <img 
              src={getRenderImage()} 
              alt="Mrender Editor" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Hover hotspots map (Only active in Demo Mode to guarantee visual alignment) */}
            {isDemoMode && (
              <>
                <svg 
                  viewBox="0 0 100 100" 
                  className="editor-interactive-svg"
                  preserveAspectRatio="none"
                >
                  {/* Sofa Hotspot */}
                  <polygon
                    points="47,51 57,48 77,52 87,54 87,63 64,84 47,72"
                    className={`interactive-hotspot ${selectedObject?.id === 'sofa' ? 'active' : ''}`}
                    onMouseMove={(e) => handleMouseMove(e, 'sofa')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setSelectedObject({ id: 'sofa', name: 'Sofá de Estúdio 3 Lugares', type: 'Mobiliário' })}
                  />

                  {/* Wooden Floor Hotspot */}
                  <polygon
                    points="0,60 47,72 64,84 87,63 100,60 100,100 0,100"
                    className={`interactive-hotspot ${selectedObject?.id === 'floor' ? 'active' : ''}`}
                    onMouseMove={(e) => handleMouseMove(e, 'floor')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setSelectedObject({ id: 'floor', name: 'Piso Tábuas Corridas Carvalho', type: 'Material' })}
                  />

                  {/* Fireplace Hotspot */}
                  <polygon
                    points="32,44 45,44 45,58 32,58"
                    className={`interactive-hotspot ${selectedObject?.id === 'fireplace' ? 'active' : ''}`}
                    onMouseMove={(e) => handleMouseMove(e, 'fireplace')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setSelectedObject({ id: 'fireplace', name: 'Lareira Embutida Concreto', type: 'Estrutura' })}
                  />

                  {/* Pendant Lamp Hotspot */}
                  <polygon
                    points="45,16 51,16 51,31 45,31"
                    className={`interactive-hotspot ${selectedObject?.id === 'lamp' ? 'active' : ''}`}
                    onMouseMove={(e) => handleMouseMove(e, 'lamp')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setSelectedObject({ id: 'lamp', name: 'Luminária Pendente Âmbar', type: 'Iluminação' })}
                  />
                </svg>

                {hoveredHotspot && (
                  <div 
                    className="hotspot-tooltip"
                    style={{ 
                      left: `${tooltipPos.x}px`, 
                      top: `${tooltipPos.y}px`, 
                      position: 'absolute' 
                    }}
                  >
                    {hoveredHotspot === 'sofa' && "Sofá • Mobiliário (Sincronizado)"}
                    {hoveredHotspot === 'floor' && "Piso • Carvalho Quente"}
                    {hoveredHotspot === 'fireplace' && "Lareira • Concreto Texturizado"}
                    {hoveredHotspot === 'lamp' && "Pendente • Luz Quente"}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right panel: Room Style Editor panel (60% width) */}
          <div className="editor-data-panel" style={{ width: '60%', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
            {editorLoading ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                padding: '40px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div className="laser-scanner"></div>
                <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>Mapeando elementos com Claude Vision...</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '300px', margin: '4px auto 0' }}>
                    A inteligência artificial está isolando objetos individuais, materiais e paleta de cores.
                  </p>
                </div>
              </div>
            ) : editorError ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Falha no Mapeamento de Ambiente</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '6px', maxWidth: '340px', wordBreak: 'break-all' }}>
                    {editorError}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={onReset} className="btn-prompt-no">
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <RoomEditor 
                data={roomData}
                setData={setRoomData}
                selectedObject={selectedObject}
                setSelectedObject={setSelectedObject}
              />
            )}
          </div>
        </div>
      )}

      {/* 5. ERROR STATE */}
      {phase === 'error' && (
        <div className="blueprint-grid">
          <div className="blueprint-content" style={{ borderColor: '#ef4444' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#ef4444', marginBottom: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 className="blueprint-title" style={{ color: '#ef4444' }}>Erro na Geração</h2>
            <p className="blueprint-desc" style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>
              {log || "Falha desconhecida na API externa de renderização."}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '320px' }}>
              O servidor de renderização pode estar iniciando (aguarde ~30s) ou ainda não estar configurado.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={onReset} className="btn-prompt-no">
                Voltar e Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM TOOLBAR */}
      <div className="preview-toolbar">
        <div className="toolbar-info">
          {phase === 'setup' && "Aguardando inicialização"}
          {isLoading && "Renderizando com IA: Claude Vision + Stability AI"}
          {phase === 'slider' && "Visualizando Comparação Antes/Depois"}
          {phase === 'editor' && (
            selectedObject 
              ? `Editando elemento: ${selectedObject.name}` 
              : "Modo de Edição Direta: Selecione um objeto clicando na imagem ou nos cards"
          )}
          {phase === 'error' && "Falha na resposta da API"}
        </div>
        
        <div className="toolbar-actions">
          {generatedPrompt && (
            <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prompt da IA:</span>
              <span 
                style={{
                  fontSize: '11px', 
                  color: 'var(--accent)', 
                  maxWidth: '200px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontFamily: 'monospace'
                }}
                title={generatedPrompt}
              >
                {generatedPrompt}
              </span>
            </div>
          )}
          {(phase === 'slider' || phase === 'editor') && (
            <>
              <button className="toolbar-btn" onClick={onExportRender}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Baixar Render
              </button>
              {phase === 'slider' && (
                <button className="toolbar-btn highlight" onClick={onEnterEditor}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Personalizar Elementos
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
