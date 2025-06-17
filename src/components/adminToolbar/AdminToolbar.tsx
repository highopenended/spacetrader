import React, { useState, useRef, useCallback } from 'react';
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
  resetGame: () => void;
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
  resumeTime,
  resetGame
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!toolbarRef.current) return;
    
    // Don't start dragging if clicking on buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    const rect = toolbarRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleMinimized = () => {
    if (!isMinimized) {
      // When minimizing, move to bottom right
      setPosition({ 
        x: window.innerWidth - 120, 
        y: window.innerHeight - 60 
      });
    } else {
      // When expanding, center on screen
      setPosition({
        x: (window.innerWidth - 400) / 2,
        y: (window.innerHeight - 400) / 2
      });
    }
    setIsMinimized(!isMinimized);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  const creditAmounts = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
  
  const formatCreditAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${amount / 1000000}m`;
    } else if (amount >= 1000) {
      return `${amount / 1000}k`;
    } else {
      return amount.toString();
    }
  };

  const gamePhases: GamePhase[] = [
    'lineRat', 'bayBoss', 'scrapCaptain', 'fleetBoss', 'subsectorWarden',
    'sectorCommodore', 'ledgerPatrician', 'cathedraMinor', 'cathedraDominus', 'cathedraUltima'
  ];

  return (
    <div 
      ref={toolbarRef}
      className={`admin-toolbar ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {isMinimized ? (
        <button onClick={toggleMinimized} className="expand-button">
          Admin
        </button>
      ) : (
        <>
          <div className="admin-header">
            <h3>Admin Tools</h3>
            <button onClick={toggleMinimized} className="minimize-button">
              −
            </button>
          </div>
          
          <div className="admin-section">
            <h4>Time Controls</h4>
            <button onClick={isPaused ? resumeTime : pauseTime}>
              {isPaused ? 'Resume' : 'Pause'} Time
            </button>
            <button onClick={addAnnumReckoning}>Add 1 Annum Reckoning</button>
            <button onClick={addLedgerCycle}>Add 1 Ledger Cycle</button>
            <button onClick={addGrind}>Add 1 Grind</button>
          </div>

          <div className="admin-section">
            <h4>Credits</h4>
            <div className="credit-buttons">
              <div className="button-group">
                <span>Add:</span>
                {creditAmounts.map(amount => (
                  <button key={`add-${amount}`} onClick={() => updateCredits(amount)}>
                    {formatCreditAmount(amount)}
                  </button>
                ))}
              </div>
              <div className="button-group">
                <span>Remove:</span>
                {creditAmounts.map(amount => (
                  <button key={`remove-${amount}`} onClick={() => updateCredits(-amount)}>
                    {formatCreditAmount(amount)}
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

          <div className="admin-section">
            <h4>Game Reset</h4>
            <button onClick={resetGame} className="reset-button">
              Reset Game
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminToolbar; 