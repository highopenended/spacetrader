import React from 'react';
import './CreditsTracker.css';

interface CreditsTrackerProps {
  credits?: number;
}

const CreditsTracker: React.FC<CreditsTrackerProps> = ({ credits = 0 }) => {
  const isNegative = credits < 0;
  
  return (
    <div className={`credits-tracker ${isNegative ? 'negative' : ''}`}>
      <div className="credits-label">Credits</div>
      <div className="credits-amount">₵ {credits.toLocaleString()}</div>
    </div>
  );
};

export default CreditsTracker; 