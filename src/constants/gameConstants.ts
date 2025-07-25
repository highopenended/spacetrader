/**
 * Game Constants and Configuration
 * 
 * This file serves as the single source of truth for all game constants, initial values,
 * and configuration data. It contains NO type definitions (those are in gameState.ts).
 * 
 * Purpose:
 * - Centralize all default/initial game values to avoid duplication
 * - Provide consistent reset values for the resetGame functionality
 * - Store game configuration data (like phase definitions)
 * - Ensure initial state matches reset state exactly
 * 
 * Constants Defined:
 * - INITIAL_CREDITS: Starting credits amount (0)
 * - INITIAL_GAME_PHASE: Starting phase ('lineRat')
 * - INITIAL_GAME_TIME: Starting time values (AR-242, LC-08, etc.)
 * - INITIAL_GAME_STATE: Complete initial game state for unified hook
 * - GAME_PHASES: Configuration for all game phases with titles and descriptions
 * 
 * Used by:
 * - Unified game state hook (useGameState) for initial values and reset functionality
 * - Game state utilities that need phase configuration
 * - Any component that needs to display phase information
 * 
 * Dependencies: gameState.ts (for type imports only)
 */

import { GameTime, GamePhase, PlayerState } from '../types/gameState';
import { DEFAULT_INSTALLED_APPS } from './scrAppListConstants';

// Initial game state constants
export const INITIAL_CREDITS = 0;
export const INITIAL_GAME_PHASE: GamePhase = 'lineRat';

export const INITIAL_GAME_TIME: GameTime = {
  annumReckoning: 242,
  ledgerCycle: 8,
  grind: 1,
  tithe: 2,
  age: 6
};

export const INITIAL_PLAYER_STATE: PlayerState = {
  isProtectedFromSharp: false,
  isProtectedFromRadiation: false,
  isProtectedFromCorrosive: false,
  isProtectedFromExplosive: false,
  isProtectedFromQuantum: false
};

// Complete initial game state (for unified hook)
export const INITIAL_GAME_STATE = {
  credits: INITIAL_CREDITS,
  gamePhase: INITIAL_GAME_PHASE,
  gameTime: INITIAL_GAME_TIME,
  isPaused: false,
  lastUpdate: Date.now(),
  installedApps: DEFAULT_INSTALLED_APPS.map((appId, index) => ({
    id: appId,
    order: index + 1,
    purchased: true,
    installedAt: Date.now(),
    currentTier: 1
  })),
  playerState: INITIAL_PLAYER_STATE,
  scrapObjects: [] // Start with no scrap objects
};

// Game phase configuration data
export const GAME_PHASES: Record<GamePhase, { id: number; title: string; description: string }> = {
  lineRat: { id: 1, title: 'Line Rat', description: 'Assembly line worker on a scrap ship' },
  bayBoss: { id: 2, title: 'Bay Boss', description: 'In charge of a scrap bay on a ship' },
  scrapCaptain: { id: 3, title: 'Scrap Captain', description: 'In charge of a scrap ship, technically part of the peerage now but only in name' },
  fleetBoss: { id: 4, title: 'Fleet Boss', description: 'In charge of multiple scrap ships' },
  subsectorWarden: { id: 5, title: 'Subsector Warden', description: 'In charge of the scrap ships of an entire subsystem' },
  sectorCommodore: { id: 6, title: 'Sector Commodore', description: 'In charge of an entire system, part of the high peerage now' },
  ledgerPatrician: { id: 7, title: 'Ledger Patrician', description: 'Part of a council that manages the merchant family finances like a board of directors' },
  cathedraMinor: { id: 8, title: 'Cathedra Minor', description: 'Married into the merchant family, royalty now but the lowest level, have to grovel for patronage and spend tons of credits on gifts for your betters' },
  cathedraDominus: { id: 9, title: 'Cathedra Dominus', description: 'Finally gaining some real control and power' },
  cathedraUltima: { id: 10, title: 'Cathedra Ultima', description: 'The merchant lord of the entire family' }
}; 