import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import ScrAppWindow from './components/scr-apps/ScrAppWindow';
import AgeAppWindow from './components/scr-apps/ageApp/window/AgeAppWindow';
import JobTitleAppWindow from './components/scr-apps/jobTitleApp/window/JobTitleAppWindow';
import PurgeZoneAppWindow from './components/scr-apps/purgeZoneApp/window/PurgeZoneAppWindow';
import { useGameState_Credits } from './hooks/useGameState_Credits';
import { useGameState_Phases } from './hooks/useGameState_Phases';
import { useGameState_Time } from './hooks/useGameState_Time';
import { useWindowManager } from './hooks/useWindowManager';
import { useGameState_AppList } from './hooks/useGameState_AppList';
import { WindowData } from './types/gameState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';

import { APP_REGISTRY } from './constants/scrAppListConstants';
import { DndContext, DragOverlay, useSensor, PointerSensor, rectIntersection, UniqueIdentifier } from '@dnd-kit/core';
import { getAppProps } from './utils/appPropsBuilder';

function App() {
  const { credits, updateCredits, setCredits, resetCredits } = useGameState_Credits();
  const { gamePhase, setGamePhase, advanceGamePhase, resetGamePhase } = useGameState_Phases();
  const {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    closeWindow,
    closeWindowsByAppType,
    bringToFront,
  } = useWindowManager();
  const {
    apps,
    appOrder,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    resetToDefaults,
    installApp,
    uninstallApp,
    calculateMonthlyCosts
  } = useGameState_AppList();

  // Monthly cost deduction handler
  const handleMonthlyCostDeduction = React.useCallback(() => {
    const monthlyCost = calculateMonthlyCosts();
    if (monthlyCost > 0) {
      updateCredits(-monthlyCost);
      console.log(`Monthly app costs deducted: ${monthlyCost} credits`);
    }
  }, [calculateMonthlyCosts, updateCredits]);

  const { gameTime, setGameTime, isPaused, pauseTime, resumeTime, resetGameTime } = useGameState_Time(handleMonthlyCostDeduction);

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



  // Custom collision detection to allow dropping on both sortable list and purge zone
  const customCollisionDetection = (args: any) => {
    const collisions = rectIntersection(args);
    const purgeZone = collisions.find(c => c.id === 'purge-zone-window');
    if (purgeZone) return [purgeZone];
    return collisions;
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
    
    // STANDARD DRAG SYSTEM: Delegate to app list handler for reordering
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

  const resetGame = () => {
    resetCredits();
    resetGamePhase();
    resetGameTime();
    resetToDefaults();
  };

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
        <TerminalScreen 
          credits={credits}
          gameTime={gameTime}
          gamePhase={gamePhase}
          isOnline={!isPaused}
          onAppClick={openOrCloseWindow}
          apps={apps}
          appOrder={appOrder}
          dragState={dragState}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragEnd={handleUnifiedDragEnd}
          installApp={installApp}
          uninstallApp={uninstallApp}
          pendingDeleteAppId={pendingDelete.appId}
          openAppTypes={new Set(windows.map(w => w.appType))}
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
          appName={pendingDelete.appId ? (apps.find((a: any) => a.id === pendingDelete.appId)?.title || pendingDelete.appId) : ''}
          onConfirm={handleConfirmPurge}
          onCancel={handleCancelPurge}
        />

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
  );
}

export default App;
