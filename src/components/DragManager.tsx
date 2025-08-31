import React from 'react';
import { DragOverlay, DndContext } from '@dnd-kit/core';
import { useUnifiedDrag } from '../hooks/useUnifiedDrag';
import { InstalledApp } from '../types/appListState';
import { DragContextProvider } from '../contexts/DragContext';

interface DragManagerProps {
  children: React.ReactNode;
  installedApps: InstalledApp[];
  apps: any[];
  appOrder: string[];
  appPropsMap: Record<string, any>;
  reorderApps: (apps: InstalledApp[]) => void;
  uninstallApp: (appId: string) => void;
  closeWindowsByAppType: (appType: string) => void;
  installAppOrder: (order: string[]) => void;
  openOrCloseWindow: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }) => void;
}

const DragManager: React.FC<DragManagerProps> = ({
  children,
  installedApps,
  apps,
  appOrder,
  appPropsMap,
  reorderApps,
  uninstallApp,
  closeWindowsByAppType,
  installAppOrder,
  openOrCloseWindow
}) => {
  // Use unified drag hook
  const {
    dragState,
    overId,
    isOverTerminalDropZone,
    pendingDelete,
    sensors,
    customCollisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useUnifiedDrag({
    installedApps,
    apps,
    appOrder,
    onAppsReorder: reorderApps,
    onAppUninstall: uninstallApp,
    closeWindowsByAppType,
    installAppOrder,
    openOrCloseWindow
  });

  // Create drag context value (memoized, minimal churn)
  const dragContextValue = React.useMemo(() => ({
    overId,
    isOverTerminalDropZone,
    isDragging: dragState.isDragging,
    draggedAppType: dragState.draggedAppType,
    dragType: dragState.isDragging
      ? (dragState.draggedAppType ? 'window-drag-node' as const : 'app-drag-node' as const)
      : 'none' as const
  }), [
    overId,
    isOverTerminalDropZone,
    dragState.isDragging,
    dragState.draggedAppType
  ]);

  // DragOverlay content helper (purely visual, for ghost image of app being dragged)
  const renderDragOverlay_AppGhost = () => {
    // STANDARD DRAG SYSTEM: Full app preview for app list reordering
    if (dragState.isDragging && dragState.draggedAppId) {
      const appConfig = apps.find(app => app.id === dragState.draggedAppId);
      if (!appConfig) return null;

      const AppComponent = appConfig.component;
      const appProps = appPropsMap[appConfig.id];

      return (
        <DragOverlay
          zIndex={2000}
          dropAnimation={{ duration: 0, easing: 'ease' }}
        >
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
    if (dragState.isDragging && dragState.draggedAppType) {
      return (
        <DragOverlay 
          zIndex={2000}
          dropAnimation={{ duration: 0, easing: 'ease' }}
          style={{
            position: 'fixed' as const,
            left: dragState.mousePosition ? dragState.mousePosition.x - 6 : 0, // Center 12px indicator on cursor
            top: dragState.mousePosition ? dragState.mousePosition.y - 6 : 0,
            transform: 'none', // Override @dnd-kit's transform
            pointerEvents: 'none' as const
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
            title={`Deleting: ${dragState.draggedWindowTitle}`}
          />
        </DragOverlay>
      );
    }

    return null;
  };

  // Create DndContext configuration
  const dndContextProps = {
    sensors,
    collisionDetection: customCollisionDetection,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: (event: any) => {
      handleDragEnd(event);
      
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
          const mousePosition = dragState.mousePosition;
          if (mousePosition) {
            openOrCloseWindow(appId, appConfig.name, undefined, mousePosition);
          } else {
            openOrCloseWindow(appId, appConfig.name);
          }
        }
      }
    }
  };

  return (
    <DragContextProvider value={dragContextValue}>
      <DndContext {...dndContextProps}>
        {children}
        {renderDragOverlay_AppGhost()}
        {renderDragOverlay_DragNode()}
        
        {/* Debug readout for overId and drag type */}
        {/* <div
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
          dragType: {dragState.isDragging ? (dragState.draggedAppType ? 'window-drag-node' : 'app-drag-node') : 'none'}
          <br />
          overTerminal: {isOverTerminalDropZone ? 'true' : 'false'}
          <br />
          appDragPos: {dragState.mousePosition ? `${dragState.mousePosition.x}, ${dragState.mousePosition.y}` : 'null'}
          <br />
          toBePurged: {pendingDelete.appId || 'null'}
        </div> */}
      </DndContext>
    </DragContextProvider>
  );
};

export default DragManager; 