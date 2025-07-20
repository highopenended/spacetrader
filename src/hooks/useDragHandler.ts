/**
 * Drag Handler Hook
 * 
 * Reusable hook for handling drag functionality across components.
 * Consolidates drag logic from ScrAppWindow and AdminToolbar.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface DragHandlerOptions {
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  dragConstraint?: (element: HTMLElement, event: React.MouseEvent) => boolean;
}

export const useDragHandler = (options: DragHandlerOptions = {}) => {
  const {
    initialPosition = { x: 0, y: 0 },
    onPositionChange,
    dragConstraint
  } = options;

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;
    
    // Check drag constraint if provided
    if (dragConstraint && !dragConstraint(elementRef.current, e)) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [dragConstraint]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    setPosition(newPosition);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Report final position if callback provided
      if (onPositionChange) {
        onPositionChange(position);
      }
    }
  }, [isDragging, position, onPositionChange]);

  // Set up and clean up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  return {
    elementRef,
    position,
    isDragging,
    handleMouseDown,
    setPosition // Allow manual position updates
  };
}; 