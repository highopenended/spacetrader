import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import WorkScreen from './components/workMode/workScreen/WorkScreen';
import GameBackground from './components/gameBackgrounds/GameBackground';
import { useGameState } from './hooks/useGameState';
import { useWindowManager } from './hooks/useWindowManager';
import { useDragHandler_Apps } from './hooks/useDragHandler_Apps';
import { useCustomCollisionDetection } from './hooks/useCustomCollisionDetection';
import { usePurgeZoneDrag } from './hooks/usePurgeZoneDrag';
import { WindowData } from './types/gameState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';
import { renderWindow } from './constants/windowRegistry';

import { DndContext, DragOverlay, useSensor, PointerSensor } from '@dnd-kit/core';
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
    gameBackground,
    
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
    installAppOrder,
    getAvailableApps,
    resetToDefaults,
    resetGame,
    beginWorkSession,
    setGameBackground
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

  // Use purge zone drag hook
  const {
    purgeNodeDragState,
    pendingDelete,
    overId,
    handleUnifiedDragStart,
    handleUnifiedDragEnd,
    handleConfirmPurge,
    handleCancelPurge,
    setOverId
  } = usePurgeZoneDrag();



  // Use custom collision detection hook
  const { customCollisionDetection } = useCustomCollisionDetection();




  // resetGame is now provided by useGameState hook

  const renderWindowComponent = (window: WindowData) => {
    const gameState = {
      credits,
      gameTime,
      gamePhase,
      overId,
      purgeNodeDragState,
      updateCredits,
      getAvailableApps,
      installedApps,
      installApp
    };
    
    const windowManager = {
      closeWindow,
      updateWindowPosition,
      updateWindowSize,
      bringToFront
    };
    
    return renderWindow(window, gameState, windowManager);
  };

  return (
    <ToggleProvider 
      installedApps={installedApps}
      gameMode={gameMode}
      onBeginWorkSession={beginWorkSession}
      credits={credits}
      gameTime={gameTime}
      gamePhase={gamePhase}
    >
      <DndContext
        collisionDetection={customCollisionDetection}
        onDragStart={(event) => handleUnifiedDragStart(event, handleDragStart)}
        onDragOver={event => setOverId(event.over?.id ?? null)}
        onDragEnd={(event) => handleUnifiedDragEnd(event, apps, appOrder, handleDragEnd, closeWindowsByAppType, uninstallApp)}
        sensors={[
          useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
          }),
        ]}
      >
                <div className="App">
          <GameBackground backgroundId={gameBackground} />
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
          setGameBackground={setGameBackground}
        />
        {windows.map(renderWindowComponent)}
        <PurgeConfirmPopup
          open={!!pendingDelete.appId}
          appName={pendingDelete.appId ? (apps.find((a: any) => a.id === pendingDelete.appId)?.name || pendingDelete.appId) : ''}
          onConfirm={() => handleConfirmPurge(closeWindowsByAppType, uninstallApp)}
          onCancel={() => handleCancelPurge(installAppOrder)}
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
