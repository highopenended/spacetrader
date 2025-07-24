import React from 'react';
import './HideWindowsToggle.css';

interface HideWindowsToggleProps {
  windowsHidden: boolean;
  onToggle: () => void;
}

const HideWindowsToggle: React.FC<HideWindowsToggleProps> = ({
  windowsHidden,
  onToggle
}) => {
  return (
    <div className="hide-windows-toggle-container">
      <button 
        className={`hide-windows-toggle-button${windowsHidden ? ' active' : ''}`}
        onClick={onToggle}
        title={windowsHidden ? "Show all windows" : "Hide all windows"}
      >
        {windowsHidden ? "Press to Show Windows" : "Press to Hide Windows"}
      </button>
    </div>
  );
};

export default HideWindowsToggle; 