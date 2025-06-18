import React from 'react';
import './CreditsApp.css';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  const isNegative = credits < 0;
  
  return (
    <div className={`credits-tracker ${isNegative ? 'negative' : ''}`}>
      <div className="credits-label">Credits</div>
      <div className="credits-amount">₵ {credits.toLocaleString()}</div>
    </div>
  );
};

export default CreditsApp; 