/**
 * Save/Load Utility Functions
 * 
 * Pure utility functions for save and load operations.
 * Handles localStorage and file export/import functionality.
 * Stateless helper functions for game data persistence.
 */

interface SaveData {
  gameState: any; // Encoded game state from useGameState
  windowState: any; // Encoded window state from useWindowManager
  toggleState: any; // Encoded toggle state from useToggleState
  timestamp: number;
  saveDate: string;
}

const SAVE_KEY = 'spacetrader-save';

/**
 * Save game state to browser's localStorage
 * @param saveData - Complete save data including game and window state
 * @returns boolean indicating success/failure
 */
export const saveGameToLocalStorage = (saveData: any): boolean => {
  try {
    const fullSaveData: SaveData = {
      gameState: saveData.gameState,
      windowState: saveData.windowState,
      toggleState: saveData.toggleState,
      timestamp: Date.now(),
      saveDate: new Date().toISOString()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(fullSaveData));
    return true;
  } catch (error) {
    console.error('Failed to save game to localStorage:', error);
    return false;
  }
};

/**
 * Load game state from browser's localStorage
 * @returns SaveData object or null if no save exists
 */
export const loadGameFromLocalStorage = (): any | null => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const parsedData: SaveData = JSON.parse(savedData);
    return parsedData;
  } catch (error) {
    console.error('Failed to load game from localStorage:', error);
    return null;
  }
};

/**
 * Export game state to a .scrap file
 * @param saveData - Complete save data including game and window state
 * @returns boolean indicating success/failure
 */
export const exportGameToFile = (saveData: any): boolean => {
  try {
    const fullSaveData: SaveData = {
      gameState: saveData.gameState,
      windowState: saveData.windowState,
      toggleState: saveData.toggleState,
      timestamp: Date.now(),
      saveDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(fullSaveData, null, 2);
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
 * @returns Promise<SaveData | null> - Parsed save data or null on error
 */
export const importGameFromFile = async (file: File): Promise<any | null> => {
  try {
    const text = await file.text();
    const parsedData: SaveData = JSON.parse(text);
    
    // Basic validation check for required game state properties
    if (!parsedData.gameState || 
        typeof parsedData.gameState.credits !== 'number' ||
        typeof parsedData.gameState.gamePhase !== 'string' ||
        !parsedData.gameState.gameTime ||
        typeof parsedData.gameState.gameTime.age !== 'number') {
      console.error('Invalid game file format');
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Failed to import game from file:', error);
    return null;
  }
}; 