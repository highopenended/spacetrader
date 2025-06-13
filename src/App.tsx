import React from 'react';
import CreditsTracker from './components/creditsTracker/CreditsTracker';
import GameTimeTracker from './components/gameTimeTracker/GameTimeTracker';
import { useGameState } from './hooks/useGameState';
import { useGameTime } from './hooks/useGameTime';

function App() {
  const { gameState } = useGameState();
  const { gameTime } = useGameTime();

  return (
    <div className="App">
      <CreditsTracker credits={gameState.credits} />
      <GameTimeTracker gameTime={gameTime} />
    </div>
  );
}

export default App;
