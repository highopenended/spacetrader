import React from 'react';
import './TerminalScreen.css';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { UniqueIdentifier } from '@dnd-kit/core';
import SortableItem from '../scr-apps/SortableItem';
import PurgeZoneAppWindow from '../scr-apps/purgeZoneApp/window/PurgeZoneAppWindow';

import { GamePhase, GameTime } from '../../types/gameState';
import { createPortal } from 'react-dom';

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
  purgeZoneWindowProps: any;
  overId: UniqueIdentifier | null;
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
  purgeZoneWindowProps,
  overId,
}) => {
  // Render an app based on its configuration
  const renderApp = (appConfig: any) => {
    if (!appConfig) return null;
    
    const AppComponent = appConfig.component;
    
    // Build props based on app ID
    const getAppProps = () => {
      switch (appConfig.id) {
        case 'credits':
          return { credits };
        case 'jobTitle':
          return { gamePhase };
        case 'age':
          return { gameTime };
        case 'date':
          return { gameTime, gamePhase };
        case 'scrAppStore':
          return { hasNewApps: true };
        default:
          return {};
      }
    };

    return (
      <AppComponent 
        {...getAppProps()}
      />
    );
  };

  return (
    <>
      {purgeZoneWindowProps && (
        <PurgeZoneAppWindow {...purgeZoneWindowProps} overId={overId} />
      )}
      <div className="terminal-screen">
        <div className="terminal-header">
          <div className="terminal-title">SCRAPCOM TERMINAL</div>
          <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            <div className="status-light"></div>
            <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
        </div>
        
        <div className="terminal-content">  
            <SortableContext 
              items={appOrder} 
              strategy={verticalListSortingStrategy}
            >
              {apps.map((appConfig) => {
                // Hide the app if it's pending deletion confirmation
                const isPendingDelete = pendingDeleteAppId === appConfig.id;
                if (isPendingDelete) return null;
                const isWindowOpen = openAppTypes.has(appConfig.id);
                return (
                  <SortableItem
                    key={appConfig.id}
                    id={appConfig.id}
                    onAppClick={() => onAppClick?.(appConfig.id, appConfig.title)}
                    isWindowOpen={isWindowOpen}
                  >
                    {renderApp(appConfig)}
                  </SortableItem>
                );
              })}
            </SortableContext>
          </div>
        
        <div className="terminal-scanlines"></div>
      </div>
    </>
  );
};

export default TerminalScreen; 