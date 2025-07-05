import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import ScrAppWindow from './components/scr-apps/ScrApp-Window';
import AgeAppWindow from './components/scr-apps/ageApp/AgeApp-Window';
import JobTitleAppWindow from './components/scr-apps/jobTitleApp/JobTitleApp-Window';
import { useGameState_Credits } from './hooks/useGameState_Credits';
import { useGameState_Phases } from './hooks/useGameState_Phases';
import { useGameState_Time } from './hooks/useGameState_Time';
import { useWindowManager } from './hooks/useWindowManager';
import { useScrAppListManager } from './hooks/useScrAppListManager';
import { WindowData } from './types/gameState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';

function App() {
  const { credits, updateCredits, setCredits, resetCredits } = useGameState_Credits();
  const { gamePhase, setGamePhase, advanceGamePhase, resetGamePhase } = useGameState_Phases();
  const { gameTime, setGameTime, isPaused, pauseTime, resumeTime, resetGameTime } = useGameState_Time();
  
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
    uninstallApp
  } = useScrAppListManager();

  const [pendingDelete, setPendingDelete] = React.useState<{
    appId: string | null;
    prevOrder: string[];
  }>({ appId: null, prevOrder: [] });

  const handleDragEndWithConfirm = React.useCallback((event: any) => {
    const { active, over } = event;
    dragState.isDragging = false;
    dragState.draggedAppId = null;
    dragState.isOverDeleteZone = false;
    if (!over) return;
    if (over.id === 'delete-zone') {
      const appDefinition = apps.find(app => app.id === active.id);
      if (appDefinition && appDefinition.deletable) {
        setPendingDelete({ appId: active.id, prevOrder: appOrder });
        return;
      }
    }
    handleDragEnd(event);
  }, [apps, appOrder, handleDragEnd, dragState]);

  const handleConfirmPurge = React.useCallback(() => {
    if (pendingDelete.appId) {
      closeWindowsByAppType(pendingDelete.appId);
      uninstallApp(pendingDelete.appId);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
  }, [pendingDelete, uninstallApp, closeWindowsByAppType]);

  const handleCancelPurge = React.useCallback(() => {
    if (pendingDelete.prevOrder.length) {
      installAppOrder(pendingDelete.prevOrder);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
  }, [pendingDelete]);

  const installAppOrder = (order: string[]) => {
    if (order.join(',') !== appOrder.join(',')) {
      const newInstalled = order.map((id, idx) => {
        const found = apps.find(app => app.id === id);
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
        newInstalled.forEach((app, idx) => {
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
    const isOverDeleteZone = (pendingDelete.appId === window.appType) || (dragState.isOverDeleteZone && dragState.draggedAppId === window.appType);
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
          isOverDeleteZone={isOverDeleteZone}
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
          isOverDeleteZone={isOverDeleteZone}
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
        isOverDeleteZone={isOverDeleteZone}
      >
        {window.content}
      </ScrAppWindow>
    );
  };

  return (
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
        appName={pendingDelete.appId ? (apps.find(a => a.id === pendingDelete.appId)?.title || pendingDelete.appId) : ''}
        onConfirm={handleConfirmPurge}
        onCancel={handleCancelPurge}
      />
    </div>
  );
}

export default App;
