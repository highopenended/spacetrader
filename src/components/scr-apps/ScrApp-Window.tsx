import React from 'react';
import './ScrApp-Window.css';

interface ScrAppWindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  windowId: string;
  position?: { x: number; y: number };
}

const ScrAppWindow: React.FC<ScrAppWindowProps> = ({ 
  title, 
  children, 
  onClose, 
  windowId,
  position = { x: 100, y: 100 }
}) => {
  return (
    <div 
      className="scr-app-window"
      style={{ 
        left: position.x, 
        top: position.y 
      }}
      data-window-id={windowId}
    >
      <div className="window-header">
        <div className="window-title">{title}</div>
        <button className="window-close" onClick={onClose}>×</button>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
};

export default ScrAppWindow; 