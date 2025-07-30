import React from 'react';
import './LoadSection.css';
import LoadZone from './LoadZone';

interface LoadSectionProps {
  onLoadFromCache: () => boolean;
  onFileLoad: (file: File) => Promise<boolean>;
}

const LoadSection: React.FC<LoadSectionProps> = ({ onLoadFromCache, onFileLoad }) => {
  return (
    <div className="load-section">
      <div className="section-header">
        <div className="detail-label">Load Game</div>
      </div>
      <div className="section-content">
        <div className="load-options">
          <div className="load-option-row" onClick={onLoadFromCache}>
            <div className="load-button cache-load">
              <div className="button-icon">📁</div>
              <div className="button-text">
                <div className="button-label">Load from Cache</div>
                <div className="button-description">Load from local cache</div>
              </div>
            </div>
          </div>
        </div>
        <LoadZone onFileLoad={onFileLoad} />
      </div>
    </div>
  );
};

export default LoadSection; 