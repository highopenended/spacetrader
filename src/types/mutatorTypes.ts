/**
 * Scrap Mutator Type Definitions
 * 
 * Core interfaces for the scrap mutator system.
 * These types define the structure for mutators and their interaction context.
 */

import { GameState } from './gameState';
import { ScrapObject } from './scrapTypes';

// Define the basic ID type here to avoid circular dependencies
export type MutatorId = string;

/**
 * ScrapMutator - Properties that modify scrap behavior
 * 
 * Mutators are applied to scrap objects to change their properties,
 * add interaction effects, or require special handling.
 */
export interface ScrapMutator {
  id: MutatorId;
  label: string;                 // Display name
  appearance: string;            // Icon/emoji overlay
  creditMultiplier: number;      // Modifies base value
  protectionRequired?: string;   // Player protection property needed
  onInteract?: (context: ScrapInteractionContext) => void; // Interaction logic
  rarity: number;                // Spawn probability (0-1)
  description: string;           // Flavor text
}

/**
 * ScrapInteractionContext - Context passed to mutator interactions
 * 
 * Provides access to both the game state and the specific scrap object
 * being interacted with for mutator interaction logic.
 */
export interface ScrapInteractionContext {
  gameState: GameState;          // Full game state access
  scrap: ScrapObject;            // The scrap being interacted with
} 