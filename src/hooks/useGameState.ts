import { useState } from 'react';
import { GameState, GamePhase } from '../types/gamePhases';

const initialGameState: GameState = {
  gamePhase: 'lineRat',
  credits: 0
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateCredits = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + amount
    }));
  };

  const setCredits = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      credits: amount
    }));
  };

  const setGamePhase = (phase: GamePhase) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: phase
    }));
  };

  const advanceGamePhase = () => {
    const phases: GamePhase[] = [
      'lineRat', 'bayBoss', 'scrapCaptain', 'fleetBoss', 'subsectorWarden',
      'sectorCommodore', 'ledgerPatrician', 'cathedraMinor', 'cathedraDominus', 'cathedraUltima'
    ];
    
    const currentIndex = phases.indexOf(gameState.gamePhase);
    if (currentIndex < phases.length - 1) {
      setGamePhase(phases[currentIndex + 1]);
    }
  };

  return {
    gameState,
    updateCredits,
    setCredits,
    setGamePhase,
    advanceGamePhase
  };
}; 