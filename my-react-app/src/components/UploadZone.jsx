import React, { useState, useRef } from 'react';

export default function UploadZone({ file, onFileSelected, onFileRemoved }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndProcessFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndProcessFile(selectedFile);
    }
  };

  const validateAndProcessFile = (fileToVerify) => {
    if (!fileToVerify || !fileToVerify.type.startsWith("image/")) {
      alert("Por favor, envie uma imagem (print do SketchUp em formato PNG ou JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelected({
        name: fileToVerify.name,
        size: (fileToVerify.size / (1024 * 1024)).toFixed(1) + ' MB',
        type: 'Print do SketchUp',
        dataUrl: e.target.result
      });
    };
    reader.readAsDataURL(fileToVerify);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="control-group">
      <label className="control-label">Print do SketchUp</label>
      
      {!file ? (
        <div 
          className={`upload-container ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input 
            ref={fileInputRef}
            type="file"
            className="hidden-file-input"
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleChange}
          />
          
          <div className="upload-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          
          <p className="upload-text">
            <span>Arraste o print do SketchUp</span><br />
            ou clique para selecionar
          </p>
          <p className="upload-hint">
            Imagens PNG, JPG ou JPEG (Máx. 10MB)
          </p>
        </div>
      ) : (
        <div className="file-info-card">
          <div className="file-details">
            <div className="file-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="file-name" title={file.name}>{file.name}</p>
              <p className="file-size">{file.type} • {file.size}</p>
            </div>
          </div>
          
          <button 
            type="button" 
            className="btn-remove-file"
            onClick={(e) => {
              e.stopPropagation();
              onFileRemoved();
            }}
            title="Remover arquivo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
