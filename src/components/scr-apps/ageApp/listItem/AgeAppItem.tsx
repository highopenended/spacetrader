import React from 'react';
import ScrApp from '../../ScrAppItem';
import { GameTime } from '../../../../types/gameState';

interface AgeAppProps {
  gameTime: GameTime;
}

const AgeApp: React.FC<AgeAppProps> = ({ gameTime }) => {
  const { age } = gameTime;

  return (
    <ScrApp>
      <div>
        <div className="app-label">Age</div>
        <div className="app-value age-years">{age} Years</div>
      </div>
    </ScrApp>
  );
};

export default AgeApp; 