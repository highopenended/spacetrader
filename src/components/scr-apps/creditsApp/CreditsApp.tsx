import React from 'react';
import './CreditsApp.css';
import ScrApp from '../ScrApp';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  const isNegative = credits < 0;
  
  return (
    <ScrApp>
      <div className={`credits-tracker ${isNegative ? 'negative' : ''}`}>
        <div className="app-label">Credits</div>
        <div className="app-value credits-amount">₵ {credits.toLocaleString()}</div>
      </div>
    </ScrApp>
  );
};

export default CreditsApp; 