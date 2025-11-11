/**
 * Scrap System Utilities
 * 
 * Helper functions for scrap object management, spawning, and value calculation.
 * These utilities handle the business logic for the scrap collection system.
 */

import { ScrapObject } from '../types/scrapTypes';
import { ScrapRegistry, ScrapTypeId } from '../constants/scrapRegistry';
import { MutatorRegistry, MutatorId } from '../constants/mutatorRegistry';

// Cached calculations for performance - computed once at module load
const SCRAP_TYPE_TOTAL_WEIGHT = Object.values(ScrapRegistry).reduce((sum, scrap) => sum + scrap.weight, 0);
const MUTATOR_ENTRIES = Object.entries(MutatorRegistry);

// Assembly Line Configuration - Shared between assembly line and scrap objects
export const ASSEMBLY_LINE_CONFIG = {
  layout: {
    bottom: '20vh', // Distance from bottom of screen (converted from 200px)
    height: '6vh',  // Height of assembly line area (converted from 60px)
    trackHeight: '0.4vh' // Height of the actual track line (converted from 4px)
  },
  behavior: {
    speed: 3, // World units per second (3 wu/s) - device-independent movement
    spawnRate: 1000 // Milliseconds between scrap spawns
  },
  visuals: {
    zIndex: 100 // Assembly line z-index
  }
} as const;

/**
 * Active scrap object with position and state
 * 
 * ALL POSITIONS IN WORLD UNITS (wu):
 * - World size: 20w × 10h
 * - x: horizontal position from left edge (0-20 wu)
 * - y: vertical position from bottom edge (0-10 wu)
 */
