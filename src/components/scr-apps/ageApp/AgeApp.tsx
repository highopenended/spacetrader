import React from 'react';
import './AgeApp.css';
import ScrApp from '../ScrApp';
import { GameTime } from '../../../types/gameState';

interface AgeAppProps {
  gameTime: GameTime;
}

const AgeApp: React.FC<AgeAppProps> = ({ gameTime }) => {
  const { age } = gameTime;

  return (
    <ScrApp>
      <div className="age-tracker">
        <div className="age-display">AGE: {age}</div>
      </div>
    </ScrApp>
  );
};

export default AgeApp; 