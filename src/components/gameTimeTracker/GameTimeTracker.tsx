import React from 'react';
import './GameTimeTracker.css';
import { GamePhase,GameTime } from '../../types/gameState';
import { getTitheName, getLedgerCycleName, getAnnumReckoningName, getGrindName } from '../../utils/gameStateUtils';

interface GameTimeTrackerProps {
  gameTime: GameTime;
  gamePhase: GamePhase;
  isPaused?: boolean;
}

const GameTimeTracker: React.FC<GameTimeTrackerProps> = ({ gameTime, gamePhase, isPaused = false }) => {
  const { annumReckoning, ledgerCycle, grind, tithe, age } = gameTime;

  // Only show grind (day) for lineRat and bayBoss phases
  const isEarlyPhase = gamePhase === 'lineRat' || gamePhase === 'bayBoss';

  return (
    <div className={`game-time-tracker ${isPaused ? 'paused' : ''}`}>
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-text">TEMPORAL STASIS</div>
          <div className="pause-subtext">TIME LOCK ENGAGED</div>
        </div>
      )}
      {isEarlyPhase ? (
        <div className="time-line">
          <span className="time-segment">G-{getGrindName(grind)}</span>
        </div>
      ) : (
        <>
          <div className="time-line">
            <span className="time-segment">AR-{getAnnumReckoningName(annumReckoning)}</span>
            <span className="time-separator">•</span>
            <span className="time-segment">LC-{getLedgerCycleName(ledgerCycle)}</span>
            <span className="time-separator">•</span>
            <span className="time-segment">G-{getGrindName(grind)}</span>
          </div>
          <div className="tithe-line">
            {getTitheName(tithe)}
          </div>
          <div className="age-line">
            Age: {age}
          </div>
        </>
      )}
    </div>
  );
};

export default GameTimeTracker; 