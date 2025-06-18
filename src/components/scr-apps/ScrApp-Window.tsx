import React, { useState, useRef, useCallback } from 'react';
import './ScrApp-Window.css';

interface ScrAppWindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  windowId: string;
  appType: string;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const ScrAppWindow: React.FC<ScrAppWindowProps> = ({ 
  title, 
  children, 
  onClose, 
  windowId,
  appType,
  position = { x: 100, y: 100 },
  onPositionChange
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!windowRef.current) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    setCurrentPosition(newPosition);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Report the final position back to parent
    if (onPositionChange) {
      onPositionChange(currentPosition);
    }
  }, [onPositionChange, currentPosition]);

  const handleDoubleClick = useCallback(() => {
    onClose();
  }, [onClose]);

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

  return (
    <div 
      ref={windowRef}
      className="scr-app-window"
      style={{ 
        left: currentPosition.x, 
        top: currentPosition.y,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      data-window-id={windowId}
    >
      <div 
        className="window-header"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="window-title">{title}</div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
};

export default ScrAppWindow; 