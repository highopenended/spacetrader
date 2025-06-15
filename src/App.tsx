import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import { useGameState_Credits } from './hooks/useGameState_Credits';
import { useGameState_Phases } from './hooks/useGameState_Phases';
import { useGameState_Time } from './hooks/useGameState_Time';

function App() {
  const { credits, updateCredits, setCredits } = useGameState_Credits();
  const { gamePhase, setGamePhase, advanceGamePhase } = useGameState_Phases();
  const { gameTime, setGameTime, isPaused, pauseTime, resumeTime } = useGameState_Time();

  return (
    <div className="App">
      <TerminalScreen 
        credits={credits}
        gameTime={gameTime}
        gamePhase={gamePhase}
        isOnline={!isPaused}
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
      />
    </div>
  );
}

export default App;
