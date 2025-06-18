import React from 'react';
import './AgeApp.css';
import { GameTime } from '../../../types/gameState';

interface AgeAppProps {
  gameTime: GameTime;
}

const AgeApp: React.FC<AgeAppProps> = ({ gameTime }) => {
  const { age } = gameTime;

  return (
    <div className="age-tracker">
      <div className="age-display">AGE: {age}</div>
    </div>
  );
};

export default AgeApp; 