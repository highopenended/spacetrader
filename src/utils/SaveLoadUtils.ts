/**
 * Save/Load Utility Functions
 * 
 * Pure utility functions for save and load operations.
 * Handles localStorage and file export/import functionality.
 * Stateless helper functions for game data persistence.
 */

import { GameState } from '../types/gameState';

interface SaveData {
  gameState: GameState;
  timestamp: number;
  saveDate: string;
}

const SAVE_KEY = 'spacetrader-save';

/**
 * Save game state to browser's localStorage
 * @param gameState - Current game state to save
 * @returns boolean indicating success/failure
 */
export const saveGameToLocalStorage = (gameState: GameState): boolean => {
  try {
    const saveData: SaveData = {
      gameState,
      timestamp: Date.now(),
      saveDate: new Date().toISOString()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game to localStorage:', error);
    return false;
  }
};

/**
 * Load game state from browser's localStorage
 * @returns GameState object or null if no save exists
 */
export const loadGameFromLocalStorage = (): GameState | null => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const parsedData: SaveData = JSON.parse(savedData);
    return parsedData.gameState;
  } catch (error) {
    console.error('Failed to load game from localStorage:', error);
    return null;
  }
};

/**
 * Export game state to a .scrap file
 * @param gameState - Current game state to export
 * @returns boolean indicating success/failure
 */
export const exportGameToFile = (gameState: GameState): boolean => {
  try {
    const saveData: SaveData = {
      gameState,
      timestamp: Date.now(),
      saveDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `spacetrader-save-${Date.now()}.scrap`;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
    return true;
  } catch (error) {
    console.error('Failed to export game to file:', error);
    return false;
  }
};

/**
 * Import game state from a .scrap file
 * @param file - File object to import from
 * @returns Promise<GameState | null> - Parsed game state or null on error
 */
export const importGameFromFile = async (file: File): Promise<GameState | null> => {
  try {
    const text = await file.text();
    const parsedData: SaveData = JSON.parse(text);
    
    // Shallow validation check for required game state properties
    if (!parsedData.gameState || 
        typeof parsedData.gameState.credits !== 'number' ||
        typeof parsedData.gameState.gamePhase !== 'string' ||
        !parsedData.gameState.currentTime ||
        typeof parsedData.gameState.currentTime.age !== 'number') {
      console.error('Invalid game file format');
      return null;
    }
    
    return parsedData.gameState;
  } catch (error) {
    console.error('Failed to import game from file:', error);
    return null;
  }
}; 