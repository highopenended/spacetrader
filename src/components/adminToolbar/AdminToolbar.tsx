import React from 'react';
import './AdminToolbar.css';
import { GamePhase, GameTime } from '../../types/gameState';
import { advanceGameTime } from '../../utils/gameStateUtils';

interface AdminToolbarProps {
  credits: number;
  gamePhase: GamePhase;
  gameTime: GameTime;
  updateCredits: (amount: number) => void;
  setCredits: (amount: number) => void;
  setGamePhase: (phase: GamePhase) => void;
  setGameTime: (newTime: GameTime) => void;
  advanceGamePhase: () => void;
  isPaused: boolean;
  pauseTime: () => void;
  resumeTime: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({ 
  credits,
  gamePhase,
  gameTime, 
  updateCredits, 
  setCredits, 
  setGamePhase, 
  setGameTime,
  advanceGamePhase,
  isPaused,
  pauseTime,
  resumeTime
}) => {
  const addGrind = () => {
    const newTime = { ...gameTime };
    newTime.grind++;
    const advancedTime = advanceGameTime(newTime);
    setGameTime(advancedTime);
  };

  const addLedgerCycle = () => {
    const newTime = { ...gameTime };
    newTime.ledgerCycle++;
    const advancedTime = advanceGameTime(newTime);
    setGameTime(advancedTime);
  };

  const addAnnumReckoning = () => {
    const newTime = { ...gameTime };
    newTime.annumReckoning++;
    newTime.age++;
    setGameTime(newTime);
  };

  const creditAmounts = [1, 10, 100, 1000, 10000, 100000];
  const gamePhases: GamePhase[] = [
    'lineRat', 'bayBoss', 'scrapCaptain', 'fleetBoss', 'subsectorWarden',
    'sectorCommodore', 'ledgerPatrician', 'cathedraMinor', 'cathedraDominus', 'cathedraUltima'
  ];

  return (
    <div className="admin-toolbar">
      <div className="admin-section">
        <h4>Time Controls</h4>
        <button onClick={isPaused ? resumeTime : pauseTime}>
          {isPaused ? 'Resume' : 'Pause'} Time
        </button>
        <button onClick={addGrind}>Add 1 Grind</button>
        <button onClick={addLedgerCycle}>Add 1 Ledger Cycle</button>
        <button onClick={addAnnumReckoning}>Add 1 Annum Reckoning</button>
      </div>

      <div className="admin-section">
        <h4>Credits</h4>
        <div className="credit-buttons">
          <div className="button-group">
            <span>Remove:</span>
            {creditAmounts.map(amount => (
              <button key={`remove-${amount}`} onClick={() => updateCredits(-amount)}>
                {amount.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="button-group">
            <span>Add:</span>
            {creditAmounts.map(amount => (
              <button key={`add-${amount}`} onClick={() => updateCredits(amount)}>
                {amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h4>Game Phase</h4>
        <div className="phase-buttons">
          {gamePhases.map((phase, index) => (
            <button 
              key={phase} 
              onClick={() => setGamePhase(phase)}
              className={gamePhase === phase ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
          <button onClick={advanceGamePhase}>Advance Phase</button>
        </div>
      </div>
    </div>
  );
};

export default AdminToolbar; 