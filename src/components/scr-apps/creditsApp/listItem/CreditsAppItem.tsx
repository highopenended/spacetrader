import React from 'react';
import './CreditsAppItem.css';
import ScrApp from '../../ScrAppItem';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  const isNegative = credits < 0;
  
  return (
    <ScrApp>
      <div>
        <div className={isNegative ? 'app-label-negative' : 'app-label'}>Credits</div>
        <div className={isNegative ? 'app-value-negative' : 'app-value'}>₵ {credits.toLocaleString()}</div>
      </div>
    </ScrApp>
  );
};

export default CreditsApp; 