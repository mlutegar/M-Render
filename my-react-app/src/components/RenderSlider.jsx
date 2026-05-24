import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function RenderSlider({ beforeImage, afterImage, afterImageStyle }) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up window listeners to handle drag when cursor leaves the slider
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    // Move immediately to click position
    handleMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div 
      className="slider-container" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After Image (Render) - Base layer */}
      <img 
        src={afterImage} 
        alt="Renderizado Realista" 
        className="slider-image after-image" 
        style={afterImageStyle}
      />
      <div className="slider-label after">Render Realista</div>
      
      {/* Before Image (SketchUp draft) - Overlay layer with dynamic width */}
      <div 
        className="before-image-container"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Modelo SketchUp" 
          className="slider-image before-image"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100vw' }}
        />
        <div className="slider-label before">Modelo SketchUp</div>
      </div>
      
      {/* Handle Divider Line */}
      <div 
        className="slider-handle-line" 
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Drag Button */}
        <div className="slider-handle-button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 18 2 12 8 6" />
            <polyline points="16 6 22 12 16 18" />
          </svg>
        </div>
      </div>
    </div>
  );
}
