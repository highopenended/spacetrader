/**
 * Barrier Store (Zustand)
 * 
 * Centralized barrier management for collision system.
 * Stores active barriers and provides actions to manage them.
 * 
 * Uses ref-based storage to prevent unnecessary re-renders during game loop.
 */

import { create } from 'zustand';
import { Barrier } from '../types/barrierTypes';

interface BarrierState {
  // Barrier storage (ref-based for game loop performance)
  barriersRef: Map<string, Barrier>;
  
  // Version counter to trigger selective re-renders only when needed
  version: number;
}

interface BarrierActions {
  /**
   * Set all barriers (replaces existing barriers)
   * @param barriers - Array of barriers to set
   */
  setBarriers: (barriers: Barrier[]) => void;
  
  /**
   * Add a single barrier
   * @param barrier - Barrier to add
   */
  addBarrier: (barrier: Barrier) => void;
  
  /**
   * Remove a barrier by ID
   * @param barrierId - ID of barrier to remove
   */
  removeBarrier: (barrierId: string) => void;
  
  /**
   * Update a barrier
   * @param barrierId - ID of barrier to update
   * @param updates - Partial barrier updates
   */
  updateBarrier: (barrierId: string, updates: Partial<Barrier>) => void;
  
  /**
   * Get all barriers (does not cause re-render)
   * Use this in game loop for performance
   */
  getAllBarriers: () => Barrier[];
  
  /**
   * Get a single barrier by ID (does not cause re-render)
   */
  getBarrier: (barrierId: string) => Barrier | undefined;
  
  /**
   * Clear all barriers
   */
  clearBarriers: () => void;
}

type BarrierStore = BarrierState & BarrierActions;

const initialState: BarrierState = {
  barriersRef: new Map(),
  version: 0
};

export const useBarrierStore = create<BarrierStore>((set, get) => ({
  ...initialState,
  
  setBarriers: (barriers: Barrier[]) => {
    const newMap = new Map<string, Barrier>();
    barriers.forEach(barrier => {
      newMap.set(barrier.id, barrier);
    });
    set({ 
      barriersRef: newMap,
      version: get().version + 1
    });
  },
  
  addBarrier: (barrier: Barrier) => {
    const newMap = new Map(get().barriersRef);
    newMap.set(barrier.id, barrier);
    set({ 
      barriersRef: newMap,
      version: get().version + 1
    });
  },
  
  removeBarrier: (barrierId: string) => {
    const newMap = new Map(get().barriersRef);
    newMap.delete(barrierId);
    set({ 
      barriersRef: newMap,
      version: get().version + 1
    });
  },
  
  updateBarrier: (barrierId: string, updates: Partial<Barrier>) => {
    const barrier = get().barriersRef.get(barrierId);
    if (!barrier) return;
    
    const newMap = new Map(get().barriersRef);
    newMap.set(barrierId, { ...barrier, ...updates });
    set({ 
      barriersRef: newMap,
      version: get().version + 1
    });
  },
  
  getAllBarriers: () => {
    return Array.from(get().barriersRef.values());
  },
  
  getBarrier: (barrierId: string) => {
    return get().barriersRef.get(barrierId);
  },
  
  clearBarriers: () => {
    set({ 
      barriersRef: new Map(),
      version: get().version + 1
    });
  }
}));

