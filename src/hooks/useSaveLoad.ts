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
  decodeWindowState: (state: any) => boolean,
  encodeToggleState: () => any,
  decodeToggleState: (state: any) => boolean,
  encodeProfileState: () => any,
  decodeProfileState: (state: any) => boolean,
  encodeQuickBarState: () => any,
  decodeQuickBarState: (state: any) => boolean
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
      windowState: encodeWindowState(),
      toggleState: encodeToggleState(),
      profileState: encodeProfileState(),
      quickBarState: encodeQuickBarState()
    };

    const success = saveGameToLocalStorage(saveData);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game saved to local cache. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, encodeGameState, encodeWindowState, encodeToggleState, encodeProfileState, encodeQuickBarState, updateCredits]);

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

    // Decode window state
    const windowSuccess = decodeWindowState(loadedData.windowState);
    if (!windowSuccess) {
      console.error('Failed to decode window state');
      return false;
    }

    // Decode toggle state
    const toggleSuccess = decodeToggleState(loadedData.toggleState);
    if (!toggleSuccess) {
      console.error('Failed to decode toggle state');
      return false;
    }

    // Decode profile state
    const profileSuccess = decodeProfileState(loadedData.profileState);
    if (!profileSuccess) {
      console.error('Failed to decode profile state');
      return false;
    }

    // Decode quick bar state
    const quickBarSuccess = decodeQuickBarState(loadedData.quickBarState);
    if (!quickBarSuccess) {
      console.error('Failed to decode quick bar state');
      return false;
    }

    console.log('Game loaded from local cache');
    return true;
  }, [decodeGameState, decodeWindowState, decodeToggleState, decodeProfileState, decodeQuickBarState]);

  // Export to file
  const exportToFile = useCallback(() => {
    if (credits < SAVE_COST) {
      console.error('Insufficient credits for export operation');
      return false;
    }

    const saveData = {
      gameState: encodeGameState(),
      windowState: encodeWindowState(),
      toggleState: encodeToggleState(),
      profileState: encodeProfileState(),
      quickBarState: encodeQuickBarState()
    };

    const success = exportGameToFile(saveData);
    if (success) {
      updateCredits(-SAVE_COST);
      console.log(`Game exported to file. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, [credits, encodeGameState, encodeWindowState, encodeToggleState, encodeProfileState, encodeQuickBarState, updateCredits]);

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

    // Decode window state
    const windowSuccess = decodeWindowState(loadedData.windowState);
    if (!windowSuccess) {
      console.error('Failed to decode window state from file');
      return false;
    }

    // Decode toggle state
    const toggleSuccess = decodeToggleState(loadedData.toggleState);
    if (!toggleSuccess) {
      console.error('Failed to decode toggle state from file');
      return false;
    }

    // Decode profile state
    const profileSuccess = decodeProfileState(loadedData.profileState);
    if (!profileSuccess) {
      console.error('Failed to decode profile state from file');
      return false;
    }

    // Decode quick bar state
    const quickBarSuccess = decodeQuickBarState(loadedData.quickBarState);
    if (!quickBarSuccess) {
      console.error('Failed to decode quick bar state from file');
      return false;
    }

    console.log('Game imported from file');
    return true;
  }, [decodeGameState, decodeWindowState, decodeToggleState, decodeProfileState, decodeQuickBarState]);

  return {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  };
}; 