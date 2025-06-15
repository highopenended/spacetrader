import React from 'react';
import CreditsTracker from './components/creditsTracker/CreditsTracker';
import GameTimeTracker from './components/gameTimeTracker/GameTimeTracker';
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
      <CreditsTracker credits={credits} />
      <GameTimeTracker gameTime={gameTime} gamePhase={gamePhase} />
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
