/**
 * Game State Utility Functions
 * 
 * This file contains pure utility functions for manipulating, calculating, and formatting
 * game state data. These are stateless helper functions that perform calculations and
 * transformations on game data.
 * 
 * Function Categories:
 * 
 * 1. Formatting Functions:
 *    - getTitheName(): Convert tithe number to readable name
 *    - getLedgerCycleName(): Format ledger cycle with zero padding
 *    - getAnnumReckoningName(): Format annum reckoning for display
 *    - getGrindName(): Format grind value for display
 * 
 * 2. Game Logic Functions:
 *    - getNextGamePhase(): Calculate next phase in progression
 *    - calculateTithe(): Determine tithe based on ledger cycle
 *    - advanceGameTime(): Handle time progression with rollovers
 * 
 * Key Logic:
 * - Time system: 8 grinds per ledger cycle, 20 ledger cycles per annum reckoning
 * - Tithe system: Changes every 5 ledger cycles (1-5=1st, 6-10=2nd, etc.)
 * - Phase progression: Uses GAME_PHASES configuration for sequential advancement
 * 
 * Used by:
 * - Game time hooks for automatic time advancement
 * - Admin toolbar for manual time manipulation
 * - Display components for formatting time values
 * - Game phase hooks for progression logic
 * 
 * Dependencies: gameState.ts (types), gameConstants.ts (GAME_PHASES config)
 */

import { GamePhase, GameTime } from '../types/gameState';
import { GAME_PHASES } from '../constants/gameConstants';

export const getTitheName = (tithe: number): string => {
  const titheNames = ['1st Tithe', '2nd Tithe', '3rd Tithe', '4th Tithe'];
  return titheNames[tithe - 1] || 'Unknown Tithe';
};

export const getLedgerCycleName = (cycle: number): string => {
  return cycle.toString().padStart(2, '0');
};

export const getAnnumReckoningName = (annum: number): string => {
  return annum.toString();
};

export const getGrindName = (grind: number): string => {
  return grind.toString();
};

export const getJobTitle = (gamePhase: GamePhase): string => {
  return GAME_PHASES[gamePhase].title;
};

export const getNextGamePhase = (currentPhase: GamePhase): GamePhase | null => {
  const currentId = GAME_PHASES[currentPhase].id;
  const nextPhase = Object.entries(GAME_PHASES).find(
    ([_, phaseData]) => phaseData.id === currentId + 1
  );
  return nextPhase ? (nextPhase[0] as GamePhase) : null;
};

export const calculateTithe = (ledgerCycle: number): number => {
  if (ledgerCycle >= 1 && ledgerCycle <= 5) return 1;
  if (ledgerCycle >= 6 && ledgerCycle <= 10) return 2;
  if (ledgerCycle >= 11 && ledgerCycle <= 15) return 3;
  if (ledgerCycle >= 16 && ledgerCycle <= 20) return 4;
  return 1; // fallback
};

export const advanceGameTime = (currentTime: GameTime): GameTime => {
  const newTime = { ...currentTime };
  
  // Handle grind rollover
  if (newTime.grind > 8) {
    newTime.grind = 1;
    newTime.ledgerCycle++;
  }

  // Handle ledger cycle rollover
  if (newTime.ledgerCycle > 20) {
    newTime.ledgerCycle = 1;
    newTime.annumReckoning++;
    newTime.age++;
  }
  
  // Recalculate tithe based on current ledger cycle
  newTime.tithe = calculateTithe(newTime.ledgerCycle);
  
  return newTime;
}; 