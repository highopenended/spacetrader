import React, { useState, useCallback, useEffect } from 'react';
import './TerminalScreen.css';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import SortableItem from '../scr-apps/SortableItem';

import { GamePhase, GameTime } from '../../types/gameState';
import { createPortal } from 'react-dom';
import { getAppProps } from '../../utils/appPropsBuilder';

// Placeholder for purge confirmation popup
// import PurgeConfirmPopup from '../ui/PurgeConfirmPopup';

interface TerminalScreenProps {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  isOnline?: boolean;
  onAppClick?: (appType: string, title: string, content?: React.ReactNode) => void;
  apps: any[];
  appOrder: string[];
  dragState: any;
  handleDragStart: (event: any) => void;
  handleDragOver: (event: any) => void;
  handleDragEnd: (event: any) => void;
  installApp: (appId: string, position?: number) => void;
  uninstallApp: (appId: string) => void;
  pendingDeleteAppId?: string | null;
  openAppTypes?: Set<string>;
  overId?: any; // For drag-over detection (window docking)
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({ 
  credits, 
  gameTime, 
  gamePhase, 
  isOnline = true,
  onAppClick,
  apps,
  appOrder,
  dragState,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  installApp,
  uninstallApp,
  pendingDeleteAppId = null,
  openAppTypes = new Set(),
  overId
}) => {
  // Resize state
  const [height, setHeight] = useState<number>(window.innerHeight); // Start at full viewport height
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

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
    const minHeight = 200; // Minimum terminal height
    const maxHeight = window.innerHeight; // Full viewport height
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    // Snap to full height when close to bottom
    const snapThreshold = 20;
    const distanceFromBottom = window.innerHeight - (e.clientY + 8); // 8px for handle height
    
    if (distanceFromBottom < snapThreshold) {
      newHeight = maxHeight;
    }
    
    setHeight(newHeight);
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
        <div className="terminal-header">
          <div className="terminal-title">SCRAPCOM TERMINAL</div>
          <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            <div className="status-light"></div>
            <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
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