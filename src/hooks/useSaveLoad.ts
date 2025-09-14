/**
 * Save/Load Hook
 * 
 * Manages save and load operations with credit costs.
 * Orchestrates all state encoding/decoding from Zustand stores.
 * Handles credit deductions for save/load operations.
 * 
 * ZUSTAND INTEGRATION: Directly accesses store methods instead of receiving
 * encode/decode functions as parameters. This eliminates prop drilling and
 * ensures consistency with the store architecture.
 */

import { useCallback } from 'react';
import { 
  saveGameToLocalStorage, 
  loadGameFromLocalStorage, 
  exportGameToFile, 
  importGameFromFile 
} from '../utils/SaveLoadUtils';
import { 
  useGameStore, 
  useWindowStore, 
  useToggleStore, 
  useProfileStore, 
  useQuickBarStore, 
  useEndingsStore, 
  useUpgradesStore 
} from '../stores';

export const useSaveLoad = () => {
  // Credit costs for save operations only
  const SAVE_COST = 50;

  // Save to local cache
  const saveToLocalCache = useCallback(() => {
    const gameStore = useGameStore.getState();
    if (gameStore.credits < SAVE_COST) {
      console.error('Insufficient credits for save operation');
      return false;
    }

    const saveData = {
      gameState: gameStore.encodeGameState(),
      windowState: useWindowStore.getState().encodeWindowState(),
      toggleState: useToggleStore.getState().encodeToggleState(),
      profileState: useProfileStore.getState().encodeProfileState(),
      quickBarState: useQuickBarStore.getState().encodeQuickBarState(),
      endingsState: useEndingsStore.getState().encodeEndingsState(),
      upgradesState: useUpgradesStore.getState().encodeUpgradesState()
    };

    const success = saveGameToLocalStorage(saveData);
    if (success) {
      gameStore.updateCredits(-SAVE_COST);
      console.log(`Game saved to local cache. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, []);

  // Load from local cache
  const loadFromLocalCache = useCallback(() => {
    const loadedData = loadGameFromLocalStorage();
    if (!loadedData) {
      console.error('No save file found in local cache');
      return false;
    }

    // Decode all store states
    const gameSuccess = useGameStore.getState().decodeGameState(loadedData.gameState);
    if (!gameSuccess) {
      console.error('Failed to decode game state');
      return false;
    }

    const windowSuccess = useWindowStore.getState().decodeWindowState(loadedData.windowState);
    if (!windowSuccess) {
      console.error('Failed to decode window state');
      return false;
    }

    const toggleSuccess = useToggleStore.getState().decodeToggleState(loadedData.toggleState);
    if (!toggleSuccess) {
      console.error('Failed to decode toggle state');
      return false;
    }

    const profileSuccess = useProfileStore.getState().decodeProfileState(loadedData.profileState);
    if (!profileSuccess) {
      console.error('Failed to decode profile state');
      return false;
    }

    const quickBarSuccess = useQuickBarStore.getState().decodeQuickBarState(loadedData.quickBarState);
    if (!quickBarSuccess) {
      console.error('Failed to decode quick bar state');
      return false;
    }

    const endingsSuccess = useEndingsStore.getState().decodeEndingsState(loadedData.endingsState);
    if (!endingsSuccess) {
      console.error('Failed to decode endings state');
      return false;
    }

    const upgradesSuccess = useUpgradesStore.getState().decodeUpgradesState(loadedData.upgradesState);
    if (!upgradesSuccess) {
      console.error('Failed to decode upgrades state');
      return false;
    }

    console.log('Game loaded from local cache');
    return true;
  }, []);

  // Export to file
  const exportToFile = useCallback(() => {
    const gameStore = useGameStore.getState();
    if (gameStore.credits < SAVE_COST) {
      console.error('Insufficient credits for export operation');
      return false;
    }

    const saveData = {
      gameState: gameStore.encodeGameState(),
      windowState: useWindowStore.getState().encodeWindowState(),
      toggleState: useToggleStore.getState().encodeToggleState(),
      profileState: useProfileStore.getState().encodeProfileState(),
      quickBarState: useQuickBarStore.getState().encodeQuickBarState(),
      endingsState: useEndingsStore.getState().encodeEndingsState(),
      upgradesState: useUpgradesStore.getState().encodeUpgradesState()
    };

    const success = exportGameToFile(saveData);
    if (success) {
      gameStore.updateCredits(-SAVE_COST);
      console.log(`Game exported to file. Cost: ${SAVE_COST} credits`);
    }
    return success;
  }, []);

  // Import from file
  const importFromFile = useCallback(async (file: File) => {
    const loadedData = await importGameFromFile(file);
    if (!loadedData) {
      console.error('Failed to import game from file');
      return false;
    }

    // Decode all store states
    const gameSuccess = useGameStore.getState().decodeGameState(loadedData.gameState);
    if (!gameSuccess) {
      console.error('Failed to decode game state from file');
      return false;
    }

    const windowSuccess = useWindowStore.getState().decodeWindowState(loadedData.windowState);
    if (!windowSuccess) {
      console.error('Failed to decode window state from file');
      return false;
    }

    const toggleSuccess = useToggleStore.getState().decodeToggleState(loadedData.toggleState);
    if (!toggleSuccess) {
      console.error('Failed to decode toggle state from file');
      return false;
    }

    const profileSuccess = useProfileStore.getState().decodeProfileState(loadedData.profileState);
    if (!profileSuccess) {
      console.error('Failed to decode profile state from file');
      return false;
    }

    const quickBarSuccess = useQuickBarStore.getState().decodeQuickBarState(loadedData.quickBarState);
    if (!quickBarSuccess) {
      console.error('Failed to decode quick bar state from file');
      return false;
    }

    const endingsSuccess = useEndingsStore.getState().decodeEndingsState(loadedData.endingsState);
    if (!endingsSuccess) {
      console.error('Failed to decode endings state from file');
      return false;
    }

    const upgradesSuccess = useUpgradesStore.getState().decodeUpgradesState(loadedData.upgradesState);
    if (!upgradesSuccess) {
      console.error('Failed to decode upgrades state from file');
      return false;
    }

    console.log('Game imported from file');
    return true;
  }, []);

  return {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  };
}; 