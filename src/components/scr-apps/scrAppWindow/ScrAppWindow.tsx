/**
 * DUAL DRAG SYSTEM ARCHITECTURE - ScrAppWindow Component
 * 
 * This component implements a sophisticated dual drag system that enables both window positioning
 * and deletion functionality through a single drag interaction from the user's perspective.
 * 
 * SYSTEM 1: WINDOW POSITIONING DRAG (useDragHandler_Windows - Custom)
 * - Purpose: Moves windows around the screen for positioning
 * - Implementation: Custom hook with mouse events
 * - Visual feedback: Window follows mouse cursor during drag
 * - Constraints: Viewport bounds, footer-aware positioning
 * - Trigger: Dragging window header
 * 
 * SYSTEM 2: PURGE NODE DRAG (@dnd-kit - Library)
 * - Purpose: Enables deletion by dragging into PurgeZone
 * - Implementation: @dnd-kit useDraggable hook
 * - Visual feedback: Tiny red cursor-sized indicator (12x12px)
 * - Constraints: Only works with deletable apps
 * - Trigger: Same drag action as positioning (dual activation)
 * 
 * INTEGRATION APPROACH:
 * 1. Both systems activate simultaneously on window header drag
 * 2. useDragHandler_Windows handles the visual window movement
 * 3. @dnd-kit handles the deletion collision detection
 * 4. User sees unified experience: drag window → position OR delete
 * 5. Tiny red indicator appears during drag to show deletion is possible
 * 
 * NAMING CONVENTION:
 * - All purge-related variables prefixed with "purgeNode" for clarity
 * - Examples: purgeNodeDragAttributes, isPurgeNodeDragging, setPurgeNodeDragRef
 * - This prevents confusion with standard drag variables in the future
 * 
 * DELETION FLOW:
 * 1. User drags window header → both systems activate
 * 2. Small red indicator follows mouse cursor
 * 3. If dropped on PurgeZone → deletion confirmation popup
 * 4. If dropped elsewhere → normal window positioning
 * 5. Deletion removes both window AND app from terminal list
 */

import React, { useState, useCallback, useEffect } from 'react';
import './ScrAppWindow.css';
import { WINDOW_DEFAULTS } from '../../../constants/windowConstants';
import { APP_REGISTRY } from '../../../constants/appListConstants';
import { useDragHandler_Windows } from '../../../hooks/useDragHandler_Windows';
import { useDraggable } from '@dnd-kit/core';
import { useWindowDropZoneEffects } from './useDropZoneEffects';
import { useDragContext } from '../../../contexts/DragContext';

// Base interface for all window management props
export interface BaseWindowProps {
  onClose: () => void;
  windowId: string;
  appType: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  zIndex?: number;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onWidthChange?: (width: number) => void;
  onBringToFront?: () => void;
  updateCredits?: (amount: number) => void; // For credit transactions
  toggleStates?: any; // For DataReadout visibility controls
  setToggleState?: (key: string, value: boolean) => void; // For updating toggle states
}

interface ScrAppWindowProps extends BaseWindowProps {
  title: string;
  children: React.ReactNode;
}

