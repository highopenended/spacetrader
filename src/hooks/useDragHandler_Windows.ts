/**
 * Window Drag Handler Hook
 * 
 * Handles window positioning and resizing functionality.
 * Used by ScrAppWindow and AdminToolbar for window management.
 * Supports viewport boundary constraints and footer-aware positioning.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { clampPositionToBounds } from '../utils/viewportConstraints';

interface DragHandlerOptions {
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onBringToFront?: () => void; // Callback to bring element to front when drag starts
  dragConstraint?: (element: HTMLElement, event: React.MouseEvent) => boolean;
  constrainToViewport?: boolean;
  elementSize?: { width: number; height: number };
  footerHeight?: number;
}

export const useDragHandler_Windows = (options: DragHandlerOptions = {}) => {
  const {
    initialPosition = { x: 0, y: 0 },
    onPositionChange,
    onBringToFront,
    dragConstraint,
    constrainToViewport = false,
    elementSize,
    footerHeight = 20
  } = options;

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;
    
    // Check drag constraint if provided
    if (dragConstraint && !dragConstraint(elementRef.current, e)) return;
    
    // Bring element to front when starting to drag
    onBringToFront?.();
    
    const rect = elementRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [dragConstraint, onBringToFront]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    let newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    // Apply viewport constraints if enabled
    if (constrainToViewport) {
      const size = elementSize || (elementRef.current ? {
        width: elementRef.current.offsetWidth,
        height: elementRef.current.offsetHeight
      } : { width: 250, height: 120 }); // fallback size
      
      newPosition = clampPositionToBounds(newPosition, size, footerHeight);
    }
    
    setPosition(newPosition);
  }, [isDragging, dragStart, constrainToViewport, elementSize, footerHeight]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      let finalPosition = position;
      
      // Apply final viewport constraint check
      if (constrainToViewport) {
        const size = elementSize || (elementRef.current ? {
          width: elementRef.current.offsetWidth,
          height: elementRef.current.offsetHeight
        } : { width: 250, height: 120 }); // fallback size
        
        finalPosition = clampPositionToBounds(position, size, footerHeight);
        
        // Update position if it was constrained
        if (finalPosition.x !== position.x || finalPosition.y !== position.y) {
          setPosition(finalPosition);
        }
      }
      
      // Report final position if callback provided
      if (onPositionChange) {
        onPositionChange(finalPosition);
      }
    }
  }, [isDragging, position, onPositionChange, constrainToViewport, elementSize, footerHeight]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition.x, initialPosition.y]);

  return {
    elementRef,
    position,
    isDragging,
    handleMouseDown,
    setPosition // Allow manual position updates
  };
}; 