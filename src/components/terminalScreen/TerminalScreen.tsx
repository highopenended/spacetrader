import React, { useState, useCallback, useEffect } from 'react';
import './TerminalScreen.css';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import SortableItem from '../scr-apps/SortableItem';
import DockWindowsButton from './DockWindowsButton';
import TerminalToggle from './TerminalToggle';

import { GamePhase, GameTime } from '../../types/gameState';
import { getAppProps } from '../../utils/appPropsBuilder';

interface TerminalScreenProps {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  isOnline?: boolean;
  onAppClick?: (appType: string, title: string, content?: React.ReactNode) => void;
  apps: any[];
  appOrder: string[];
  pendingDeleteAppId?: string | null;
  openAppTypes?: Set<string>;
  overId?: any; // For drag-over detection (window docking)
  onDockWindows?: () => void;
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({ 
  credits, 
  gameTime, 
  gamePhase, 
  isOnline = true,
  onAppClick,
  apps,
  appOrder,
  pendingDeleteAppId = null,
  openAppTypes = new Set(),
  overId,
  onDockWindows
}) => {
  // Resize state
  const [height, setHeight] = useState<number>(window.innerHeight); // Start at full viewport height
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [previousHeight, setPreviousHeight] = useState<number>(window.innerHeight);

  // WINDOW DOCKING SYSTEM: Make terminal droppable for window docking
  const { setNodeRef } = useDroppable({
    id: 'terminal-dock-zone',
  });

  const isDockActive = overId === 'terminal-dock-zone';

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStartY(e.clientY);
    setResizeStartHeight(height);
  }, [height]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - resizeStartY;
    let newHeight = resizeStartHeight + deltaY; // Changed from - to + to make dragging down increase height
    
    // Constrain to viewport bounds
    const minHeight = 60; // Minimum terminal height (header only)
    const maxHeight = window.innerHeight; // Full viewport height
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    // Snap to full height when close to bottom
    const snapThreshold = 20;
    const distanceFromBottom = window.innerHeight - (e.clientY + 8); // 8px for handle height
    
    if (distanceFromBottom < snapThreshold) {
      newHeight = maxHeight;
    }
    
    setHeight(newHeight);
    
    // Update minimized state based on height
    if (newHeight <= 60) {
      setIsMinimized(true);
    } else {
      setIsMinimized(false);
    }
  }, [isResizing, resizeStartY, resizeStartHeight]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Set up resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Single-click handler for minimize/restore
  const handleClick = useCallback(() => {
    if (isMinimized) {
      // Restore to previous height
      setHeight(previousHeight);
      setIsMinimized(false);
    } else {
      // Minimize to header height only
      setPreviousHeight(height);
      setHeight(60); // Header height + padding
      setIsMinimized(true);
    }
  }, [isMinimized, previousHeight, height]);

  // Render an app based on its configuration
  const renderApp = (appConfig: any) => {
    if (!appConfig) return null;
    
    const AppComponent = appConfig.component;
    const appProps = getAppProps(appConfig.id, { credits, gameTime, gamePhase });

    return (
      <AppComponent 
        {...appProps}
      />
    );
  };

  return (
    <div 
      className="terminal-screen"
      style={{ height: `${height}px` }}
    >
        <div 
          className={`terminal-header ${isMinimized ? 'minimized' : ''}`}
        >
          <div className="terminal-title">
            SCRAPCOM TERMINAL
            {isMinimized && <span className="minimize-indicator"> [MIN]</span>}
          </div>
          <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            <div className="status-light"></div>
            <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
        </div>
        
        <div className="terminal-controls">
          <DockWindowsButton 
            onDockWindows={onDockWindows || (() => {})}
            hasOpenWindows={openAppTypes.size > 0}
            openWindowCount={openAppTypes.size}
          />
          <TerminalToggle 
            isMinimized={isMinimized}
            onToggle={handleClick}
          />
        </div>
        
        <div 
          ref={setNodeRef}
          className={`terminal-content${isDockActive ? ' dock-active' : ''}`}
        >  
            <SortableContext 
              items={appOrder} 
              strategy={verticalListSortingStrategy}
            >
              {apps
                .filter((appConfig) => {
                  const isPendingDelete = pendingDeleteAppId === appConfig.id;
                  const isWindowOpen = openAppTypes.has(appConfig.id);
                  return !isPendingDelete && !isWindowOpen;
                })
                .map((appConfig) => (
                  <SortableItem
                    key={appConfig.id}
                    id={appConfig.id}
                    onAppClick={() => onAppClick?.(appConfig.id, appConfig.name)}
                  >
                    {renderApp(appConfig)}
                  </SortableItem>
                ))
              }
            </SortableContext>
          </div>
        
        <div className="terminal-resize-handle" onMouseDown={handleResizeStart}></div>
        <div className="terminal-scanlines"></div>
      </div>
  );
};

export default TerminalScreen; 