const ScrAppWindow: React.FC<ScrAppWindowProps> = ({ 
  title, 
  children, 
  onClose, 
  windowId,
  appType,
  position = WINDOW_DEFAULTS.POSITION,
  size = WINDOW_DEFAULTS.SIZE,
  minSize = WINDOW_DEFAULTS.MIN_SIZE,
  zIndex = 1000,
  onPositionChange,
  onSizeChange,
  onWidthChange,
  onBringToFront,
  updateCredits,
}) => {
  const [currentSize, setCurrentSize] = useState(size);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  

  // Use shared drag handler for window dragging with viewport constraints
  const { elementRef: windowRef, position: currentPosition, isDragging, handleMouseDown: dragMouseDown } = useDragHandler_Windows({
    initialPosition: position,
    onPositionChange,
    onBringToFront, // Bring window to front when drag starts
    constrainToViewport: true,
    elementSize: currentSize,
    footerHeight: 0 // No footer anymore
  });

  const appRegistry = APP_REGISTRY[appType];

  // WINDOW DRAG SYSTEM: @dnd-kit draggable for window drag operations
  // This creates an invisible drag node that follows the mouse cursor for window positioning and deletion
  // Works alongside the custom window positioning drag system (useDragHandler_Windows)
  const { 
    attributes: purgeNodeDragAttributes, 
    listeners: purgeNodeDragListeners, 
    setNodeRef: setPurgeNodeDragRef
  } = useDraggable({
    id: `window-drag-${windowId}`, // Prefix to distinguish from app list items
    data: { 
      type: 'window-drag-node', // Clear type identifier for window drag system
      appType, 
      windowId,
      deletable: appRegistry?.deletable ?? true,
      windowTitle: title
    }
  });

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height
    });
  }, [currentSize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newSize = {
        width: Math.max(minSize.width, resizeStart.width + deltaX),
        height: Math.max(minSize.height, resizeStart.height + deltaY)
      };
      
      setCurrentSize(newSize);
    }
  }, [isResizing, resizeStart, minSize]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      // Report the final size back to parent
      onSizeChange?.(currentSize);
      // Report width change for responsive behavior
      onWidthChange?.(currentSize.width);
    }
  }, [isResizing, onSizeChange, onWidthChange, currentSize]);

  const handleDoubleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Report width changes during resizing for responsive behavior
  useEffect(() => {
    if (isResizing && onWidthChange) {
      onWidthChange(currentSize.width);
    }
  }, [currentSize.width, isResizing, onWidthChange]);

  // No upgrade info mode

  // CLEAN: Use drop zone effects hook to handle all conditional styling
  // Pull drag-over state from context (source of truth), fallback to props if provided
  const { overId: ctxOverId, draggedAppType } = useDragContext();
  const dropZoneEffects = useWindowDropZoneEffects(
    ctxOverId,
    draggedAppType || null,
    appType
  );

  // WINDOW DRAG SYSTEM: Combine refs for both drag systems
  // The window needs refs for both positioning drag (useDragHandler_Windows) and window drag (@dnd-kit)
  const combinedWindowRef = useCallback((node: HTMLDivElement | null) => {
    windowRef.current = node;
    setPurgeNodeDragRef(node);
  }, [windowRef, setPurgeNodeDragRef]);

  // No upgrade info content

  return (
    <div 
      ref={combinedWindowRef}
      className={`scr-app-window${isDragging ? ' window-dragging' : ''}${isResizing ? ' window-resizing' : ''}`}
      style={{ 
        left: currentPosition.x, 
        top: currentPosition.y,
        width: currentSize.width,
        height: currentSize.height,
        zIndex: zIndex,
        // CLEAN: All drop zone effects handled by hook
        ...dropZoneEffects.windowStyles
      }}
      data-window-id={windowId}
      onClick={() => {
        onBringToFront?.();
      }}
    >
      {/* Section 1: Window Header */}
      <div 
        className="window-header"
        onMouseDown={dragMouseDown}
        {...purgeNodeDragAttributes}
        {...purgeNodeDragListeners}
        style={dropZoneEffects.headerStyles}
      >
        <div 
          className="window-title"
          onDoubleClick={handleDoubleClick}
        >
          {title}
        </div>
        <button 
          className="window-minimize-button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            onClose();
          }}
          title="Minimize (or double-click title)"
          style={dropZoneEffects.buttonStyles}
        >
          −
        </button>
      </div>
      
      {/* DEBUG: Drop Zone Detection Status - Show when over special zones */}
      {dropZoneEffects.debugText && (
        <div className={`window-debug-overlay${dropZoneEffects.isOverTerminalDock ? ' terminal-dock' : ''}`}>
          {dropZoneEffects.debugText}
        </div>
      )}
      
      {/* Section 2: App Content */}
      <div 
        className="window-content"
        style={dropZoneEffects.contentStyles}
      >
        {children}
      </div>
      
      {/* DOCK OVERLAY: Show dock message when held over terminal */}
      {dropZoneEffects.showDockOverlay && (
        <div className="dock-overlay">
          <div className="dock-overlay-text">
            DOCK?
          </div>
        </div>
      )}
      
      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={dropZoneEffects.resizeHandleStyles}
      />
    </div>
  );
};

export default ScrAppWindow; 