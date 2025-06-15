import { useState } from 'react';
import { GamePhase } from '../types/gameState';
import { getNextGamePhase } from '../utils/gameStateUtils';

export const useGameState_Phases = () => {
  const [gamePhase, setGamePhaseState] = useState<GamePhase>('lineRat');

  const setGamePhase = (phase: GamePhase) => {
    setGamePhaseState(phase);
  };

  const advanceGamePhase = () => {
    const nextPhase = getNextGamePhase(gamePhase);
    if (nextPhase) {
      setGamePhase(nextPhase);
    }
  };

  return {
    gamePhase,
    setGamePhase,
    advanceGamePhase
  };
}; 