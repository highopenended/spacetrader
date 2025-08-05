import React from 'react';
import { DragOverlay, DndContext } from '@dnd-kit/core';
import { useDragHandler_Router } from '../hooks/useDragHandler_Router';
import { InstalledApp } from '../types/scrAppListState';

interface DragManagerProps {
  children: React.ReactNode;
  installedApps: InstalledApp[];
  apps: any[];
  appOrder: string[];
  appPropsMap: Record<string, any>;
  componentProps: any;
  reorderApps: (apps: InstalledApp[]) => void;
  uninstallApp: (appId: string) => void;
  closeWindowsByAppType: (appType: string) => void;
  installAppOrder: (order: string[]) => void;
  openOrCloseWindow: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }) => void;
  onOverIdChange: (overId: any) => void;
  onDragNodeStateChange: (dragNodeState: any) => void;
}

const DragManager: React.FC<DragManagerProps> = ({
  children,
  installedApps,
  apps,
  appOrder,
  appPropsMap,
  componentProps,
  reorderApps,
  uninstallApp,
  closeWindowsByAppType,
  installAppOrder,
  openOrCloseWindow,
  onOverIdChange,
  onDragNodeStateChange
}) => {
  // Use centralized drag handler router (now inside UIProvider)
  const {
    overId,
    isOverTerminalDropZone,
    appDragMousePosition,
    pendingDelete,
    dragNodeState,
    dragState,
    customCollisionDetection,
    handleUnifiedDragStart,
    handleUnifiedDragOver,
    handleUnifiedDragEnd,
    handleConfirmPurge,
    handleCancelPurge
  } = useDragHandler_Router({
    installedApps,
    onAppsReorder: reorderApps,
    onAppUninstall: uninstallApp,
    closeWindowsByAppType,
    installAppOrder
  });



  // DragOverlay content helper (purely visual, for ghost image of app being dragged)
  const renderDragOverlay_AppGhost = () => {
    // STANDARD DRAG SYSTEM: Full app preview for app list reordering
    if (dragState.isDragging && dragState.draggedAppId) {
      const appConfig = apps.find(app => app.id === dragState.draggedAppId);
      if (!appConfig) return null;

      const AppComponent = appConfig.component;
      const appProps = appPropsMap[appConfig.id];

      return (
        <DragOverlay {...componentProps.dragOverlay}>
          <div
            className={`sortable-item dragging`}
            style={{ opacity: 0.8, position: 'relative' }}
          >
            <AppComponent {...appProps} />
          </div>
        </DragOverlay>
      );
    }

    return null;
  };

  const renderDragOverlay_DragNode = () => {
    // DRAG NODE SYSTEM: Tiny mouse-cursor-sized indicator for window deletion
    if (dragNodeState.isDragNodeDragging) {
      return (
        <DragOverlay 
          {...componentProps.dragOverlay}
          style={{
            ...componentProps.dragOverlay.style,
            // DRAG NODE SYSTEM: Position overlay at mouse cursor for drag indicator
            ...(dragNodeState?.mousePosition && {
              position: 'fixed' as const,
              left: dragNodeState.mousePosition.x - 6, // Center 12px indicator on cursor
              top: dragNodeState.mousePosition.y - 6,
              transform: 'none', // Override @dnd-kit's transform
              pointerEvents: 'none' as const
            })
          }}
        >
          <div
            className="purge-node-drag-indicator"
            style={{
              width: '12px',
              height: '12px',
              background: 'linear-gradient(135deg, #ff4444 0%, #aa2222 100%)',
              border: '1px solid #ff6666',
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(255, 68, 68, 0.6)',
              opacity: 0.9,
              pointerEvents: 'none'
            }}
            title={`Deleting: ${dragNodeState.draggedWindowTitle}`}
          />
        </DragOverlay>
      );
    }

    return null;
  };

  // Notify parent of overId changes
  React.useEffect(() => {
    onOverIdChange(overId);
  }, [overId, onOverIdChange]);

  // Notify parent of dragNodeState changes
  React.useEffect(() => {
    onDragNodeStateChange(dragNodeState);
  }, [dragNodeState, onDragNodeStateChange]);

  // Create updated componentProps with drag handlers
  const updatedComponentProps = {
    ...componentProps,
    dndContext: {
      ...componentProps.dndContext,
      collisionDetection: customCollisionDetection,
      onDragStart: handleUnifiedDragStart,
      onDragOver: handleUnifiedDragOver,
      onDragEnd: (event: any) => {
        handleUnifiedDragEnd(event, apps, appOrder);
        
        // APP UNDOCK FEATURE: Open app as window when dropped outside terminal
        const { active, over } = event;
        if (active?.data?.current?.type === 'app-drag-node' && 
            !over && 
            !isOverTerminalDropZone) {
          // App was dropped outside terminal and not over any drop zone
          const appId = active.id;
          const appConfig = apps.find(app => app.id === appId);
          if (appConfig) {
            // Open window at drop coordinates (centered on drop point)
            if (appDragMousePosition) {
              openOrCloseWindow(appId, appConfig.name, undefined, appDragMousePosition);
            } else {
              openOrCloseWindow(appId, appConfig.name);
            }
          }
        }
      }
    }
  };

    return (
    <DndContext {...updatedComponentProps.dndContext}>
      {children}
      {renderDragOverlay_AppGhost()}
      {renderDragOverlay_DragNode()}
      
      {/* Debug readout for overId and drag type */}
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00ff00',
          padding: '8px 12px',
          borderRadius: '4px',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          zIndex: 9999,
          border: '1px solid #333',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
        }}
      >
        overId: {overId || 'null'}
        <br />
        dragType: {dragState.isDragging ? 'app-drag-node' : dragNodeState.isDragNodeDragging ? 'window-drag-node' : 'none'}
        <br />
        overTerminal: {isOverTerminalDropZone ? 'true' : 'false'}
        <br />
        appDragPos: {appDragMousePosition ? `${appDragMousePosition.x}, ${appDragMousePosition.y}` : 'null'}
        <br />
        toBePurged: {pendingDelete.appId || 'null'}
      </div>
    </DndContext>
  );
};

export default DragManager; 