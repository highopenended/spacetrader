import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import ScrAppWindow from './components/scr-apps/scrAppWindow/ScrAppWindow';
import AgeAppWindow from './components/scr-apps/ageApp/window/AgeAppWindow';
import JobTitleAppWindow from './components/scr-apps/jobTitleApp/window/JobTitleAppWindow';
import PurgeZoneAppWindow from './components/scr-apps/purgeZoneApp/window/PurgeZoneAppWindow';
import ScrAppStoreAppWindow from './components/scr-apps/scrAppStoreApp/window/ScrAppStoreAppWindow';
import ChronoTrackAppWindow from './components/scr-apps/chronoTrackApp/window/ChronoTrackAppWindow';
import WorkScreen from './components/workMode/WorkScreen';
import { useGameState } from './hooks/useGameState';
import { useWindowManager } from './hooks/useWindowManager';
import { useDragHandler_Apps } from './hooks/useDragHandler_Apps';
import { WindowData } from './types/gameState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';

import { DndContext, DragOverlay, useSensor, PointerSensor, rectIntersection, UniqueIdentifier } from '@dnd-kit/core';
import { getAppProps } from './utils/appPropsBuilder';
import { ToggleProvider } from './contexts/ToggleContext';
import DataReadout from './components/DataReadout';

