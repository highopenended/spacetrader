import React from 'react';
import './AgeAppItem.css';
import ScrApp from '../../ScrApp';
import { GameTime } from '../../../../types/gameState';

interface AgeAppProps {
  gameTime: GameTime;
}

const AgeApp: React.FC<AgeAppProps> = ({ gameTime }) => {
  const { age } = gameTime;

  return (
    <ScrApp>
      <div className="age-tracker">
        <div className="app-label">Age</div>
        <div className="app-value age-years">{age} Years</div>
      </div>
    </ScrApp>
  );
};

export default AgeApp; 