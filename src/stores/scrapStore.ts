/**
 * Scrap Store (Zustand)
 * 
 * Centralized scrap management for work mode gameplay.
 * Stores active scrap state and provides actions to manage it.
 * 
 * Uses ref-based storage to prevent unnecessary re-renders during game loop.
 * Follows the same pattern as barrierStore for consistency.
 */

import { create } from 'zustand';
import { ScrapSpawnState, ActiveScrapObject, initializeScrapSpawnState } from '../utils/scrapUtils';

interface ScrapState {
  // Scrap state storage (ref-based for game loop performance)
  spawnStateRef: ScrapSpawnState;
  
  // Collected count (for display/stats)
  collectedCount: number;
  
  // Being collected IDs (temporary state for visual transitions)
  beingCollectedIdsRef: Set<string>;
  
  // Version counter to trigger selective re-renders only when needed
  version: number;
}

interface ScrapActions {
  /**
   * Set the entire scrap spawn state (replaces existing state)
   * @param state - New scrap spawn state
   */
  setSpawnState: (state: ScrapSpawnState) => void;
  
  /**
   * Update scrap spawn state using a function (like React setState pattern)
   * @param updater - Function that receives current state and returns new state
   */
  updateSpawnState: (updater: (prev: ScrapSpawnState) => ScrapSpawnState) => void;
  
  /**
   * Get all active scrap (does not cause re-render)
   * Use this in game loop for performance
   */
  getAllScrap: () => ActiveScrapObject[];
  
  /**
   * Get a single scrap by ID (does not cause re-render)
   */
  getScrap: (scrapId: string) => ActiveScrapObject | undefined;
  
  /**
   * Get mutators for a scrap (does not cause re-render)
   */
  getScrapMutators: (scrapId: string) => string[];
  
  /**
   * Get current spawn state (does not cause re-render)
   * Use this in game loop for performance
   */
  getSpawnState: () => ScrapSpawnState;
  
  /**
   * Reset scrap state to initial values
   */
  resetScrapState: () => void;
  
  /**
   * Update collected count
   */
  setCollectedCount: (count: number) => void;
  incrementCollectedCount: () => void;
  
  /**
   * Manage being-collected IDs (for visual transitions)
   */
  addBeingCollectedId: (scrapId: string) => void;
  removeBeingCollectedId: (scrapId: string) => void;
  clearBeingCollectedIds: () => void;
  getBeingCollectedIds: () => Set<string>;
}

type ScrapStore = ScrapState & ScrapActions;

const initialState: ScrapState = {
  spawnStateRef: initializeScrapSpawnState(),
  collectedCount: 0,
  beingCollectedIdsRef: new Set(),
  version: 0
};

export const useScrapStore = create<ScrapStore>((set, get) => ({
  ...initialState,
  
  setSpawnState: (state: ScrapSpawnState) => {
    set({ 
      spawnStateRef: state,
      version: get().version + 1
    });
  },
  
  updateSpawnState: (updater: (prev: ScrapSpawnState) => ScrapSpawnState) => {
    const current = get().spawnStateRef;
    const updated = updater(current);
    set({ 
      spawnStateRef: updated,
      version: get().version + 1
    });
  },
  
  getAllScrap: () => {
    return get().spawnStateRef.activeScrap;
  },
  
  getScrap: (scrapId: string) => {
    return get().spawnStateRef.activeScrap.find(s => s.id === scrapId);
  },
  
  getScrapMutators: (scrapId: string) => {
    const scrap = get().spawnStateRef.activeScrap.find(s => s.id === scrapId);
    return scrap?.mutators || [];
  },
  
  getSpawnState: () => {
    return get().spawnStateRef;
  },
  
  resetScrapState: () => {
    set({ 
      spawnStateRef: initializeScrapSpawnState(),
      collectedCount: 0,
      beingCollectedIdsRef: new Set(),
      version: get().version + 1
    });
  },
  
  setCollectedCount: (count: number) => {
    set({ collectedCount: count });
  },
  
  incrementCollectedCount: () => {
    set((state) => ({ collectedCount: state.collectedCount + 1 }));
  },
  
  addBeingCollectedId: (scrapId: string) => {
    const newSet = new Set(get().beingCollectedIdsRef);
    newSet.add(scrapId);
    set({ beingCollectedIdsRef: newSet });
  },
  
  removeBeingCollectedId: (scrapId: string) => {
    const newSet = new Set(get().beingCollectedIdsRef);
    newSet.delete(scrapId);
    set({ beingCollectedIdsRef: newSet });
  },
  
  clearBeingCollectedIds: () => {
    set({ beingCollectedIdsRef: new Set() });
  },
  
  getBeingCollectedIds: () => {
    return get().beingCollectedIdsRef;
  }
}));

