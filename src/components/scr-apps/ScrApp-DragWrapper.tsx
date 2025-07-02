import React, { useState, useRef, useCallback } from 'react';
import './ScrApp-DragWrapper.css';
import ScrApp from './ScrApp';

interface ScrAppDragWrapperProps {
  children: React.ReactNode;
  onAppClick?: () => void;
  appId: string;
}

const ScrAppDragWrapper: React.FC<ScrAppDragWrapperProps> = ({ 
  children, 
  onAppClick,
  appId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Start tracking for potential drag or click
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // For now, just track movement - full drag logic will be added later
    if (!isDragging) return;
  }, [isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Check if this was a click or drag
    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);
    const DRAG_THRESHOLD = 5; // pixels
    
    // If mouse didn't move much, treat as click
    if (deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
      if (onAppClick) {
        onAppClick();
      }
    }
    
    setIsDragging(false);
  }, [isDragging, dragStart, onAppClick]);

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
      ref={wrapperRef}
      className={`scr-app-drag-wrapper ${onAppClick ? 'clickable' : ''}`}
      onMouseDown={handleMouseDown}
      data-app-id={appId}
    >
      <ScrApp>
        {children}
      </ScrApp>
    </div>
  );
};

export default ScrAppDragWrapper; 