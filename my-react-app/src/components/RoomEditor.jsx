import React, { useState, useRef } from 'react';

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function deepSet(obj, [h, ...t], v) {
  if (!t.length) {
    if (Array.isArray(obj)) { const a = [...obj]; a[+h] = v; return a; }
    return { ...obj, [h]: v };
  }
  if (Array.isArray(obj)) { const a = [...obj]; a[+h] = deepSet(a[+h], t, v); return a; }
  return { ...obj, [h]: deepSet(obj[h], t, v) };
}

const isValidHex = (h) => /^#[0-9A-Fa-f]{6}$/.test(h);

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function FieldLabel({ children }) {
  return (
    <div style={{ 
      fontSize: 10, 
      textTransform: "uppercase", 
      letterSpacing: "1px", 
      color: "var(--accent)", 
      marginBottom: 6, 
      fontWeight: 600 
    }}>
      {children}
    </div>
  );
}

function Editable({ value, onChange, multiline, mono, size = 13 }) {
  const [on, setOn] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { if (draft !== value) onChange(draft); setOn(false); };
  const cancel = () => { setDraft(value); setOn(false); };

  const inputStyle = {
    fontFamily: mono ? "'Courier New', Courier, monospace" : "inherit",
    fontSize: size,
    color: "var(--text-primary)",
    background: "rgba(223, 177, 91, 0.05)",
    border: "1.5px solid var(--accent)",
    borderRadius: 6,
    padding: "4px 10px",
    width: "100%",
    outline: "none",
    lineHeight: 1.55,
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    transition: "border-color 0.15s",
  };

  if (on) {
    const shared = {
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e) => {
        if (e.key === "Escape") cancel();
        if (!multiline && e.key === "Enter") commit();
      },
      autoFocus: true,
      style: inputStyle,
    };
    return multiline
      ? <textarea {...shared} rows={3} />
      : <input type="text" {...shared} />;
  }

  return (
    <span
      onClick={() => { setDraft(value); setOn(true); }}
      title="Clique para editar"
      className="editable-span"
      style={{
        cursor: "text",
        fontFamily: mono ? "'Courier New', monospace" : "inherit",
        fontSize: size,
        lineHeight: 1.55,
        display: "inline-block",
        borderRadius: 4,
        padding: "2px 4px",
        color: "var(--text-primary)",
        wordBreak: "break-word",
        transition: "background 0.2s",
        borderBottom: "1px dashed rgba(255,255,255,0.15)"
      }}
    >
      {value}
      <span className="edit-pencil" style={{ marginLeft: 6, opacity: 0.3, fontSize: 10, color: "var(--accent)", userSelect: "none" }}>✎</span>
    </span>
  );
}

function ColorField({ hex, name, onHexChange, onNameChange }) {
  const safe = isValidHex(hex) ? hex : "#888888";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ 
        width: 24, 
        height: 24, 
        minWidth: 24, 
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: "var(--shadow-sm)",
        border: "2px solid rgba(255, 255, 255, 0.15)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <input
          type="color"
          value={safe}
          onChange={(e) => onHexChange(e.target.value)}
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            width: '32px',
            height: '32px',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: 'none',
            WebkitAppearance: 'none'
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div>
          <Editable value={hex} onChange={onHexChange} mono size={11} />
        </div>
        <div>
          <Editable value={name} onChange={onNameChange} size={11} />
        </div>
      </div>
    </div>
  );
}

