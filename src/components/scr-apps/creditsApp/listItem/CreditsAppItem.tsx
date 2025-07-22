import React from 'react';
import ScrApp from '../../ScrAppItem';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  const isNegative = credits < 0;
  const isPositive = credits > 0;
  const textStyle = isNegative ? 'app-label-negative' : 'app-label-positive';
  return (
    <ScrApp>
      <div>
        <div className={`${textStyle} app-label`}>Credits</div>
        <div className={`${textStyle} app-value`}>₵ {credits.toLocaleString()}</div>
      </div>
    </ScrApp>
  );
};

export default CreditsApp; 