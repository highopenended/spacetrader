import React from 'react';
import './LoadSection.css';
import LoadZone from './LoadZone';

interface LoadSectionProps {
  onLoadFromCache: () => boolean;
  onFileLoad: (file: File) => Promise<boolean>;
  loadCost: number;
}

const LoadSection: React.FC<LoadSectionProps> = ({ onLoadFromCache, onFileLoad, loadCost }) => {
  return (
    <div className="load-section">
      <div className="section-header">
        <div className="detail-label">Load Game</div>
      </div>
      <div className="section-content">
        <div className="load-options">
          <button className="load-button cache-load" onClick={onLoadFromCache}>
            <div className="button-icon">📁</div>
            <div className="button-text">
              <div className="button-label">Load from Cache</div>
              <div className="button-description">Load from local cache - ₵{loadCost}</div>
            </div>
          </button>
        </div>
        <LoadZone onFileLoad={onFileLoad} />
      </div>
    </div>
  );
};

export default LoadSection; 