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
  baseMass: number;              // Base mass for physics calculations (default: 1)
  appearance: string;            // Icon/emoji for display
  weight: number;                // Spawn probability weight
  alwaysMutators?: MutatorId[];  // Mutators that always apply to this scrap type
  neverMutators?: MutatorId[];   // Mutators that can never apply to this scrap type
} 