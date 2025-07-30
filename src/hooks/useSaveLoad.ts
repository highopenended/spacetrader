/**
 * Save/Load Hook
 * 
 * Manages save and load operations with credit costs.
 * Integrates with game state for save/load functionality.
 * Handles credit deductions for save/load operations.
 */

import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { 
  saveGameToLocalStorage, 
  loadGameFromLocalStorage, 
  exportGameToFile, 
  importGameFromFile 
} from '../utils/SaveLoadUtils';
import { GameState } from '../types/gameState';

export const useSaveLoad = () => {
  const { 
    updateCredits, 
    credits,
    gamePhase,
    gameTime,
    isPaused,
    installedApps,
    gameMode,
    gameBackground,
    setCredits,
    setGamePhase,
    setGameTime,
    pauseTime,
    resumeTime,
    installApp,
    uninstallApp,
    reorderApps,
    getAvailableApps,
    resetToDefaults,
    resetGame,
    beginWorkSession,
    setGameBackground
  } = useGameState();

  // Credit costs for save operations only
  const SAVE_COST = 50;

  // Save to local cache
  const saveToLocalCache = useCallback(() => {
    if (credits < SAVE_COST) {
      console.error('Insufficient credits for save operation');
      return false;
    }

    const gameState: GameState = {
      gamePhase,
      credits,
      currentTime: gameTime,
      isPaused,
      lastUpdate: Date.now(),
      playerState: {
        isProtectedFromSharp: false,
        isProtectedFromRadiation: false,
        isProtectedFromCorrosive: false,
        isProtectedFromExplosive: false,
        isProtectedFromQuantum: false
      },
      scrapObjects: []
    };

    const success = saveGameToLocalStorage(gameState);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game saved to local cache. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, gamePhase, gameTime, isPaused, updateCredits]);

  // Load from local cache
  const loadFromLocalCache = useCallback(() => {
    const loadedGameState = loadGameFromLocalStorage();
    if (!loadedGameState) {
      console.error('No save file found in local cache');
      return false;
    }

    // Apply loaded game state
    setCredits(loadedGameState.credits);
    setGamePhase(loadedGameState.gamePhase);
    setGameTime(loadedGameState.currentTime);
    
    if (loadedGameState.isPaused) {
      pauseTime();
    } else {
      resumeTime();
    }

    console.log('Game loaded from local cache');
    return true;
  }, [setCredits, setGamePhase, setGameTime, pauseTime, resumeTime]);

  // Export to file
  const exportToFile = useCallback(() => {
    if (credits < SAVE_COST) {
      console.error('Insufficient credits for export operation');
      return false;
    }

    const gameState: GameState = {
      gamePhase,
      credits,
      currentTime: gameTime,
      isPaused,
      lastUpdate: Date.now(),
      playerState: {
        isProtectedFromSharp: false,
        isProtectedFromRadiation: false,
        isProtectedFromCorrosive: false,
        isProtectedFromExplosive: false,
        isProtectedFromQuantum: false
      },
      scrapObjects: []
    };

    const success = exportGameToFile(gameState);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game exported to file. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, gamePhase, gameTime, isPaused, updateCredits]);

  // Import from file
  const importFromFile = useCallback(async (file: File) => {
    const loadedGameState = await importGameFromFile(file);
    if (!loadedGameState) {
      console.error('Failed to import game from file');
      return false;
    }

    // Apply loaded game state
    setCredits(loadedGameState.credits);
    setGamePhase(loadedGameState.gamePhase);
    setGameTime(loadedGameState.currentTime);
    
    if (loadedGameState.isPaused) {
      pauseTime();
    } else {
      resumeTime();
    }

    console.log('Game imported from file');
    return true;
  }, [setCredits, setGamePhase, setGameTime, pauseTime, resumeTime]);

  return {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  };
}; 