function ObjectCard({ obj, index, onUpdate, isSelected, onCardSelect }) {
  const safe = isValidHex(obj.color.hex_aproximado) ? obj.color.hex_aproximado : "#999";
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      onClick={onCardSelect}
      style={{
        background: "var(--bg-panel)",
        borderRadius: 10,
        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border-primary)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "var(--transition-smooth)",
        cursor: 'pointer',
        boxShadow: isSelected ? "0 0 12px rgba(223, 177, 91, 0.2)" : "none"
      }}
    >
      <div style={{ height: 4, background: safe, flexShrink: 0 }} />

      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Index + Name */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, minWidth: 16, letterSpacing: 0.5 }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }} onClick={(e) => e.stopPropagation()}>
            <Editable value={obj.name} onChange={(v) => onUpdate(["name"], v)} size={13} />
          </div>
        </div>

        {/* Color */}
        <div onClick={(e) => e.stopPropagation()}>
          <FieldLabel>Cor</FieldLabel>
          <ColorField
            hex={obj.color.hex_aproximado}
            name={obj.color.nome}
            onHexChange={(v) => onUpdate(["color", "hex_aproximado"], v)}
            onNameChange={(v) => onUpdate(["color", "nome"], v)}
          />
        </div>

        {/* Material */}
        <div onClick={(e) => e.stopPropagation()}>
          <FieldLabel>Material</FieldLabel>
          <Editable value={obj.material} onChange={(v) => onUpdate(["material"], v)} multiline size={12} />
        </div>

        {/* Descrição */}
        <div onClick={(e) => e.stopPropagation()}>
          <FieldLabel>Descrição</FieldLabel>
          <Editable value={obj.descricao} onChange={(v) => onUpdate(["descricao"], v)} multiline size={12} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN ROOM EDITOR PANEL
// ══════════════════════════════════════════════════════════════

