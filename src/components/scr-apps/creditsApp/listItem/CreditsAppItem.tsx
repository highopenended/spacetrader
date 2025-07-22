import React from 'react';
import ScrApp from '../../ScrAppItem';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  const labelStyle = credits < 0 ? 'app-label-negative' : 'app-label-positive'; 
  const valueStyle = credits < 0 ? 'app-value-negative' : 'app-value-positive';
  return (
    <ScrApp>
      <div>
        <div className={`${labelStyle}`}>Credits</div>
        <div className={`${valueStyle}`}>₵ {credits.toLocaleString()}</div>
      </div>
    </ScrApp>
  );
};

export default CreditsApp; 