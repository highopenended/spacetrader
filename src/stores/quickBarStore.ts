/**
 * Quick Bar State Store (Zustand)
 * 
 * Quick bar flags and functionality management using Zustand.
 * Manages toggle states for quick bar features with global access.
 * Provides centralized quick bar management with selective subscriptions.
 */

import { create } from 'zustand';
import { QuickBarFlags } from '../types/quickBarState';

interface QuickBarStoreState {
  // Core quick bar flags
  quickBarFlags: QuickBarFlags;
}

interface QuickBarActions {
  // ===== FLAG MANAGEMENT =====
  setQuickBarFlag: (key: keyof QuickBarFlags, value: boolean) => void;
  resetQuickBar: () => void;

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeQuickBarState: () => QuickBarFlags;
  decodeQuickBarState: (state: QuickBarFlags) => boolean;
}

type QuickBarStore = QuickBarStoreState & QuickBarActions;

const DEFAULT_QUICKBAR_STATE: QuickBarStoreState = {
  quickBarFlags: {
    isActiveDumpsterVision: false,
  }
};

export const useQuickBarStore = create<QuickBarStore>((set, get) => ({
  // ===== INITIAL STATE =====
  ...DEFAULT_QUICKBAR_STATE,

  // ===== FLAG MANAGEMENT =====
  setQuickBarFlag: (key: keyof QuickBarFlags, value: boolean) => {
    set((state) => ({
      quickBarFlags: {
        ...state.quickBarFlags,
        [key]: value
      }
    }));
  },

  resetQuickBar: () => {
    set(DEFAULT_QUICKBAR_STATE);
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeQuickBarState: (): QuickBarFlags => {
    const state = get();
    return { ...state.quickBarFlags };
  },

  decodeQuickBarState: (state: QuickBarFlags): boolean => {
    try {
      // Validate the incoming state
      if (!state || typeof state !== 'object') return false;
      if (typeof state.isActiveDumpsterVision !== 'boolean') return false;

      set({
        quickBarFlags: { ...state }
      });
      return true;
    } catch (error) {
      console.error('Failed to decode quick bar state:', error);
      return false;
    }
  }
}));
