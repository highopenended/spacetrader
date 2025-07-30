import React from 'react';
import './SaveSection.css';

interface SaveSectionProps {
  onSaveToCache: () => boolean;
  onExportToFile: () => boolean;
  saveCost: number;
}

const SaveSection: React.FC<SaveSectionProps> = ({ onSaveToCache, onExportToFile, saveCost }) => {
  return (
    <div className="save-section">
      <div className="section-header">
        <div className="detail-label">Save Game</div>
      </div>
      <div className="section-content">
        <div className="save-options">
          <button className="save-button local-cache-save" onClick={onSaveToCache}>
            <div className="button-icon">💾</div>
            <div className="button-text">
              <div className="button-label">Save to Local Cache</div>
              <div className="button-description">Store in local cache - ₵{saveCost}</div>
            </div>
          </button>
          
          <button className="save-button file-save" onClick={onExportToFile}>
            <div className="button-icon">📄</div>
            <div className="button-text">
              <div className="button-label">Save as .scrap</div>
              <div className="button-description">Export to file - ₵{saveCost}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSection; 