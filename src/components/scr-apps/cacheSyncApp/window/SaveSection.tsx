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
          <div className="save-option-row" onClick={onSaveToCache}>
            <div className="cost-box">
              <div className="cost-amount">₵{saveCost}</div>
              <div className="cost-label">COST</div>
            </div>
            <div className="save-button local-cache-save">
              <div className="button-icon">💾</div>
              <div className="button-text">
                <div className="button-label">Save to Local Cache</div>
                <div className="button-description">Store in local cache</div>
              </div>
            </div>
          </div>
          
          <div className="save-option-row" onClick={onExportToFile}>
            <div className="cost-box">
              <div className="cost-amount">₵{saveCost}</div>
              <div className="cost-label">COST</div>
            </div>
            <div className="save-button file-save">
              <div className="button-icon">📄</div>
              <div className="button-text">
                <div className="button-label">Save as .scrap</div>
                <div className="button-description">Export to file</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveSection; 