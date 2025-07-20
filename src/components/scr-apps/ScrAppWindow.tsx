import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ScrAppWindow.css';
import { WINDOW_DEFAULTS } from '../../constants/windowConstants';
import { APP_REGISTRY } from '../../constants/scrAppListConstants';
import { useGameState_AppList } from '../../hooks/useGameState_AppList';
import { useDragHandler } from '../../hooks/useDragHandler';
import { clampPositionToBounds } from '../../utils/viewportConstraints';

// Base interface for all window management props
export interface BaseWindowProps {
  onClose: () => void;
  windowId: string;
  appType: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onWidthChange?: (width: number) => void;
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
  onPositionChange,
  onSizeChange,
  onWidthChange
}) => {
  const [currentSize, setCurrentSize] = useState(size);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

  // Use shared drag handler for window dragging with viewport constraints
  const footerHeight = isFooterExpanded ? 120 : 20;
  const { elementRef: windowRef, position: currentPosition, isDragging, handleMouseDown: dragMouseDown, setPosition } = useDragHandler({
    initialPosition: position,
    onPositionChange,
    constrainToViewport: true,
    elementSize: currentSize,
    footerHeight
  });

  // Get tier data for this app
  const { getAppTierData, changeAppTier } = useGameState_AppList();
  const tierData = getAppTierData(appType);
  const appRegistry = APP_REGISTRY[appType];



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
      if (onSizeChange) {
        onSizeChange(currentSize);
      }
      // Report width change for responsive behavior
      if (onWidthChange) {
        onWidthChange(currentSize.width);
      }
    }
  }, [isResizing, onSizeChange, onWidthChange, currentSize]);

  const handleDoubleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleFooterToggle = useCallback(() => {
    setIsFooterExpanded(prev => !prev);
  }, []);

  const handleUpgrade = useCallback(() => {
    const nextTier = tierData.currentTier + 1;
    const nextTierData = appRegistry?.tiers.find(t => t.tier === nextTier);
    
    if (nextTierData) {
      changeAppTier(appType, nextTier);
      // Could add credit deduction logic here if needed
        }
  }, [appType, tierData.currentTier, appRegistry, changeAppTier]);

  const handleDowngrade = useCallback(() => {
    const prevTier = tierData.currentTier - 1;
    const prevTierData = appRegistry?.tiers.find(t => t.tier === prevTier);
    
    if (prevTierData && prevTier >= 1) {
      changeAppTier(appType, prevTier);
      // Could add credit deduction logic here if needed
    }
  }, [appType, tierData.currentTier, appRegistry, changeAppTier]);

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

  // Check position when footer expands/collapses
  useEffect(() => {
    const constrainedPosition = clampPositionToBounds(currentPosition, currentSize, footerHeight);
    
    // Only update if position needs to change
    if (constrainedPosition.x !== currentPosition.x || constrainedPosition.y !== currentPosition.y) {
      setPosition(constrainedPosition);
      
      // Report the position change
      if (onPositionChange) {
        onPositionChange(constrainedPosition);
      }
    }
  }, [isFooterExpanded, currentSize.width, currentSize.height]); // Re-check when footer or size changes

  // Footer doesn't affect window height anymore - it protrudes outside

  const currentTier = tierData.currentTier;
  const nextTier = currentTier + 1;
  const prevTier = currentTier - 1;
  const currentTierData = appRegistry?.tiers.find(t => t.tier === currentTier);
  const nextTierData = appRegistry?.tiers.find(t => t.tier === nextTier);
  const prevTierData = appRegistry?.tiers.find(t => t.tier === prevTier);
  const canUpgrade = nextTierData !== undefined;
  const canDowngrade = prevTierData !== undefined && prevTier >= 1;

  return (
    <div 
      ref={windowRef}
      className="scr-app-window"
      style={{ 
        left: currentPosition.x, 
        top: currentPosition.y,
        width: currentSize.width,
        height: currentSize.height,
        userSelect: (isDragging || isResizing) ? 'none' : 'auto'
      }}
      data-window-id={windowId}
    >
      {/* Section 1: Window Header */}
      <div 
        className="window-header"
        onMouseDown={dragMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="window-title">{title}</div>
      </div>
      
      {/* Section 2: App Content */}
      <div className="window-content">
        {children}
      </div>
      
      {/* Section 3: Collapsible Footer - positioned outside window */}
      <div className={`window-footer ${isFooterExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="footer-toggle" onClick={handleFooterToggle}>
          {isFooterExpanded ? '▲ HIDE' : '▼ DATA'}
        </div>
        
        {isFooterExpanded && (
          <div className="footer-content">
            <div className="tier-info-line">
              App Tier: {currentTier}
            </div>
            <div className="monthly-info">
              Monthly: ₵{currentTierData?.monthlyCost || 0}/cycle
            </div>
            <div className="tier-description">
              {canUpgrade ? nextTierData.information : currentTierData?.information || 'No information available'}
            </div>
            <div className="footer-buttons">
              <div className="button-group">
                <div className="button-cost-text">
                  ₵{currentTierData?.flatDowngradeCost || 0}
                </div>
                <button 
                  className="downgrade-button" 
                  onClick={handleDowngrade}
                  disabled={!canDowngrade}
                >
                  Downgrade
                </button>
              </div>
              <div className="button-group">
                <div className="button-cost-text">
                  ₵{nextTierData?.flatUpgradeCost || 0}
                </div>
                <button 
                  className="upgrade-button" 
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div 
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default ScrAppWindow; 