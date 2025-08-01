/**
 * Save/Load Hook
 * 
 * Manages save and load operations with credit costs.
 * Orchestrates all state encoding/decoding from a single location.
 * Handles credit deductions for save/load operations.
 * 
 * SINGLE INSTANCE PATTERN: This hook receives all encode/decode functions
 * from App.tsx to ensure it works with the same state instances as the UI.
 */

import { useCallback } from 'react';
import { 
  saveGameToLocalStorage, 
  loadGameFromLocalStorage, 
  exportGameToFile, 
  importGameFromFile 
} from '../utils/SaveLoadUtils';

export const useSaveLoad = (
  credits: number, 
  updateCredits: (amount: number) => void,
  encodeGameState: () => any,
  decodeGameState: (state: any) => boolean,
  encodeWindowState: () => any,
  decodeWindowState: (state: any) => boolean
) => {
  // Credit costs for save operations only
  const SAVE_COST = 50;

  // Save to local cache
  const saveToLocalCache = useCallback(() => {
    if (credits < SAVE_COST) {
      console.error('Insufficient credits for save operation');
      return false;
    }

    const saveData = {
      gameState: encodeGameState(),
      windowState: encodeWindowState()
    };

    const success = saveGameToLocalStorage(saveData);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game saved to local cache. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, encodeGameState, encodeWindowState, updateCredits]);

  // Load from local cache
  const loadFromLocalCache = useCallback(() => {
    const loadedData = loadGameFromLocalStorage();
    if (!loadedData) {
      console.error('No save file found in local cache');
      return false;
    }

    // Decode game state
    const gameSuccess = decodeGameState(loadedData.gameState);
    if (!gameSuccess) {
      console.error('Failed to decode game state');
      return false;
    }

    // Decode window state (optional - window state might not exist in old saves)
    if (loadedData.windowState) {
      const windowSuccess = decodeWindowState(loadedData.windowState);
      if (!windowSuccess) {
        console.warn('Failed to decode window state, using defaults');
      }
    }

    console.log('Game loaded from local cache');
    return true;
  }, [decodeGameState, decodeWindowState]);

  // Export to file
  const exportToFile = useCallback(() => {
    if (credits < SAVE_COST) {
      console.error('Insufficient credits for export operation');
      return false;
    }

    const saveData = {
      gameState: encodeGameState(),
      windowState: encodeWindowState()
    };

    const success = exportGameToFile(saveData);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game exported to file. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, encodeGameState, encodeWindowState, updateCredits]);

  // Import from file
  const importFromFile = useCallback(async (file: File) => {
    const loadedData = await importGameFromFile(file);
    if (!loadedData) {
      console.error('Failed to import game from file');
      return false;
    }

    // Decode game state
    const gameSuccess = decodeGameState(loadedData.gameState);
    if (!gameSuccess) {
      console.error('Failed to decode game state from file');
      return false;
    }

    // Decode window state (optional - window state might not exist in old saves)
    if (loadedData.windowState) {
      const windowSuccess = decodeWindowState(loadedData.windowState);
      if (!windowSuccess) {
        console.warn('Failed to decode window state from file, using defaults');
      }
    }

    console.log('Game imported from file');
    return true;
  }, [decodeGameState, decodeWindowState]);

  return {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  };
}; 