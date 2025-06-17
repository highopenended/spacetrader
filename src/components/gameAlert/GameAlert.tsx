import React, { useEffect } from 'react';
import './GameAlert.css';

interface GameAlertProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  pauseTime: () => void;
  resumeTime: () => void;
}

const GameAlert: React.FC<GameAlertProps> = ({ 
  message, 
  isVisible, 
  onClose,
  pauseTime,
  resumeTime
}) => {
  useEffect(() => {
    if (isVisible) {
      pauseTime();
    } else {
      resumeTime();
    }

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, pauseTime, resumeTime, onClose]);

  if (!isVisible) return null;

  return (
    <div className="game-alert-overlay">
      <div className="game-alert-backdrop" onClick={onClose} />
      <div className="game-alert-container">
        <div className="game-alert-header">
          <div className="terminal-indicator">
            <span className="indicator-dot"></span>
            <span className="indicator-text">SYSTEM ALERT</span>
          </div>
          <button className="alert-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="game-alert-content">
          <div className="alert-message">
            {message}
          </div>
        </div>
        
        <div className="game-alert-footer">
          <div className="terminal-prompt">
            <span className="prompt-text">[PRESS ESC OR CLICK TO CONTINUE]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAlert; 