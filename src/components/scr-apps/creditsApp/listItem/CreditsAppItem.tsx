import React from 'react';
import ScrApp from '../../ScrAppItem';

interface CreditsAppProps {
  credits?: number;
}

const CreditsApp: React.FC<CreditsAppProps> = ({ credits = 0 }) => {
  return (
    <ScrApp>
      <div>
        <div className="app-label">Credits</div>
      </div>
    </ScrApp>
  );
};

export default CreditsApp; 