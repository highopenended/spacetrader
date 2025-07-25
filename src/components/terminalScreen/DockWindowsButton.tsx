import React from 'react';
import './DockWindowsButton.css';

interface DockWindowsButtonProps {
  onDockWindows: () => void;
  hasOpenWindows: boolean;
  openWindowCount: number;
}

const DockWindowsButton: React.FC<DockWindowsButtonProps> = ({
  onDockWindows,
  hasOpenWindows,
  openWindowCount
}) => {
  return (
    <div className="dock-windows-button-container">
      <button 
        className={`dock-windows-button${!hasOpenWindows ? ' disabled' : ''}`}
        onClick={hasOpenWindows ? onDockWindows : undefined}
        disabled={!hasOpenWindows}
        title={hasOpenWindows ? "Dock all windows to terminal" : "No windows to dock"}
      >
        DOCK APPS {hasOpenWindows ? `[${openWindowCount}]` : '[0]'}
      </button>
    </div>
  );
};

export default DockWindowsButton; 