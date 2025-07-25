/**
 * Scrap System Utilities
 * 
 * Helper functions for scrap object management, spawning, and value calculation.
 * These utilities handle the business logic for the scrap collection system.
 */

import { ScrapObject, ScrapType } from '../types/scrapTypes';
import { ScrapMutator } from '../types/mutatorTypes';
import { ScrapRegistry, ScrapTypeId } from '../constants/scrapRegistry';
import { MutatorRegistry, MutatorId } from '../constants/mutatorRegistry';

// Assembly Line Configuration - Shared between assembly line and scrap objects
export const ASSEMBLY_LINE_CONFIG = {
  layout: {
    bottom: 200, // Distance from bottom of screen (px)
    height: 60,  // Height of assembly line area (px)
    trackHeight: 4 // Height of the actual track line (px)
  },
  behavior: {
    speed: 150, // Pixels per second for frame-rate independent movement
    spawnRate: 1000 // Milliseconds between scrap spawns
  },
  visuals: {
    zIndex: 100 // Assembly line z-index
  }
} as const;

/**
 * Get current assembly line configuration (updates width on window resize)
 */
export const getAssemblyLineConfig = () => {
  return {
    ...ASSEMBLY_LINE_CONFIG,
    layout: {
      ...ASSEMBLY_LINE_CONFIG.layout,
      width: window.innerWidth // Full screen width
    }
  };
};

/**
 * Calculate frame-rate independent movement distance
 * @param deltaTime - Time elapsed since last frame (milliseconds)
 * @param speedPxPerSecond - Movement speed in pixels per second
 * @returns Distance to move in pixels
 */
export const calculateMovementDistance = (deltaTime: number, speedPxPerSecond: number): number => {
  return (deltaTime / 1000) * speedPxPerSecond;
};

/**
 * Generate a unique ID for scrap objects
 */
export const generateScrapId = (): string => {
  return `scrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate the weighted spawn chance for scrap types
 * Returns a random scrap type based on weight probabilities
 */
export const getRandomScrapType = (): ScrapTypeId => {
  const totalWeight = Object.values(ScrapRegistry).reduce((sum, scrap) => sum + scrap.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [typeId, scrapType] of Object.entries(ScrapRegistry)) {
    random -= scrapType.weight;
    if (random <= 0) {
      return typeId as ScrapTypeId;
    }
  }
  
  // Fallback to metalScrap if something goes wrong
  return 'metalScrap';
};

/**
 * Generate random mutators for a scrap object based on rarity
 * Returns an array of mutator IDs
 */
export const generateRandomMutators = (maxMutators: number = 2): MutatorId[] => {
  const mutators: MutatorId[] = [];
  
  for (const [mutatorId, mutator] of Object.entries(MutatorRegistry)) {
    if (Math.random() < mutator.rarity && mutators.length < maxMutators) {
      mutators.push(mutatorId as MutatorId);
    }
  }
  
  return mutators;
};

/**
 * Create a new scrap object with random type and mutators
 */
export const createRandomScrapObject = (options: {
  typeId?: ScrapTypeId;
  mutators?: MutatorId[];
  maxMutators?: number;
} = {}): ScrapObject => {
  const typeId = options.typeId || getRandomScrapType();
  const mutators = options.mutators || generateRandomMutators(options.maxMutators);
  
  return {
    id: generateScrapId(),
    typeId,
    mutators,
    createdAt: Date.now()
  };
};

/**
 * Calculate the total credit value of a scrap object
 * Includes base value modified by all mutator multipliers
 */
export const calculateScrapValue = (scrap: ScrapObject): number => {
  const scrapType = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  if (!scrapType) return 0;
  
  let value = scrapType.baseValue;
  
  // Apply mutator multipliers
  for (const mutatorId of scrap.mutators) {
    const mutator = MutatorRegistry[mutatorId as keyof typeof MutatorRegistry];
    if (mutator) {
      value *= mutator.creditMultiplier;
    }
  }
  
  return Math.round(value);
};

/**
 * Get the display appearance for a scrap object
 * Combines base appearance with mutator overlays
 */
export const getScrapAppearance = (scrap: ScrapObject): string => {
  const scrapType = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  if (!scrapType) return '❓';
  
  let appearance = scrapType.appearance;
  
  // Add mutator appearance overlays
  for (const mutatorId of scrap.mutators) {
    const mutator = MutatorRegistry[mutatorId as keyof typeof MutatorRegistry];
    if (mutator) {
      appearance += mutator.appearance;
    }
  }
  
  return appearance;
};

/**
 * Check if a scrap object requires protection to interact with safely
 * Returns the protection property name if required, undefined if safe
 */
export const getRequiredProtection = (scrap: ScrapObject): string | undefined => {
  for (const mutatorId of scrap.mutators) {
    const mutator = MutatorRegistry[mutatorId as keyof typeof MutatorRegistry];
    if (mutator && 'protectionRequired' in mutator && mutator.protectionRequired) {
      return mutator.protectionRequired;
    }
  }
  return undefined;
};

/**
 * Check if a player can safely interact with a scrap object
 */
export const canSafelyInteract = (scrap: ScrapObject, playerState: any): boolean => {
  const requiredProtection = getRequiredProtection(scrap);
  if (!requiredProtection) return true;
  
  return !!playerState[requiredProtection];
};

/**
 * Get all scrap types as an array (useful for UI lists)
 */
export const getAllScrapTypes = (): (ScrapType & { id: ScrapTypeId })[] => {
  return Object.entries(ScrapRegistry).map(([id, scrapType]) => ({
    ...scrapType,
    id: id as ScrapTypeId
  }));
};

/**
 * Get all mutators as an array (useful for UI lists)
 */
export const getAllMutators = (): (ScrapMutator & { id: MutatorId })[] => {
  return Object.entries(MutatorRegistry).map(([id, mutator]) => ({
    ...mutator,
    id: id as MutatorId
  }));
};

/**
 * Validate that a scrap object has valid references
 */
export const validateScrapObject = (scrap: ScrapObject): boolean => {
  // Check that the type exists
  if (!ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry]) {
    console.warn(`Invalid scrap type: ${scrap.typeId}`);
    return false;
  }
  
  // Check that all mutators exist
  for (const mutatorId of scrap.mutators) {
    if (!MutatorRegistry[mutatorId as keyof typeof MutatorRegistry]) {
      console.warn(`Invalid mutator: ${mutatorId}`);
      return false;
    }
  }
  
  return true;
}; 