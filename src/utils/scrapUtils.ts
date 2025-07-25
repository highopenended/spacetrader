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
    bottom: '20vh', // Distance from bottom of screen (converted from 200px)
    height: '6vh',  // Height of assembly line area (converted from 60px)
    trackHeight: '0.4vh' // Height of the actual track line (converted from 4px)
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
 * Active scrap object with position and state
 */
export interface ActiveScrapObject extends ScrapObject {
  x: number;           // Current X position (pixels from left)
  y: number;           // Current Y position (pixels from bottom)
  isCollected: boolean; // Whether scrap has been collected
  isOffScreen: boolean; // Whether scrap has moved off screen
}

/**
 * Scrap spawn state management
 */
export interface ScrapSpawnState {
  lastSpawnTime: number;
  activeScrap: ActiveScrapObject[];
  spawnEnabled: boolean;
}

/**
 * Initialize scrap spawn state
 */
export const initializeScrapSpawnState = (): ScrapSpawnState => ({
  lastSpawnTime: 0,
  activeScrap: [],
  spawnEnabled: true
});

/**
 * Get current assembly line configuration (updates width on window resize)
 */
export const getAssemblyLineConfig = () => {
  return {
    ...ASSEMBLY_LINE_CONFIG,
    layout: {
      ...ASSEMBLY_LINE_CONFIG.layout,
      width: '100vw' // Full screen width
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
 * Spawn a new scrap object on the assembly line
 * @param currentTime - Current timestamp
 * @param spawnState - Current spawn state
 * @returns Updated spawn state with new scrap if spawned
 */
export const spawnScrapIfReady = (
  currentTime: number, 
  spawnState: ScrapSpawnState
): ScrapSpawnState => {
  if (!spawnState.spawnEnabled) return spawnState;
  
  const timeSinceLastSpawn = currentTime - spawnState.lastSpawnTime;
  const spawnInterval = ASSEMBLY_LINE_CONFIG.behavior.spawnRate;
  
  if (timeSinceLastSpawn >= spawnInterval) {
    const newScrap = createRandomScrapObject();
    const activeScrap: ActiveScrapObject = {
      ...newScrap,
      x: 110, // Start off-screen to the right (110vw)
      y: 0, // Will be positioned relative to assembly line
      isCollected: false,
      isOffScreen: false
    };
    
    return {
      ...spawnState,
      lastSpawnTime: currentTime,
      activeScrap: [...spawnState.activeScrap, activeScrap]
    };
  }
  
  return spawnState;
};

/**
 * Update positions of all active scrap objects
 * @param deltaTime - Time elapsed since last frame
 * @param spawnState - Current spawn state
 * @returns Updated spawn state with new positions
 */
export const updateScrapPositions = (
  deltaTime: number, 
  spawnState: ScrapSpawnState
): ScrapSpawnState => {
  const movementDistance = calculateMovementDistance(
    deltaTime, 
    ASSEMBLY_LINE_CONFIG.behavior.speed
  );
  
  // Convert pixel movement to vw units for relative positioning
  const movementVw = (movementDistance / window.innerWidth) * 100;
  
  const updatedScrap = spawnState.activeScrap.map(scrap => {
    const newX = scrap.x - movementVw;
    const isOffScreen = newX < -10; // Mark as off-screen when it goes off the left (-10vw)
    
    return {
      ...scrap,
      x: newX,
      isOffScreen
    };
  });
  
  // Remove off-screen scrap
  const activeScrap = updatedScrap.filter(scrap => !scrap.isOffScreen);
  
  return {
    ...spawnState,
    activeScrap
  };
};

/**
 * Collect a scrap object (mark as collected)
 * @param scrapId - ID of scrap to collect
 * @param spawnState - Current spawn state
 * @returns Updated spawn state with collected scrap
 */
export const collectScrap = (
  scrapId: string, 
  spawnState: ScrapSpawnState
): { spawnState: ScrapSpawnState; collectedScrap?: ActiveScrapObject } => {
  const scrapIndex = spawnState.activeScrap.findIndex(scrap => scrap.id === scrapId);
  
  if (scrapIndex === -1) {
    return { spawnState };
  }
  
  const scrap = spawnState.activeScrap[scrapIndex];
  const updatedScrap = { ...scrap, isCollected: true };
  
  const newActiveScrap = [...spawnState.activeScrap];
  newActiveScrap[scrapIndex] = updatedScrap;
  
  return {
    spawnState: {
      ...spawnState,
      activeScrap: newActiveScrap
    },
    collectedScrap: updatedScrap
  };
};

/**
 * Remove collected scrap from active list
 * @param spawnState - Current spawn state
 * @returns Updated spawn state with collected scrap removed
 */
export const cleanupCollectedScrap = (spawnState: ScrapSpawnState): ScrapSpawnState => {
  const activeScrap = spawnState.activeScrap.filter(scrap => !scrap.isCollected);
  
  return {
    ...spawnState,
    activeScrap
  };
};

/**
 * Get scrap objects that are within collection range of a point
 * @param x - X coordinate to check
 * @param y - Y coordinate to check
 * @param range - Collection range in pixels
 * @param spawnState - Current spawn state
 * @returns Array of scrap objects within range
 */
export const getScrapInRange = (
  x: number, 
  y: number, 
  range: number, 
  spawnState: ScrapSpawnState
): ActiveScrapObject[] => {
  return spawnState.activeScrap.filter(scrap => {
    if (scrap.isCollected) return false;
    
    const distance = Math.sqrt(
      Math.pow(scrap.x - x, 2) + Math.pow(scrap.y - y, 2)
    );
    
    return distance <= range;
  });
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