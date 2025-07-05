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

  const resetGame = () => {
    resetCredits();
    resetGamePhase();
    resetGameTime();
    resetToDefaults();
  };

  const renderWindow = (window: WindowData) => {
    // Determine if this window should show the purge effect
    const isOverDeleteZone = dragState.isOverDeleteZone && dragState.draggedAppId === window.appType;
    // Use custom windows for specific app types
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

    // Default window for other app types
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
        handleDragEnd={handleDragEnd}
        installApp={installApp}
        uninstallApp={uninstallApp}
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
      
      {/* Render windows */}
      {windows.map(renderWindow)}
    </div>
  );
}

export default App;
