import React, { useState } from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import ScrAppWindow from './components/scr-apps/ScrApp-Window';
import AgeAppWindow from './components/scr-apps/ageApp/AgeApp-Window';
import { useGameState_Credits } from './hooks/useGameState_Credits';
import { useGameState_Phases } from './hooks/useGameState_Phases';
import { useGameState_Time } from './hooks/useGameState_Time';

interface WindowData {
  id: string;
  appType: string;
  title: string;
  content: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

function App() {
  const { credits, updateCredits, setCredits, resetCredits } = useGameState_Credits();
  const { gamePhase, setGamePhase, advanceGamePhase, resetGamePhase } = useGameState_Phases();
  const { gameTime, setGameTime, isPaused, pauseTime, resumeTime, resetGameTime } = useGameState_Time();
  
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [lastWindowPositions, setLastWindowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [lastWindowSizes, setLastWindowSizes] = useState<Record<string, { width: number; height: number }>>({});

  const updateWindowPosition = (appType: string, position: { x: number; y: number }) => {
    setLastWindowPositions(prev => ({
      ...prev,
      [appType]: position
    }));
  };

  const updateWindowSize = (appType: string, size: { width: number; height: number }) => {
    setLastWindowSizes(prev => ({
      ...prev,
      [appType]: size
    }));
  };

  const openOrCloseWindow = (appType: string, title: string, content: React.ReactNode = <div>No Data Available</div>) => {
    // Check if a window for this app type already exists
    const existingWindowIndex = windows.findIndex(window => window.appType === appType);
    
    if (existingWindowIndex !== -1) {
      // Window exists, close it
      setWindows(prev => prev.filter(window => window.appType !== appType));
    } else {
      // Window doesn't exist, open it
      // Use last known position or default with offset
      const lastPosition = lastWindowPositions[appType];
      const defaultPosition = { x: 100 + (windows.length * 30), y: 100 + (windows.length * 30) };
      
      // Use last known size or default
      const lastSize = lastWindowSizes[appType];
      const defaultSize = { width: 250, height: 120 };
      
      const newWindow: WindowData = {
        id: `window-${appType}-${Date.now()}`,
        appType,
        title,
        content,
        position: lastPosition || defaultPosition,
        size: lastSize || defaultSize
      };
      setWindows(prev => [...prev, newWindow]);
    }
  };

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(window => window.id !== windowId));
  };

  const resetGame = () => {
    resetCredits();
    resetGamePhase();
    resetGameTime();
  };

  const renderWindow = (window: WindowData) => {
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
