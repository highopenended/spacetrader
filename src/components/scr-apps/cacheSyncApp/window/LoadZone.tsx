import React, { useRef, useState } from 'react';
import './LoadZone.css';

interface LoadZoneProps {
  onFileLoad: (file: File) => void;
}

const LoadZone: React.FC<LoadZoneProps> = ({ onFileLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.scrap')) {
      onFileLoad(file);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const scrapFile = files.find(file => file.name.endsWith('.scrap'));
    
    if (scrapFile) {
      onFileLoad(scrapFile);
    }
  };

  return (
    <div 
      className={`load-zone ${isDragOver ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="load-zone-content">
        <div className="load-zone-icon">📁</div>
        <div className="load-zone-text">
          <div className="load-zone-title">Drop .scrap file here</div>
          <div className="load-zone-subtitle">or click to browse</div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".scrap"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default LoadZone; 