/**
 * Toggle State Store (Zustand)
 * 
 * UI toggle state management using Zustand.
 * Manages DataReadout visibility controls and other UI toggles.
 * Provides centralized toggle management with selective subscriptions.
 * 
 * Migrated from useToggleState hook to follow Zustand architecture pattern.
 */

import { create } from 'zustand';
import { ToggleStates } from '../types/toggleState';

interface ToggleState {
  // Core toggle states
  toggleStates: ToggleStates;
}

interface ToggleActions {
  // ===== TOGGLE MANAGEMENT =====
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;

  // ===== RESET FUNCTION =====
  resetToggleState: () => void;

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeToggleState: () => any;
  decodeToggleState: (encodedState: any) => boolean;
}

type ToggleStore = ToggleState & ToggleActions;

const initialToggleStates: ToggleStates = {
  readoutEnabled_Date: true,
  readoutEnabled_JobTitle: true,
  readoutEnabled_WorkButton: true,
  readoutEnabled_Credits: true,
};

export const useToggleStore = create<ToggleStore>((set, get) => ({
  // ===== INITIAL STATE =====
  toggleStates: initialToggleStates,

  // ===== TOGGLE MANAGEMENT =====
  setToggleState: (key: keyof ToggleStates, value: boolean) => {
    set((state) => ({
      toggleStates: { ...state.toggleStates, [key]: value }
    }));
  },

  // ===== RESET FUNCTION =====
  resetToggleState: () => {
    set({ toggleStates: initialToggleStates });
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeToggleState: () => {
    const state = get();
    return {
      toggleStates: state.toggleStates
    };
  },

  decodeToggleState: (encodedState: any): boolean => {
    if (!encodedState) return false;
    
    try {
      // Validate required fields
      if (!encodedState.toggleStates ||
          typeof encodedState.toggleStates.readoutEnabled_Date !== 'boolean' ||
          typeof encodedState.toggleStates.readoutEnabled_JobTitle !== 'boolean' ||
          typeof encodedState.toggleStates.readoutEnabled_WorkButton !== 'boolean' ||
          typeof encodedState.toggleStates.readoutEnabled_Credits !== 'boolean') {
        console.error('Invalid toggle state format');
        return false;
      }

      // Apply the decoded state
      set({ toggleStates: encodedState.toggleStates });
      return true;
    } catch (error) {
      console.error('Failed to decode toggle state:', error);
      return false;
    }
  }
}));
