import { useState } from 'react';
import { GamePhase } from '../types/gameState';
import { getNextGamePhase } from '../utils/gameStateUtils';
import { INITIAL_GAME_PHASE } from '../constants/gameConstants';

export const useGameState_Phases = () => {
  const [gamePhase, setGamePhaseState] = useState<GamePhase>(INITIAL_GAME_PHASE);

  const setGamePhase = (phase: GamePhase) => {
    setGamePhaseState(phase);
  };

  const advanceGamePhase = () => {
    const nextPhase = getNextGamePhase(gamePhase);
    if (nextPhase) {
      setGamePhase(nextPhase);
    }
  };

  const resetGamePhase = () => {
    setGamePhaseState(INITIAL_GAME_PHASE);
  };

  return {
    gamePhase,
    setGamePhase,
    advanceGamePhase,
    resetGamePhase
  };
}; 