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

  // Clean dnd-kit: track current droppable id
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);



  // Custom collision detection to allow dropping on both sortable list and purge zone
  const customCollisionDetection = (args: any) => {
    const collisions = rectIntersection(args);
    const purgeZone = collisions.find(c => c.id === 'purge-zone-window');
    if (purgeZone) return [purgeZone];
    return collisions;
  };

  const handleDragEndWithConfirm = React.useCallback((event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (over.id === 'purge-zone-window') {
      const appDefinition = apps.find((app: any) => app.id === active.id);
      if (appDefinition && appDefinition.deletable) {
        setPendingDelete({ appId: active.id, prevOrder: appOrder });
        return;
      }
    }
    handleDragEnd(event);
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
      // Do not render here; handled in TerminalScreen
      return null;
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
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
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
          onClose={() => closeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.appType, position)}
          onSizeChange={(size) => updateWindowSize(window.appType, size)}
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
        onClose={() => closeWindow(window.id)}
        onPositionChange={(position) => updateWindowPosition(window.appType, position)}
        onSizeChange={(size) => updateWindowSize(window.appType, size)}
      >
        {window.content}
      </ScrAppWindow>
    );
  };

  // Find the purgeZone window data (if open)
  const purgeZoneWindow = windows.find(w => w.appType === 'purgeZone');

  return (
    <DndContext
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={event => setOverId(event.over?.id ?? null)}
      onDragEnd={handleDragEndWithConfirm}
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
          handleDragEnd={handleDragEndWithConfirm}
          installApp={installApp}
          uninstallApp={uninstallApp}
          pendingDeleteAppId={pendingDelete.appId}
          openAppTypes={new Set(windows.map(w => w.appType))}
          purgeZoneWindowProps={purgeZoneWindow}
          overId={overId}
          onCloseWindow={closeWindow}
          onUpdateWindowPosition={updateWindowPosition}
          onUpdateWindowSize={updateWindowSize}
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
        {windows.filter(w => w.appType !== 'purgeZone').map(renderWindow)}
        <PurgeConfirmPopup
          open={!!pendingDelete.appId}
          appName={pendingDelete.appId ? (apps.find((a: any) => a.id === pendingDelete.appId)?.title || pendingDelete.appId) : ''}
          onConfirm={handleConfirmPurge}
          onCancel={handleCancelPurge}
        />

        <DragOverlay 
          zIndex={2000}
          dropAnimation={{ duration: 0, easing: 'ease' }}
        >
          {dragState.isDragging && dragState.draggedAppId ? (
            <div 
              className={`sortable-item dragging`}
              style={{ opacity: 0.8, position: 'relative' }}
            >
              {/* Render the dragged app in overlay */}
              {(() => {
                const appConfig = apps.find(app => app.id === dragState.draggedAppId);
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

                return <AppComponent {...getAppProps()} />;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
