import React from 'react';
import UploadZone from './UploadZone';

export default function Sidebar({
  phase, // 'setup' | 'rendering' | 'slider' | 'editor' | 'error' | 'analyzing' | 'generating'
  file,
  onFileSelected,
  onFileRemoved,
  lighting, // 'fotorrealista' | 'noturno' | 'por_do_sol'
  setLighting,
  preset,
  setPreset,
  quality,
  setQuality,
  onRenderStart,
  selectedObject, // null | { id, name, type }
  setSelectedObject,
  activeMaterial, // 'grey_linen' | 'camel_leather'
  setActiveMaterial,
  onBackToSlider,
  hasKeys,
  onOpenKeysModal
}) {

  const presetsList = [
    { id: 'modern', title: 'Vila Moderna', desc: 'Minimalismo com concreto e vidro' },
    { id: 'scandi', title: 'Loft Escandinavo', desc: 'Madeira clara e tons neutros' },
    { id: 'industrial', title: 'Industrial Chic', desc: 'Tijolo exposto e vigas metálicas' },
    { id: 'rustico', title: 'Cabana Rústica', desc: 'Elementos aconchegantes de pedra/troncos' }
  ];

  const isLoading = phase === 'rendering' || phase === 'analyzing' || phase === 'generating';
  const showSetupControls = phase === 'setup' || isLoading || phase === 'slider' || phase === 'error';

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        
        {/* PHASE 1 & 2 & SLIDER / ERROR: Setup Controls */}
        {showSetupControls && (
          <>
            <div>
              <h3 className="section-title">Importar Arquivo</h3>
              <UploadZone 
                file={file}
                onFileSelected={onFileSelected}
                onFileRemoved={onFileRemoved}
              />
            </div>

            {/* API Keys Configuration Status Indicator */}
            <div className="control-group" style={{ gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="control-label" style={{ fontSize: '11px' }}>APIs de Inteligência Artificial</span>
                <button 
                  onClick={onOpenKeysModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  disabled={isLoading}
                >
                  {hasKeys ? 'Alterar Chaves' : 'Inserir Chaves'}
                </button>
              </div>
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.15)',
                border: `1px solid ${hasKeys ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '6px',
                fontSize: '11px',
                color: hasKeys ? 'var(--text-secondary)' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className={`status-dot ${hasKeys ? 'active' : ''}`} style={{ backgroundColor: hasKeys ? 'var(--success)' : '#ef4444', boxShadow: hasKeys ? '0 0 6px var(--success)' : 'none' }}></span>
                <span>{hasKeys ? 'API Claude & Stability configuradas' : 'Insira as chaves de API para gerar renders reais'}</span>
              </div>
            </div>

            <div className="control-group">
              <h3 className="section-title">Ajustes do Render</h3>
              <label className="control-label" style={{ marginBottom: '6px' }}>Estilo de Iluminação</label>
              <div className="pill-selector" style={{ flexDirection: 'column', gap: '4px', background: 'rgba(0, 0, 0, 0.15)', padding: '5px' }}>
                <button 
                  className={`pill-option ${lighting === 'fotorrealista' ? 'active' : ''}`}
                  onClick={() => setLighting('fotorrealista')}
                  disabled={isLoading}
                  style={{ width: '100%', padding: '6px' }}
                >
                  ☀️ Diurno (Natural)
                </button>
                <button 
                  className={`pill-option ${lighting === 'noturno' ? 'active' : ''}`}
                  onClick={() => setLighting('noturno')}
                  disabled={isLoading}
                  style={{ width: '100%', padding: '6px' }}
                >
                  🌙 Noturno (Artificial)
                </button>
                <button 
                  className={`pill-option ${lighting === 'por_do_sol' ? 'active' : ''}`}
                  onClick={() => setLighting('por_do_sol')}
                  disabled={isLoading}
                  style={{ width: '100%', padding: '6px' }}
                >
                  🌅 Pôr do Sol (Golden Hour)
                </button>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label" style={{ marginBottom: '6px' }}>Estilo & Ambiente</label>
              <div className="preset-grid">
                {presetsList.map(p => (
                  <div 
                    key={p.id}
                    className={`preset-card ${preset === p.id ? 'active' : ''}`}
                    onClick={() => setPreset(p.id)}
                    style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                  >
                    <span className="preset-title">{p.title}</span>
                    <span className="preset-desc">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label className="control-label" style={{ marginBottom: '6px' }}>Qualidade de Saída</label>
              <div className="pill-selector">
                {['draft', 'presentation', 'ultra'].map((q) => (
                  <button
                    key={q}
                    className={`pill-option ${quality === q ? 'active' : ''}`}
                    onClick={() => setQuality(q)}
                    disabled={isLoading}
                  >
                    {q === 'draft' ? 'Draft' : q === 'presentation' ? 'HD' : 'Ultra-HD'}
                  </button>
                ))}
              </div>
            </div>

            {(phase === 'setup' || phase === 'error') && (
              <button 
                className="btn-render" 
                disabled={!file || !hasKeys}
                onClick={onRenderStart}
                style={{
                  opacity: (!file || !hasKeys) ? 0.4 : 1,
                  cursor: (!file || !hasKeys) ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Renderizar com IA
              </button>
            )}

            {isLoading && (
              <button className="btn-render" disabled>
                <svg className="loading-spinner-btn" style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" />
                </svg>
                {phase === 'analyzing' ? 'Analisando Imagem...' : 'Gerando Imagem...'}
              </button>
            )}

            {phase === 'slider' && (
              <div className="status-badge" style={{ justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
                <span className="status-dot active"></span>
                <span>Render Gerado com Sucesso</span>
              </div>
            )}
          </>
        )}

        {/* PHASE 3: Interactive Deep Editor Mode */}
        {phase === 'editor' && (
          <>
            <div className="editor-title-container">
              <button 
                className="btn-back-editor" 
                onClick={onBackToSlider}
                title="Voltar para visualização"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div>
                <p className="editor-object-type">Personalizador Inteligente</p>
                <h3 className="editor-object-header">Editor de Materiais</h3>
              </div>
            </div>

            {!selectedObject ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(223, 177, 91, 0.05)', border: '1px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--accent)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                  A Inteligência Artificial mapeou os elementos da cena! 
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Passe o mouse sobre o render realista e <strong>clique em um objeto</strong> (como o sofá) para alterar suas cores e texturas manualmente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '700', letterSpacing: '0.05em' }}>Elemento Mapeado</span>
                    <button 
                      onClick={() => setSelectedObject(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Limpar seleção
                    </button>
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{selectedObject.name}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Categoria: {selectedObject.type}</p>
                </div>

                {selectedObject.id === 'sofa' && (
                  <>
                    <div className="control-group">
                      <span className="control-label">Uso de Revestimento (Materiais)</span>
                      <div className="material-grid">
                        <div 
                          className={`material-card ${activeMaterial === 'grey_linen' ? 'active' : ''}`}
                          onClick={() => setActiveMaterial('grey_linen')}
                        >
                          <div className="material-preview-sphere" style={{ backgroundColor: '#5f656d' }} />
                          <span className="material-name">Linho Cinza</span>
                        </div>
                        <div 
                          className={`material-card ${activeMaterial === 'camel_leather' ? 'active' : ''}`}
                          onClick={() => setActiveMaterial('camel_leather')}
                        >
                          <div className="material-preview-sphere" style={{ backgroundColor: '#8a5c37', backgroundImage: 'radial-gradient(circle at 30% 30%, #a87243 0%, #6e4424 70%)' }} />
                          <span className="material-name">Couro Caramelo</span>
                        </div>
                        <div 
                          className="material-card"
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                          title="Indisponível neste demonstrador"
                        >
                          <div className="material-preview-sphere" style={{ backgroundColor: '#2f3b35' }} />
                          <span className="material-name">Veludo Verde</span>
                        </div>
                      </div>
                    </div>

                    <div className="control-group">
                      <span className="control-label">Paleta de Cores Recomendadas</span>
                      <div className="color-swatch-list">
                        <span 
                          className={`color-swatch ${activeMaterial === 'grey_linen' ? 'active' : ''}`}
                          style={{ backgroundColor: '#5f656d' }}
                          onClick={() => setActiveMaterial('grey_linen')}
                          title="Cinza Basalto"
                        />
                        <span 
                          className={`color-swatch ${activeMaterial === 'camel_leather' ? 'active' : ''}`}
                          style={{ backgroundColor: '#8a5c37' }}
                          onClick={() => setActiveMaterial('camel_leather')}
                          title="Cognac Caramelo"
                        />
                        <span 
                          className="color-swatch" 
                          style={{ backgroundColor: '#d4af37', opacity: 0.4 }} 
                          title="Mostarda (Não disponível)"
                        />
                        <span 
                          className="color-swatch" 
                          style={{ backgroundColor: '#10b981', opacity: 0.4 }} 
                          title="Esmeralda Muted (Não disponível)"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedObject.id !== 'sofa' && (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-primary)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Opções de Texturas & Cores</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', lineHeight: '1.4' }}>
                      Neste protótipo visual, criamos a simulação interativa completa para o <strong>Sofá</strong> (clique nele para trocar entre Linho Cinza e Couro Caramelo).
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <div className="status-badge" style={{ fontSize: '11px', padding: '8px 12px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: 'var(--text-secondary)' }}>Mapeamento de Malha Ativo</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Edição manual direta habilitada sobre a geometria gerada por IA.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </aside>
  );
}
