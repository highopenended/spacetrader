/**
 * Endings State Store (Zustand)
 * 
 * Centralized endings system management using Zustand.
 * Handles ending triggers, active ending state, and integration with profile achievements.
 * Replaces the useEndingsState hook to eliminate prop drilling and improve performance.
 * 
 * Migrated from useEndingsState hook to follow Zustand architecture pattern.
 */

import { create } from 'zustand';
import { EndingState, EndingTriggerData, EndingDefinition, ActiveEnding } from '../types/endingState';
import { useProfileStore } from './profileStore';

interface EndingsStoreState {
  // Core ending data
  activeEnding: ActiveEnding | null;
}

interface EndingsActions {
  // ===== ENDING MANAGEMENT =====
  checkForEndingTriggers: (triggerData: EndingTriggerData, endingsRegistry: Record<string, EndingDefinition>) => void;
  clearActiveEnding: () => void;
  setActiveEnding: (ending: ActiveEnding) => void;

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeEndingsState: () => any;
  decodeEndingsState: (encodedState: any) => boolean;

  // ===== RESET FUNCTION =====
  resetEndingsState: () => void;
}

type EndingsStore = EndingsStoreState & EndingsActions;

const DEFAULT_ENDINGS_STATE: EndingsStoreState = {
  activeEnding: null
};

export const useEndingsStore = create<EndingsStore>((set, get) => ({
  // ===== INITIAL STATE =====
  ...DEFAULT_ENDINGS_STATE,

  // ===== ENDING MANAGEMENT =====
  checkForEndingTriggers: (triggerData: EndingTriggerData, endingsRegistry: Record<string, EndingDefinition>) => {
    const state = get();
    // Don't trigger if an ending is already active
    if (state.activeEnding) return;

    // Check each ending to see if it should trigger
    for (const ending of Object.values(endingsRegistry)) {
      if (ending.checkTrigger(triggerData)) {
        // Trigger this ending
        const activeEnding: ActiveEnding = {
          ending,
          triggeredAt: Date.now()
        };
        
        set({ activeEnding });
        useProfileStore.getState().addEndingAchieved(ending.id);
        return; // Only trigger one ending at a time
      }
    }
  },

  clearActiveEnding: () => {
    set({ activeEnding: null });
  },

  setActiveEnding: (activeEnding: ActiveEnding) => {
    set({ activeEnding });
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeEndingsState: () => {
    const state = get();
    return {
      activeEnding: state.activeEnding
    };
  },

  decodeEndingsState: (encodedState: any): boolean => {
    if (!encodedState) return false;
    
    try {
      // Validate the incoming state
      if (typeof encodedState !== 'object') return false;
      
      // activeEnding can be null or a valid ActiveEnding object
      if (encodedState.activeEnding !== null) {
        if (typeof encodedState.activeEnding !== 'object' ||
            !encodedState.activeEnding.ending ||
            typeof encodedState.activeEnding.triggeredAt !== 'number') {
          console.error('Invalid active ending format');
          return false;
        }
      }

      set({
        activeEnding: encodedState.activeEnding
      });
      return true;
    } catch (error) {
      console.error('Failed to decode endings state:', error);
      return false;
    }
  },

  // ===== RESET FUNCTION =====
  resetEndingsState: () => {
    set(DEFAULT_ENDINGS_STATE);
  }
}));
