import React, { useState, useCallback, useEffect } from 'react';
import './AdminToolbar.css';
import { GamePhase, GameTime } from '../../types/gameState';
import { advanceGameTime } from '../../utils/gameStateUtils';
import { useDragHandler_Windows } from '../../hooks/useDragHandler';
import { clampPositionToBounds } from '../../utils/viewportConstraints';

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
  const [isMinimized, setIsMinimized] = useState(true);
  
  // Drag constraint: don't drag when clicking on buttons
  const dragConstraint = useCallback((element: HTMLElement, event: React.MouseEvent) => {
    return (event.target as HTMLElement).tagName !== 'BUTTON';
  }, []);
  
  const { elementRef: toolbarRef, position, isDragging, handleMouseDown, setPosition } = useDragHandler_Windows({
    initialPosition: { x: 20, y: 20 },
    dragConstraint,
    constrainToViewport: true
  });

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

  // Check position when toolbar size changes (minimize/expand)
  useEffect(() => {
    if (!toolbarRef.current) return;
    
    const toolbarSize = {
      width: toolbarRef.current.offsetWidth,
      height: toolbarRef.current.offsetHeight
    };
    
    const constrainedPosition = clampPositionToBounds(position, toolbarSize, 0);
    
    // Only update if position needs to change
    if (constrainedPosition.x !== position.x || constrainedPosition.y !== position.y) {
      setPosition(constrainedPosition);
    }
  }, [isMinimized]); // Re-check when minimize state changes

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
              <div className="credit-button-row">
                <span>Add:</span>
                {creditAmounts.map(amount => (
                  <button key={`add-${amount}`} onClick={() => updateCredits(amount)}>
                    {formatCreditAmount(amount)}
                  </button>
                ))}
              </div>
              <div className="credit-button-row">
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