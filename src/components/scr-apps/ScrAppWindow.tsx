import React, { useState, useRef, useCallback } from 'react';
import './ScrAppWindow.css';
import { WINDOW_DEFAULTS } from '../../constants/windowConstants';
import { APP_REGISTRY } from '../../constants/scrAppListConstants';
import { useGameState_AppList } from '../../hooks/useGameState_AppList';

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
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentSize, setCurrentSize] = useState(size);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  // Get tier data for this app
  const { getAppTierData, changeAppTier } = useGameState_AppList();
  const tierData = getAppTierData(appType);
  const appRegistry = APP_REGISTRY[appType];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!windowRef.current) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

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
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setCurrentPosition(newPosition);
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newSize = {
        width: Math.max(minSize.width, resizeStart.width + deltaX),
        height: Math.max(minSize.height, resizeStart.height + deltaY)
      };
      
      setCurrentSize(newSize);
    }
  }, [isDragging, isResizing, dragStart, resizeStart, minSize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Report the final position back to parent
      if (onPositionChange) {
        onPositionChange(currentPosition);
      }
    } else if (isResizing) {
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
  }, [isDragging, isResizing, onPositionChange, onSizeChange, onWidthChange, currentPosition, currentSize]);

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

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Report width changes during resizing for responsive behavior
  React.useEffect(() => {
    if (isResizing && onWidthChange) {
      onWidthChange(currentSize.width);
    }
  }, [currentSize.width, isResizing, onWidthChange]);

  // Footer doesn't affect window height anymore - it protrudes outside

  const currentTier = tierData.currentTier;
  const nextTier = currentTier + 1;
  const currentTierData = appRegistry?.tiers.find(t => t.tier === currentTier);
  const nextTierData = appRegistry?.tiers.find(t => t.tier === nextTier);
  const canUpgrade = nextTierData !== undefined;

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
        onMouseDown={handleMouseDown}
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
              {canUpgrade ? (
                <>App Tier: {currentTier} → {nextTier} (₵{nextTierData.flatCost} upgrade)</>
              ) : (
                <>App Tier: {currentTier} (Max Tier)</>
              )}
            </div>
            <div className="monthly-info">
              Monthly: ₵{currentTierData?.monthlyCost || 0}/cycle
            </div>
            <div className="tier-description">
              {canUpgrade ? nextTierData.information : currentTierData?.information || 'No information available'}
            </div>
            <div className="footer-buttons">
              {canUpgrade && (
                <button className="upgrade-button" onClick={handleUpgrade}>
                  Upgrade Tier
                </button>
              )}
              <button className="close-info-button" onClick={handleFooterToggle}>
                Close Info
              </button>
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