import React from 'react';
import './AgeTracker.css';
import { GameTime } from '../../types/gameState';

interface AgeTrackerProps {
  gameTime: GameTime;
}

const AgeTracker: React.FC<AgeTrackerProps> = ({ gameTime }) => {
  const { age } = gameTime;

  return (
    <div className="age-tracker">
      <div className="age-display">AGE: {age}</div>
    </div>
  );
};

export default AgeTracker; 