function App() {
  const {
    // Core state
    credits,
    gamePhase,
    gameTime,
    isPaused,
    apps,
    appOrder,
    installedApps,
    gameMode,
    
    // Actions
    updateCredits,
    setCredits,
    setGamePhase,
    advanceGamePhase,
    setGameTime,
    pauseTime,
    resumeTime,
    installApp,
    uninstallApp,
    reorderApps,
    getAvailableApps,
    resetToDefaults,
    resetGame,
    beginWorkSession
  } = useGameState();

  // Set up app drag handler
  const { dragState, handleDragStart, handleDragOver, handleDragEnd } = useDragHandler_Apps({
    installedApps,
    onAppsReorder: reorderApps,
    onAppUninstall: uninstallApp
  });

  const {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    closeWindow,
    closeWindowsByAppType,
    bringToFront,
    dockAllWindows,
  } = useWindowManager();

  const [pendingDelete, setPendingDelete] = React.useState<{
    appId: string | null;
    prevOrder: string[];
  }>({ appId: null, prevOrder: [] });

  // PURGE NODE DRAG SYSTEM: Track purge node drag state separately from app list drag state
  const [purgeNodeDragState, setPurgeNodeDragState] = React.useState<{
    isPurgeNodeDragging: boolean;
    draggedWindowTitle: string | null;
    draggedAppType: string | null;
    mousePosition: { x: number; y: number } | null;
  }>({
    isPurgeNodeDragging: false,
    draggedWindowTitle: null,
    draggedAppType: null,
    mousePosition: null
  });

  // Clean dnd-kit: track current droppable id
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);



  // Custom collision detection to allow dropping on multiple zones (purge zone, terminal dock, sortable list)
  const customCollisionDetection = (args: any) => {
    const collisions = rectIntersection(args);
    
    // PREVENTION: Block PurgeZone window from detecting itself as a valid drop target
    // This prevents visual feedback (red effects, "PURGE RISK") from showing during self-targeting
    if (args.active?.data?.current?.type === 'window-purge-node' && 
        args.active?.data?.current?.appType === 'purgeZone') {
      // Remove purge-zone-window from collisions for PurgeZone window drag
      const filteredCollisions = collisions.filter(c => c.id !== 'purge-zone-window');
      
      // Still allow terminal dock detection for PurgeZone window
      const terminalDock = filteredCollisions.find(c => c.id === 'terminal-dock-zone');
      if (terminalDock) return [terminalDock];
      
      return filteredCollisions;
    }
    
    // WINDOW PURGE NODE DRAG SYSTEM: Apply priority only for window deletion drags
    if (args.active?.data?.current?.type === 'window-purge-node') {
      const purgeZone = collisions.find(c => c.id === 'purge-zone-window');
      const terminalDock = collisions.find(c => c.id === 'terminal-dock-zone');
      
      if (purgeZone) return [purgeZone];
      if (terminalDock) return [terminalDock];
      
      return collisions;
    }
    
    // APP LIST DRAG SYSTEM: Use normal sortable behavior for app reordering
    // Don't apply any priority - let @dnd-kit handle normal sortable collisions
    // Filter out terminal-dock-zone so app list drags never trigger docking behavior
    const filteredCollisions = collisions.filter(c => c.id !== 'terminal-dock-zone');
    return filteredCollisions;
  };

  /**
   * UNIFIED DRAG START HANDLER - Manages Both Drag Systems
   * 
   * This handler coordinates between two different drag systems:
   * 1. Standard app list drag (for reordering apps in terminal)
   * 2. Purge node drag (for deleting windows by dragging into PurgeZone)
   * 
   * The handler detects which system is being used based on the drag data type:
   * - 'window-purge-node': Window deletion drag → Update purgeNodeDragState
   * - Standard app IDs: App reordering drag → Use existing handleDragStart
   * 
   * This enables consistent drag behavior while maintaining separate state tracking
   * for each system's specific needs.
   */
  const handleUnifiedDragStart = React.useCallback((event: any) => {
    const { active } = event;
    
    // PURGE NODE DRAG SYSTEM: Handle window deletion drag start
    if (active.data?.current?.type === 'window-purge-node') {
      const { windowTitle, appType } = active.data.current;
      setPurgeNodeDragState({
        isPurgeNodeDragging: true,
        draggedWindowTitle: windowTitle,
        draggedAppType: appType,
        mousePosition: null // Will be updated by mouse move handler
      });
      
      // Add mouse move listener to track cursor position for purge indicator
      const handlePurgeNodeMouseMove = (e: MouseEvent) => {
        setPurgeNodeDragState(prev => ({
          ...prev,
          mousePosition: { x: e.clientX, y: e.clientY }
        }));
      };
      
      document.addEventListener('mousemove', handlePurgeNodeMouseMove);
      
      // Store cleanup function for drag end
      (window as any).__purgeNodeMouseMoveCleanup = () => {
        document.removeEventListener('mousemove', handlePurgeNodeMouseMove);
      };
    } else {
      // STANDARD DRAG SYSTEM: Handle app list reordering drag start
      handleDragStart(event);
    }
  }, [handleDragStart]);

  /**
   * UNIFIED DRAG END HANDLER - Coordinates Drag Completion for Both Systems
   * 
   * This handler manages the completion of drag operations for both drag systems:
   * 1. Resets purge node drag state (always, regardless of drop target)
   * 2. Handles deletion if dropped on PurgeZone (for both systems)
   * 3. Delegates to standard drag handler for app reordering (when appropriate)
   * 
   * DELETION LOGIC:
   * - Window purge nodes: Use appType from drag data for deletion
   * - App list items: Use app ID to find definition and check deletability
   * - Both trigger the same deletion confirmation popup
   * 
   * DELEGATION LOGIC:
   * - Purge node drags: Handle entirely here, don't delegate
   * - Standard drags: Delegate to useGameState_AppList handleDragEnd for reordering
   */
  const handleUnifiedDragEnd = React.useCallback((event: any) => {
    const { active, over } = event;
    
    // PURGE NODE DRAG SYSTEM: Always reset purge drag state when drag ends
    setPurgeNodeDragState({
      isPurgeNodeDragging: false,
      draggedWindowTitle: null,
      draggedAppType: null,
      mousePosition: null
    });
    
    // Clean up mouse move listener for purge node tracking
    if ((window as any).__purgeNodeMouseMoveCleanup) {
      (window as any).__purgeNodeMouseMoveCleanup();
      delete (window as any).__purgeNodeMouseMoveCleanup;
    }
    
    if (!over) return;
    
    // DELETION HANDLING: Check if dropped on PurgeZone (handles both systems)
    if (over.id === 'purge-zone-window') {
      // PURGE NODE DRAG SYSTEM: Handle window deletion via purge node
      if (active.data?.current?.type === 'window-purge-node') {
        const { appType, deletable, windowTitle } = active.data.current;
        
        // PREVENTION: PurgeZone window cannot purge itself
        // This maintains the intended behavior while still allowing PurgeZone to be deletable from other sources
        if (appType === 'purgeZone' && over.id === 'purge-zone-window') {
          return; // Silently ignore self-targeting
        }
        
        if (deletable) {
          setPendingDelete({ appId: appType, prevOrder: appOrder });
          return;
        }
      }
      
      // STANDARD DRAG SYSTEM: Handle app list item deletion (existing logic)
      const appDefinition = apps.find((app: any) => app.id === active.id);
      if (appDefinition && appDefinition.deletable) {
        setPendingDelete({ appId: active.id, prevOrder: appOrder });
        return;
      }
    }
    
    // WINDOW DOCKING SYSTEM: Check if dropped on Terminal for docking (minimize)
    if (over.id === 'terminal-dock-zone') {
      // PURGE NODE DRAG SYSTEM: Handle window docking via purge node
      if (active.data?.current?.type === 'window-purge-node') {
        const { appType } = active.data.current;
        closeWindowsByAppType(appType); // Same behavior as minimize button
        setOverId(null); // Reset overId to hide dock message
        return;
      }
      // APP LIST DRAG SYSTEM: If app list drag hits terminal-dock-zone, ignore it
      // This prevents app reordering from being treated as window docking
      return;
    }
    
    // STANDARD DRAG SYSTEM: Delegate to unified game state handler for reordering
    // Only call for non-purge-node drags to avoid interfering with window positioning
    if (active.data?.current?.type !== 'window-purge-node') {
      handleDragEnd(event);
    }
  }, [apps, appOrder, handleDragEnd]);

  const handleConfirmPurge = React.useCallback(() => {
    if (pendingDelete.appId) {
      closeWindowsByAppType(pendingDelete.appId);
      uninstallApp(pendingDelete.appId);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
  }, [pendingDelete, uninstallApp, closeWindowsByAppType]);

  const handleCancelPurge = React.useCallback(() => {
    if (pendingDelete.prevOrder.length) {
      installAppOrder(pendingDelete.prevOrder);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
  }, [pendingDelete]);



  const installAppOrder = (order: string[]) => {
    if (order.join(',') !== appOrder.join(',')) {
      const newInstalled = order.map((id, idx) => {
        const found = apps.find((app: any) => app.id === id);
        if (found) {
          return {
            id: found.id,
            order: idx + 1,
            purchased: true,
            installedAt: found.installedAt || Date.now(),
          };
        }
        return null;
      }).filter(Boolean);
      if (newInstalled.length === order.length) {
        resetToDefaults();
                  newInstalled.forEach((app: any, idx) => {
            if (app) installApp(app.id, idx + 1);
          });
      }
    }
  };

  // resetGame is now provided by useGameState hook

  const renderWindow = (window: WindowData) => {
    if (window.appType === 'purgeZone') {
      return (
        <PurgeZoneAppWindow
          key={window.id}
          windowId={window.id}
          appType={window.appType}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          overId={overId}
          draggedAppType={purgeNodeDragState.draggedAppType}
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
          onBringToFront={() => bringToFront(window.id)}
          updateCredits={updateCredits}
        />
      );
    }
    if (window.appType === 'age') {
      return (
        <AgeAppWindow
          key={window.id}
          gameTime={gameTime}
          windowId={window.id}
          appType={window.appType}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          overId={overId}
          draggedAppType={purgeNodeDragState.draggedAppType}
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
          onBringToFront={() => bringToFront(window.id)}
          updateCredits={updateCredits}
        />
      );
    }
    if (window.appType === 'jobTitle') {
      return (
        <JobTitleAppWindow
          key={window.id}
          gamePhase={gamePhase}
          gameMode={gameMode}
          onBeginWorkSession={beginWorkSession}
          windowId={window.id}
          appType={window.appType}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          overId={overId}
          draggedAppType={purgeNodeDragState.draggedAppType}
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
          onBringToFront={() => bringToFront(window.id)}
          updateCredits={updateCredits}
        />
      );
    }
    if (window.appType === 'scrAppStore') {
      return (
        <ScrAppStoreAppWindow
          key={window.id}
          credits={credits}
          gamePhase={gamePhase}
          getAvailableApps={getAvailableApps}
          installedApps={installedApps}
          installApp={installApp}
          windowId={window.id}
          appType={window.appType}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          overId={overId}
          draggedAppType={purgeNodeDragState.draggedAppType}
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
          onBringToFront={() => bringToFront(window.id)}
          updateCredits={updateCredits}
        />
      );
    }
    if (window.appType === 'chronoTrack') {
      return (
        <ChronoTrackAppWindow
          key={window.id}
          gameTime={gameTime}
          gamePhase={gamePhase}
          windowId={window.id}
          appType={window.appType}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          overId={overId}
          draggedAppType={purgeNodeDragState.draggedAppType}
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
          onBringToFront={() => bringToFront(window.id)}
          updateCredits={updateCredits}
        />
      );
    }
    return (
      <ScrAppWindow
        key={window.id}
        windowId={window.id}
        appType={window.appType}
        title={window.title}
        position={window.position}
        size={window.size}
        zIndex={window.zIndex}
        overId={overId}
        draggedAppType={purgeNodeDragState.draggedAppType}
        onClose={() => closeWindow(window.id)}
        onPositionChange={(position) => updateWindowPosition(window.appType, position)}
        onSizeChange={(size) => updateWindowSize(window.appType, size)}
        onBringToFront={() => bringToFront(window.id)}
        updateCredits={updateCredits}
      >
        {window.content}
      </ScrAppWindow>
    );
  };

  return (
    <ToggleProvider installedApps={installedApps}>
      <DndContext
        collisionDetection={customCollisionDetection}
        onDragStart={handleUnifiedDragStart}
        onDragOver={event => setOverId(event.over?.id ?? null)}
        onDragEnd={handleUnifiedDragEnd}
        sensors={[
          useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
          }),
        ]}
      >
                <div className="App">
          <DataReadout />
          <TerminalScreen 
            credits={credits}
            gameTime={gameTime}
            gamePhase={gamePhase}
            isOnline={!isPaused}
            onAppClick={openOrCloseWindow}
            apps={apps}
            appOrder={appOrder}
            pendingDeleteAppId={pendingDelete.appId}
            openAppTypes={new Set(windows.map(w => w.appType))}
            overId={overId}
            onDockWindows={dockAllWindows}
          />
        <AdminToolbar 
          credits={credits}
          gamePhase={gamePhase}
          gameTime={gameTime}
          updateCredits={updateCredits}
          setCredits={setCredits}
          setGamePhase={setGamePhase}
          setGameTime={setGameTime}
          advanceGamePhase={advanceGamePhase}
          isPaused={isPaused}
          pauseTime={pauseTime}
          resumeTime={resumeTime}
          resetGame={resetGame}
        />
        {windows.map(renderWindow)}
        <PurgeConfirmPopup
          open={!!pendingDelete.appId}
          appName={pendingDelete.appId ? (apps.find((a: any) => a.id === pendingDelete.appId)?.name || pendingDelete.appId) : ''}
          onConfirm={handleConfirmPurge}
          onCancel={handleCancelPurge}
        />

        {gameMode === 'workMode' && <WorkScreen />}

        <DragOverlay 
          zIndex={2000}
          dropAnimation={{ duration: 0, easing: 'ease' }}
          style={{
            // PURGE NODE DRAG SYSTEM: Position overlay at mouse cursor for purge indicator
            ...(purgeNodeDragState.isPurgeNodeDragging && purgeNodeDragState.mousePosition && {
              position: 'fixed',
              left: purgeNodeDragState.mousePosition.x - 6, // Center 12px indicator on cursor
              top: purgeNodeDragState.mousePosition.y - 6,
              transform: 'none', // Override @dnd-kit's transform
              pointerEvents: 'none'
            })
          }}
        >
          {/* PURGE NODE DRAG SYSTEM: Tiny mouse-cursor-sized indicator for window deletion */}
          {purgeNodeDragState.isPurgeNodeDragging ? (
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
              title={`Deleting: ${purgeNodeDragState.draggedWindowTitle}`}
            />
          ) : 
          /* STANDARD DRAG SYSTEM: Full app preview for app list reordering */
          dragState.isDragging && dragState.draggedAppId ? (
            <div 
              className={`sortable-item dragging`}
              style={{ opacity: 0.8, position: 'relative' }}
            >
              {/* Render the dragged app in overlay */}
              {(() => {
                const appConfig = apps.find(app => app.id === dragState.draggedAppId);
                if (!appConfig) return null;
                const AppComponent = appConfig.component;
                const appProps = getAppProps(appConfig.id, { credits, gameTime, gamePhase });

                return <AppComponent {...appProps} />;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </div>
      </DndContext>
    </ToggleProvider>
  );
}

export default App;
