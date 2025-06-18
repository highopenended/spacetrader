import React from 'react';
import './DateApp.css';
import { GamePhase,GameTime } from '../../../types/gameState';
import { getTitheName, getLedgerCycleName, getAnnumReckoningName, getGrindName } from '../../../utils/gameStateUtils';

interface DateAppProps {
  gameTime: GameTime;
  gamePhase: GamePhase;
}

const DateApp: React.FC<DateAppProps> = ({ gameTime, gamePhase }) => {
  const { annumReckoning, ledgerCycle, grind, tithe } = gameTime;

  // Only show grind (day) for lineRat and bayBoss phases
  const isEarlyPhase = gamePhase === 'lineRat' || gamePhase === 'bayBoss';

  return (
    <div className="game-time-tracker">
      {isEarlyPhase ? (
        <div className="time-line">
          <span className="time-segment">GRIND-{getGrindName(grind)}</span>
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
        </>
      )}
    </div>
  );
};

export default DateApp; 