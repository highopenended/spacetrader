import React from 'react';
import './ScrapBin.css';

const ScrapBin: React.FC = () => {
  return (
    <div className="scrap-bin">
      <div className="scrap-bin-container">
        <div className="scrap-bin-icon">🗑️</div>
        <div className="scrap-bin-label">SCRAP BIN</div>
      </div>
    </div>
  );
};

export default ScrapBin; 