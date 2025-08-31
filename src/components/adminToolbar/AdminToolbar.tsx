import React, { useState, useCallback, useEffect } from 'react';
import './AdminToolbar.css';
import { GamePhase, GameTime } from '../../types/gameState';
import { advanceGameTime } from '../../utils/gameStateUtils';
import { useDragHandler_Windows } from '../../hooks/useDragHandler_Windows';
import { clampPositionToBounds } from '../../utils/viewportConstraints';
import { GameBackgroundRegistry } from '../../constants/gameBackgroundRegistry';

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
  setGameBackground: (backgroundId: string) => void;
}

// Layout constants for consistent sizing/positioning
const TOOLBAR_MARGIN = 16;
const MINIMIZED_WIDTH = 140;
const MINIMIZED_HEIGHT = 50; // keep in sync with CSS `.admin-toolbar.minimized`
const EXPANDED_SIZE = 400;

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
  resetGame,
  setGameBackground
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  
  // Drag constraint: don't drag when interacting with standard interactive controls
  const dragConstraint = useCallback((element: HTMLElement, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const tag = target.tagName;
    return !['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'A', 'LABEL'].includes(tag);
  }, []);
  
  const { elementRef: toolbarRef, position, isDragging, handleMouseDown, setPosition } = useDragHandler_Windows({
    // Default to bottom-right corner with a small margin, sized for minimized container
    initialPosition: { 
      x: window.innerWidth - MINIMIZED_WIDTH - TOOLBAR_MARGIN, 
      y: window.innerHeight - MINIMIZED_HEIGHT - TOOLBAR_MARGIN 
    },
    dragConstraint,
    constrainToViewport: true
  });

  const toggleMinimized = () => {
    if (!isMinimized) {
      // When minimizing, move to bottom-right with margin, sized for minimized container
      setPosition({ 
        x: window.innerWidth - MINIMIZED_WIDTH - TOOLBAR_MARGIN, 
        y: window.innerHeight - MINIMIZED_HEIGHT - TOOLBAR_MARGIN 
      });
    } else {
      // When expanding, center on screen based on expected expanded size
      setPosition({
        x: (window.innerWidth - EXPANDED_SIZE) / 2,
        y: (window.innerHeight - EXPANDED_SIZE) / 2
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
  }, [isMinimized, position, setPosition, toolbarRef]); // Re-check when minimize state changes

  const addGrind = () => {
    const updateTime = (producer: (t: GameTime) => GameTime) => setGameTime(producer(gameTime));
    updateTime(prev => advanceGameTime({ ...prev, grind: prev.grind + 1 }));
  };

  const addLedgerCycle = () => {
    const updateTime = (producer: (t: GameTime) => GameTime) => setGameTime(producer(gameTime));
    updateTime(prev => advanceGameTime({ ...prev, ledgerCycle: prev.ledgerCycle + 1 }));
  };

  const addAnnumReckoning = () => {
    const updateTime = (producer: (t: GameTime) => GameTime) => setGameTime(producer(gameTime));
    updateTime(prev => ({ ...prev, annumReckoning: prev.annumReckoning + 1, age: prev.age + 1 }));
  };

  const creditAmounts = Array.from({ length: 9 }, (_, i) => 10 ** i);
  
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
    'lineRat',
    'bayBoss',
    'scrapCaptain',
    'fleetBoss',
    'subsectorWarden',
    'sectorCommodore',
    'ledgerPatrician',
    'cathedraMinor',
    'cathedraDominus',
    'cathedraUltima'
  ];

  const backgroundOptions = ['default', ...Object.keys(GameBackgroundRegistry)];

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
            <h4>Background</h4>
            <select 
              onChange={(e) => setGameBackground(e.target.value)}
              className="background-select"
            >
              {backgroundOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
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