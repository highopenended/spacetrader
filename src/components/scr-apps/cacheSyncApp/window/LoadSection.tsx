import React from 'react';
import './LoadSection.css';

interface LoadSectionProps {
  // Props will be determined based on load functionality needs
}

const LoadSection: React.FC<LoadSectionProps> = () => {
  return (
    <div className="load-section">
      <div className="section-header">
        <div className="detail-label">Load Game</div>
      </div>
      <div className="section-content">
        <div className="detail-value">Load functionality not implemented yet</div>
      </div>
    </div>
  );
};

export default LoadSection; 