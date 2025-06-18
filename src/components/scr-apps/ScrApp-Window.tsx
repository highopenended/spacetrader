import React, { useState, useRef, useCallback } from 'react';
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
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!windowRef.current) return;
    
    // Don't start dragging if clicking on buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setCurrentPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
      onMouseDown={handleMouseDown}
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