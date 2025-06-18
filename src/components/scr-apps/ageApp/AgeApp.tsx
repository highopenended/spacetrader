import React from 'react';
import './AgeApp.css';
import ScrApp from '../ScrApp';
import { GameTime } from '../../../types/gameState';

interface AgeAppProps {
  gameTime: GameTime;
  onAppClick?: () => void;
}

const AgeApp: React.FC<AgeAppProps> = ({ gameTime, onAppClick }) => {
  const { age } = gameTime;

  return (
    <ScrApp onClick={onAppClick}>
      <div className="age-tracker">
        <div className="app-label">Age</div>
        <div className="app-value age-years">{age} Years</div>
      </div>
    </ScrApp>
  );
};

export default AgeApp; 