export interface ActiveScrapObject extends ScrapObject {
  x: number;           // Current X position (world units from left, 0-20)
  y: number;           // Current Y position (world units from bottom, 0-10)
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
 * Calculate frame-rate independent movement distance in world units
 * @param deltaTime - Time elapsed since last frame (milliseconds)
 * @param speedWuPerSecond - Movement speed in world units per second
 * @returns Distance to move in world units
 */
export const calculateMovementDistance = (deltaTime: number, speedWuPerSecond: number): number => {
  return (deltaTime / 1000) * speedWuPerSecond;
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
  let random = Math.random() * SCRAP_TYPE_TOTAL_WEIGHT;
  
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
  
  for (const [mutatorId, mutator] of MUTATOR_ENTRIES) {
    if (Math.random() < mutator.rarity && mutators.length < maxMutators) {
      mutators.push(mutatorId as MutatorId);
    }
  }
  
  return mutators;
};

/**
 * Select a random state for scrap that has multiple states
 * Returns the state name based on spawn weights
 */
export const selectRandomState = (states: Record<string, any>): string => {
  const stateEntries = Object.entries(states);
  if (stateEntries.length === 0) return 'default';
  if (stateEntries.length === 1) return stateEntries[0][0];
  
  // Calculate total weight
  const totalWeight = stateEntries.reduce((sum, [, state]) => {
    return sum + (state.spawnWeight || 1);
  }, 0);
  
  // Select based on weights
  let random = Math.random() * totalWeight;
  for (const [stateName, state] of stateEntries) {
    random -= (state.spawnWeight || 1);
    if (random <= 0) {
      return stateName;
    }
  }
  
  // Fallback to first state
  return stateEntries[0][0];
};

/**
 * Assign mutators to scrap based on type rules and state
 * Handles always/never mutators and state-specific mutators
 */
export const assignMutatorsToScrap = (
  typeId: ScrapTypeId, 
  state?: string
): MutatorId[] => {
  const scrapType = ScrapRegistry[typeId as keyof typeof ScrapRegistry];
  if (!scrapType) return [];
  
  const mutators: MutatorId[] = [];
  
  // Add always-applied mutators
  if ('alwaysMutators' in scrapType && scrapType.alwaysMutators) {
    mutators.push(...(scrapType.alwaysMutators as MutatorId[]));
  }
  
  // Add state-specific mutators
  if (state && 'states' in scrapType && scrapType.states) {
    const stateData = (scrapType.states as any)[state];
    if (stateData?.mutators) {
      mutators.push(...(stateData.mutators as MutatorId[]));
    }
  }
  
  // Add random mutators (excluding never-applied ones)
  const neverMutators = new Set(('neverMutators' in scrapType ? scrapType.neverMutators : []) || []);
  const availableMutators = MUTATOR_ENTRIES.filter(([mutatorId]) => 
    !neverMutators.has(mutatorId as any) && 
    !mutators.includes(mutatorId as MutatorId) // Don't duplicate
  );
  
  for (const [mutatorId, mutator] of availableMutators) {
    if (Math.random() < mutator.rarity && mutators.length < 3) { // Max 3 total mutators
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
  state?: string;
} = {}): ScrapObject => {
  const typeId = options.typeId || getRandomScrapType();
  const scrapType = ScrapRegistry[typeId as keyof typeof ScrapRegistry];
  
  // Select state if not provided and scrap has states
  let state = options.state;
  if (!state && 'states' in scrapType && scrapType.states) {
    state = selectRandomState(scrapType.states);
  }
  
  // Assign mutators based on new system
  const mutators = options.mutators || assignMutatorsToScrap(typeId, state);
  
  return {
    id: generateScrapId(),
    typeId,
    mutators,
    createdAt: Date.now(),
    state
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
      x: 22, // Start off-screen to the right (22 wu, world is 20 wu wide)
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
  
  const updatedScrap = spawnState.activeScrap.map(scrap => {
    const newX = scrap.x - movementDistance;
    const isOffScreen = newX < -2; // Mark as off-screen when it goes off the left (-2 wu)
    
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
  
  // Use state-specific base value if available
  let value = scrapType.baseValue;
  if (scrap.state && 'states' in scrapType && scrapType.states) {
    const stateData = (scrapType.states as any)[scrap.state];
    if (stateData?.baseValue) {
      value = stateData.baseValue;
    }
  }
  
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
 * By default combines base appearance with mutator overlays.
 * Pass includeMutators = false to return only the base scrap type symbol.
 */
export const getScrapAppearance = (scrap: ScrapObject, includeMutators: boolean = true): string => {
  const scrapType = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  if (!scrapType) return '❓';
  
  // Use state-specific appearance if available
  let appearance = scrapType.appearance;
  if (scrap.state && 'states' in scrapType && scrapType.states) {
    const stateData = (scrapType.states as any)[scrap.state];
    if (stateData?.appearance) {
      appearance = stateData.appearance;
    }
  }
  
  // Add mutator appearance overlays when requested
  if (includeMutators) {
    for (const mutatorId of scrap.mutators) {
      const mutator = MutatorRegistry[mutatorId as keyof typeof MutatorRegistry];
      if (mutator) {
        appearance += mutator.appearance;
      }
    }
  }
  
  return appearance;
};

/**
 * Change the state of a scrap object
 * Updates the scrap's state and recalculates its mutators based on the new state
 * @param scrapId - ID of scrap to change
 * @param newState - New state to transition to
 * @param spawnState - Current spawn state
 * @returns Updated spawn state with changed scrap
 */
export const changeScrapState = (
  scrapId: string,
  newState: string,
  spawnState: ScrapSpawnState
): ScrapSpawnState => {
  const scrapIndex = spawnState.activeScrap.findIndex(scrap => scrap.id === scrapId);
  
  if (scrapIndex === -1) {
    return spawnState; // Scrap not found
  }
  
  const scrap = spawnState.activeScrap[scrapIndex];
  const scrapType = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  
  if (!scrapType || !('states' in scrapType) || !scrapType.states) {
    return spawnState; // No states defined for this scrap type
  }
  
  const stateData = (scrapType.states as any)[newState];
  if (!stateData) {
    return spawnState; // Invalid state
  }
  
  // Create updated scrap with new state and mutators
  const updatedScrap: ActiveScrapObject = {
    ...scrap,
    state: newState,
    mutators: [...(stateData.mutators as MutatorId[] || [])]
  };
  
  // Add always-applied mutators
  if ('alwaysMutators' in scrapType && scrapType.alwaysMutators) {
    updatedScrap.mutators.push(...(scrapType.alwaysMutators as MutatorId[]));
  }
  
  // Add random mutators (excluding never-applied ones)
  const neverMutators = new Set(('neverMutators' in scrapType ? scrapType.neverMutators : []) || []);
  const availableMutators = MUTATOR_ENTRIES.filter(([mutatorId]) => 
    !neverMutators.has(mutatorId as any) && 
    !updatedScrap.mutators.includes(mutatorId as MutatorId) // Don't duplicate
  );
  
  for (const [mutatorId, mutator] of availableMutators) {
    if (Math.random() < mutator.rarity && updatedScrap.mutators.length < 3) { // Max 3 total mutators
      updatedScrap.mutators.push(mutatorId as MutatorId);
    }
  }
  
  // Update the spawn state
  const newActiveScrap = [...spawnState.activeScrap];
  newActiveScrap[scrapIndex] = updatedScrap;
  
  return {
    ...spawnState,
    activeScrap: newActiveScrap
  };
};

export interface MutatorChangeSet {
  add?: MutatorId[];
  remove?: MutatorId[];
}

/**
 * Apply mutator changes on a specific scrap object.
 *
 * Removes any mutators listed in `remove` and adds any mutators listed in `add`.
 * Returns the original state when no changes are required.
 */
export const applyMutatorChangesToScrap = (
  spawnState: ScrapSpawnState,
  scrapId: string,
  { add = [], remove = [] }: MutatorChangeSet
): ScrapSpawnState => {
  if (add.length === 0 && remove.length === 0) {
    return spawnState;
  }

  const scrapIndex = spawnState.activeScrap.findIndex(scrap => scrap.id === scrapId);
  if (scrapIndex === -1) {
    return spawnState;
  }

  const scrap = spawnState.activeScrap[scrapIndex];
  const scrapMutators = scrap.mutators as MutatorId[];
  const removeSet = new Set(remove);
  const addSet = new Set(add);

  let changed = false;

  const updatedMutators = scrapMutators.reduce<MutatorId[]>((acc, mutatorId) => {
    if (removeSet.has(mutatorId)) {
      changed = true;
      return acc;
    }
    acc.push(mutatorId);
    return acc;
  }, []);

  addSet.forEach(mutatorId => {
    if (!updatedMutators.includes(mutatorId)) {
      updatedMutators.push(mutatorId);
      changed = true;
    }
  });

  if (!changed) {
    return spawnState;
  }

  const updatedScrap: ActiveScrapObject = {
    ...scrap,
    mutators: updatedMutators
  };

  const newActiveScrap = [...spawnState.activeScrap];
  newActiveScrap[scrapIndex] = updatedScrap;

  return {
    ...spawnState,
    activeScrap: newActiveScrap
  };
};

