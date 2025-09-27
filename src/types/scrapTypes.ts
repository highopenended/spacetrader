/**
 * Scrap System Type Definitions
 * 
 * Core interfaces for the scrap collection and interaction system.
 * These types define the structure for scrap objects, types, and mutators.
 */

import { MutatorId } from './mutatorTypes';

// Define the basic ID type here to avoid circular dependencies
export type ScrapTypeId = string;

/**
 * ScrapObject - Individual scrap instances on screen
 * 
 * These are the actual objects players interact with.
 * Each object references a ScrapType and can have mutators applied.
 */
export interface ScrapObject {
  id: string;                    // Unique instance ID
  typeId: ScrapTypeId;           // What it appears to be
  trueTypeId?: ScrapTypeId;      // If it's actually something else (for deception/mystery)
  mutators: MutatorId[];         // Applied mutators
  createdAt: number;             // Timestamp of creation
  state?: string;                // Current state (for scrap with dynamic states)
}

/**
 * ScrapType - Template definition for scrap objects
 * 
 * Defines the base properties and appearance of scrap types.
 * Used as templates when creating ScrapObject instances.
 */
export interface ScrapType {
  id: ScrapTypeId;
  label: string;                 // Display name
  description: string;           // Flavor text
  baseValue: number;             // Base credit value
  appearance: string;            // Icon/emoji for display
  weight: number;                // Spawn probability weight
  alwaysMutators?: MutatorId[];  // Mutators that always apply to this scrap type
  neverMutators?: MutatorId[];   // Mutators that can never apply to this scrap type
  states?: {                     // Dynamic states for scrap that can change
    [stateName: string]: {
      appearance: string;        // Sprite/emoji for this state
      mutators: MutatorId[];     // Mutators for this state
      baseValue: number;         // Value for this state
      label?: string;            // Optional different label for this state
      spawnWeight?: number;      // Weight for spawning in this state (defaults to 1)
    }
  };
} 