export default function RoomEditor({
  data,
  setData,
  selectedObject,
  setSelectedObject
}) {
  const [showJSON, setShowJSON] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  if (!data) return null;

  const update = (path, value) => setData((d) => deepSet(d, path, value));

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCardSelected = (objName) => {
    if (!selectedObject) return false;
    if (selectedObject.name === objName) return true;
    const nameLow = objName.toLowerCase();
    const activeId = selectedObject.id;

    if (activeId === 'sofa' && (nameLow.includes('sofa') || nameLow.includes('cama'))) return true;
    if (activeId === 'floor' && (nameLow.includes('piso') || nameLow.includes('chão') || nameLow.includes('floor'))) return true;
    if (activeId === 'fireplace' && (nameLow.includes('lareira') || nameLow.includes('fireplace') || nameLow.includes('aquecedor'))) return true;
    if (activeId === 'lamp' && (nameLow.includes('luminaria') || nameLow.includes('lamp') || nameLow.includes('pendente') || nameLow.includes('abajur'))) return true;

    return false;
  };

  // Handle card selection to bind back to visual hotspots
  const handleCardSelect = (obj) => {
    const nameLow = obj.name.toLowerCase();
    let mockId = 'other';
    
    if (nameLow.includes('sofa') || nameLow.includes('cama')) mockId = 'sofa';
    else if (nameLow.includes('piso') || nameLow.includes('chão') || nameLow.includes('floor')) mockId = 'floor';
    else if (nameLow.includes('lareira') || nameLow.includes('fireplace')) mockId = 'fireplace';
    else if (nameLow.includes('luminaria') || nameLow.includes('lamp') || nameLow.includes('pendente')) mockId = 'lamp';

    setSelectedObject({
      id: mockId,
      name: obj.name,
      type: mockId === 'sofa' ? 'Mobiliário' : mockId === 'floor' ? 'Material' : mockId === 'lamp' ? 'Iluminação' : 'Estrutura'
    });
  };

  const filtered = data.objects.filter(
    (o) =>
      search === "" ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.color?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      o.material?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      color: "var(--text-primary)",
      minHeight: "100%",
      overflowX: "hidden"
    }}>
      {/* ── HEADER & ACTIONS ─────────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border-primary)",
        paddingBottom: "16px"
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-family)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)"
          }}>
            Editor de Metadados do Ambiente
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Mapeado por IA • Clique nos textos sublinhados para alterar
          </p>
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowJSON((s) => !s)}
            className="toolbar-btn"
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            {showJSON ? "Ocultar JSON" : "Ver JSON"}
          </button>
          <button
            onClick={handleCopy}
            className="toolbar-btn highlight"
            style={{ 
              fontSize: '11px', 
              padding: '6px 12px',
              backgroundColor: copied ? 'var(--success)' : 'transparent',
              borderColor: copied ? 'var(--success)' : 'var(--border-accent)',
              color: copied ? '#fff' : 'var(--accent)'
            }}
          >
            {copied ? "✓ Copiado" : "Copiar JSON"}
          </button>
        </div>
      </div>

      {/* ── JSON VIEWER ──────────────────────────────────── */}
      {showJSON && (
        <div style={{
          background: "#080706",
          borderRadius: 8,
          border: "1px solid var(--border-accent)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ 
            padding: "8px 12px", 
            borderBottom: "1px solid var(--border-primary)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <span style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 0.5, textTransform: "uppercase" }}>Visualizador JSON</span>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{JSON.stringify(data).length.toLocaleString()} chars</span>
          </div>
          <pre style={{
            margin: 0,
            padding: "12px",
            fontSize: 10,
            color: "var(--text-secondary)",
            fontFamily: "monospace",
            lineHeight: 1.5,
            maxHeight: 250,
            overflow: "auto",
            backgroundColor: '#050403'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* ── ROOM STYLE CARD ──────────────────────────── */}
      <section style={{
        background: "var(--bg-surface)",
        borderRadius: 12,
        border: "1px solid var(--border-primary)",
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "16px" }}>
          <div style={{ width: 3, height: 16, background: "var(--accent)", borderRadius: 2 }} />
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)"
          }}>
            Estilo Arquitetônico Geral
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <FieldLabel>Estilo</FieldLabel>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <Editable
                value={data.room_style.nome}
                onChange={(v) => update(["room_style", "nome"], v)}
                size={14}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Descrição do Design</FieldLabel>
            <Editable
              value={data.room_style.descricao}
              onChange={(v) => update(["room_style", "descricao"], v)}
              multiline
              size={12}
            />
          </div>
        </div>

        {/* Palette */}
        <div style={{ marginBottom: "16px" }}>
          <FieldLabel>Paleta Cromática Mapeada</FieldLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {data.room_style.paleta_geral?.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-primary)",
                  borderTop: `3px solid ${isValidHex(c.hex_aproximado) ? c.hex_aproximado : "#ccc"}`,
                  borderRadius: 6,
                  padding: "8px",
                  flex: "1 1 120px",
                  maxWidth: "140px",
                }}
              >
                <ColorField
                  hex={c.hex_aproximado}
                  name={c.cor}
                  onHexChange={(v) => update(["room_style", "paleta_geral", i, "hex_aproximado"], v)}
                  onNameChange={(v) => update(["room_style", "paleta_geral", i, "cor"], v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        {data.room_style.materiais_predominantes && (
          <div>
            <FieldLabel>Materiais Predominantes</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {data.room_style.materiais_predominantes.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                  }}
                >
                  <Editable
                    value={m}
                    onChange={(v) => update(["room_style", "materiais_predominantes", i], v)}
                    size={11}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── OBJECTS SECTION ─────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 16, background: "var(--accent)", borderRadius: 2 }} />
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)"
            }}>
              Lista de Objetos Detectados
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ({filtered.length} de {data.objects.length})
            </span>
          </div>
          
          {/* Search bar */}
          <input
            type="search"
            placeholder="Filtrar objetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              color: "var(--text-primary)",
              outline: "none",
              width: 150,
              transition: 'var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 10,
          overflowY: 'visible'
        }}>
          {filtered.map((obj) => {
            const originalIndex = data.objects.indexOf(obj);
            const isSelected = isCardSelected(obj.name);
            return (
              <ObjectCard
                key={originalIndex}
                obj={obj}
                index={originalIndex}
                onUpdate={(field, value) => update(["objects", originalIndex, ...field], value)}
                isSelected={isSelected}
                onCardSelect={() => handleCardSelect(obj)}
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: 12 }}>
            Nenhum objeto encontrado para "{search}"
          </div>
        )}
      </section>
    </div>
  );
}
