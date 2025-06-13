import React from 'react';
import './GameTimeTracker.css';
import { GameTime, getTitheName, getLedgerCycleName } from '../../types/gameTime';

interface GameTimeTrackerProps {
  gameTime: GameTime;
}

const GameTimeTracker: React.FC<GameTimeTrackerProps> = ({ gameTime }) => {
  const { annumReckoning, ledgerCycle, grind, tithe, age } = gameTime;

  return (
    <div className="game-time-tracker">
      <div className="time-line">
        <span className="time-segment">AR-{annumReckoning}</span>
        <span className="time-separator">|</span>
        <span className="time-segment">LC-{getLedgerCycleName(ledgerCycle)}</span>
        <span className="time-separator">|</span>
        <span className="time-segment">G-{grind}</span>
      </div>
      <div className="tithe-line">
        {getTitheName(tithe)}
      </div>
      <div className="age-line">
        Age: {age}
      </div>
    </div>
  );
};

export default GameTimeTracker; 