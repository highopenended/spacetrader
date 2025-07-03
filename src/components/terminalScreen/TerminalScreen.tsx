import React from 'react';
import './TerminalScreen.css';
import { DndContext, DragOverlay, closestCenter, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '../scr-apps/SortableItem';
import { useScrAppListManager } from '../../hooks/useScrAppListManager';
import { GamePhase, GameTime } from '../../types/gameState';

interface TerminalScreenProps {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  isOnline?: boolean;
  onAppClick?: (appType: string, title: string, content?: React.ReactNode) => void;
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({ 
  credits, 
  gameTime, 
  gamePhase, 
  isOnline = true,
  onAppClick
}) => {
  const { 
    apps, 
    appOrder, 
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd 
  } = useScrAppListManager();

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
    <div className="terminal-screen">
      <div className="terminal-header">
        <div className="terminal-title">SCRAPCOM TERMINAL</div>
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <div className="status-light"></div>
          <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
        </div>
      </div>
      
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
        <div className="terminal-content">
          <SortableContext 
            items={appOrder} 
            strategy={verticalListSortingStrategy}
          >
            {apps.map((appConfig) => (
              <SortableItem
                key={appConfig.id}
                id={appConfig.id}
                onAppClick={() => onAppClick?.(appConfig.id, appConfig.title)}
              >
                {renderApp(appConfig)}
              </SortableItem>
            ))}
          </SortableContext>
        </div>

        <DragOverlay 
          dropAnimation={{
            duration: 0, // Disable drop animation
            easing: 'ease',
          }}
        >
          {dragState.isDragging && dragState.draggedAppId ? (
            <div style={{ opacity: 0.8 }}>
              {renderApp(apps.find(app => app.id === dragState.draggedAppId))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <div className="terminal-scanlines"></div>
    </div>
  );
};

export default TerminalScreen; 