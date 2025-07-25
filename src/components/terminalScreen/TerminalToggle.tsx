import React from 'react';
import './TerminalToggle.css';

interface TerminalToggleProps {
  isMinimized: boolean;
  onToggle: () => void;
}

const TerminalToggle: React.FC<TerminalToggleProps> = ({
  isMinimized,
  onToggle
}) => {
  return (
    <div className="terminal-toggle-container">
      <button 
        className="terminal-toggle-button"
        onClick={onToggle}
        title={isMinimized ? "Expand terminal" : "Minimize terminal"}
      >
        TERMINAL {isMinimized ? '▼' : '▲'}
      </button>
    </div>
  );
};

export default TerminalToggle; 