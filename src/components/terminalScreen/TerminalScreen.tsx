import React from 'react';
import './TerminalScreen.css';
import { DndContext, DragOverlay, closestCenter, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../scr-apps/SortableItem';
import DeleteZone from '../scr-apps/DeleteZone';
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
  pendingDeleteAppId = null
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
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={[
        // Require minimum distance before drag starts to prevent click interference
        useSensor(PointerSensor, {
          activationConstraint: {
            distance: 10, // Must move 10px before drag activates
          },
        }),
      ]}
    >
      {/* Delete zone covers entire screen behind terminal */}
      <DeleteZone isActive={dragState.isOverDeleteZone} />
      
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
              // Hide the app if it's being dragged out OR if it's pending deletion confirmation
              const isDraggedAndOutside = dragState.isDragging && dragState.draggedAppId === appConfig.id && dragState.isOverDeleteZone;
              const isPendingDelete = pendingDeleteAppId === appConfig.id;
              if (isDraggedAndOutside || isPendingDelete) return null;
              return (
                <SortableItem
                  key={appConfig.id}
                  id={appConfig.id}
                  onAppClick={() => onAppClick?.(appConfig.id, appConfig.title)}
                  isOverDeleteZone={dragState.isOverDeleteZone && dragState.draggedAppId === appConfig.id}
                >
                  {renderApp(appConfig)}
                </SortableItem>
              );
            })}
          </SortableContext>
        </div>
      
        <div className="terminal-scanlines"></div>
      </div>

      {createPortal(
        <DragOverlay 
          zIndex={2000}
          dropAnimation={{
            duration: 0, // Disable drop animation
            easing: 'ease',
          }}
        >
          {/* Only show overlay when dragging and outside terminal (isOverDeleteZone) */}
          {dragState.isDragging && dragState.isOverDeleteZone && dragState.draggedAppId ? (
            <div 
              className={`sortable-item dragging over-delete-zone`}
              style={{ opacity: 0.8, position: 'relative' }}
            >
              {renderApp(apps.find(app => app.id === dragState.draggedAppId))}
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

export default TerminalScreen; 