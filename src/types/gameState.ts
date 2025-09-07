/**
 * Game State Type Definitions
 * 
 * This file contains all TypeScript type definitions for the game's state management.
 * It defines the core data structures used throughout the application but contains
 * NO constants or default values (those are in gameConstants.ts).
 * 
 * Key Types:
 * - GameTime: Represents the in-game time system (years, months, days, etc.)
 * - GamePhase: Union type of all possible game progression phases
 * - GameState: Complete game state structure (currently unused but available for future use)
 * 
 * Used by:
 * - Game store (gameStore)
 * - All components that display game state
 * - Utility functions that manipulate game state
 * - Constants file for type safety
 * 
 * Dependencies: None (pure type definitions)
 */

import React from 'react';
import { ScrapObject } from './scrapTypes';

export interface GameTime {
  annumReckoning: number;  // Year
  ledgerCycle: number;     // Month (1-20)
  grind: number;           // Day (1-8)
  tithe: number;           // Period (1-4, 1 per 5 ledger cycles)
  age: number;             // Player age
  yearOfDeath?: number;    // Year of death (optional, defaults to "Not Yet Assigned")
}

export type GamePhase = 
  | 'lineRat'
  | 'bayBoss' 
  | 'scrapCaptain'
  | 'fleetBoss'
  | 'subsectorWarden'
  | 'sectorCommodore'
  | 'ledgerPatrician'
  | 'cathedraMinor'
  | 'cathedraDominus'
  | 'cathedraUltima';

export type GameMode = 'freeMode' | 'workMode';

export interface PlayerState {
  // Protection from various hazards
  isProtectedFromSharp: boolean;
  isProtectedFromRadiation: boolean;
  isProtectedFromCorrosive: boolean;
  isProtectedFromExplosive: boolean;
  isProtectedFromQuantum: boolean;
  
  // Additional player properties can be added here
  // health?: number;
  // experience?: number;
  // equipment?: Equipment[];
}

export interface GameState {
  gamePhase: GamePhase;
  credits: number;
  currentTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;      // Timestamp of last update
  
  // Player state
  playerState: PlayerState;
  
  // Scrap system
  scrapObjects: ScrapObject[];  // Active scrap objects on screen
} 