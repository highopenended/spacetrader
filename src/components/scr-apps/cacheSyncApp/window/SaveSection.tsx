import React from 'react';
import './SaveSection.css';

interface SaveSectionProps {
  // Props will be determined based on save functionality needs
}

const SaveSection: React.FC<SaveSectionProps> = () => {
  return (
    <div className="save-section">
      <div className="section-header">
        <div className="detail-label">Save Game</div>
        <div className="section-subtitle">Cache your progress to local storage</div>
      </div>
      <div className="section-content">
        <div className="save-options">
          <button className="save-button local-cache-save">
            <div className="button-icon">💾</div>
            <div className="button-text">
              <div className="button-label">Save to Local Cache</div>
              <div className="button-description">Store in local cache</div>
            </div>
          </button>
          
          <button className="save-button file-save">
            <div className="button-icon">📁</div>
            <div className="button-text">
              <div className="button-label">Save as .scrap</div>
              <div className="button-description">Export to file</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSection; 