/**
 * Reset Game Utility Functions
 * 
 * Centralized reset functionality that coordinates all state resets.
 * Follows the same pattern as save/load utilities - pure functions
 * that receive reset functions as parameters.
 * 
 * Purpose:
 * - Provide a single entry point for complete game reset
 * - Coordinate reset across all state management hooks
 * - Ensure consistent reset behavior across the application
 * 
 * Used by:
 * - AdminToolbar for the Reset Game button
 * - Any other component that needs to reset the game
 */

interface ResetFunctions {
  resetGameState: () => void;
  resetWindowState: () => void;
  resetToggleState: () => void;
}

/**
 * Reset the entire game to initial state
 * @param resetFunctions - Object containing all reset functions
 * @returns boolean indicating success/failure
 */
export const resetGame = (resetFunctions: ResetFunctions): boolean => {
  try {
    // Reset all state in the correct order
    resetFunctions.resetGameState();
    resetFunctions.resetWindowState();
    resetFunctions.resetToggleState();
    
    return true;
  } catch (error) {
    console.error('Failed to reset game:', error);
    return false;
  }
}; 