/**
 * Reset Game Utility Functions
 * 
 * Centralized reset functionality that coordinates all state resets.
 * Now fully integrated with Zustand stores - calls reset methods directly
 * from each store instead of requiring parameters.
 * 
 * Purpose:
 * - Provide a single entry point for complete game reset
 * - Coordinate reset across all Zustand stores
 * - Ensure consistent reset behavior across the application
 * 
 * Used by:
 * - AdminToolbar for the Reset Game button
 * - Any other component that needs to reset the game
 */

/**
 * Reset the entire game to initial state
 * Calls reset methods directly from all Zustand stores
 * @returns boolean indicating success/failure
 */
export const resetGame = (): boolean => {
  try {
    // Reset all state in the correct order - all from Zustand stores directly
    const { useGameStore, useWindowStore, useToggleStore, useUpgradesStore } = require('../stores');
    
    // Reset game state
    useGameStore.getState().resetGameState();
    
    // Reset window state
    useWindowStore.getState().resetWindowState();
    
    // Reset toggle state
    useToggleStore.getState().resetToggleState();
    
    // Reset upgrades state
    useUpgradesStore.getState().resetUpgrades();
    
    return true;
  } catch (error) {
    console.error('Failed to reset game:', error);
    return false;
  }
}; 