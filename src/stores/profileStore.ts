/**
 * Profile State Store (Zustand)
 * 
 * User profile data management using Zustand.
 * Manages profile name and achievements with global access.
 * Provides centralized profile management with selective subscriptions.
 */

import { create } from 'zustand';
import { ProfileState } from '../types/profileState';

interface ProfileStoreState {
  // Core profile data
  profileName: string;
  endingsAchieved: string[];
}

interface ProfileActions {
  // ===== PROFILE MANAGEMENT =====
  setProfileName: (name: string) => void;
  addEndingAchieved: (endingName: string) => void;
  resetProfile: () => void;

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeProfileState: () => ProfileState;
  decodeProfileState: (state: ProfileState) => boolean;
}

type ProfileStore = ProfileStoreState & ProfileActions;

const DEFAULT_PROFILE_STATE: ProfileStoreState = {
  profileName: 'DEFAULTUSER',
  endingsAchieved: []
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // ===== INITIAL STATE =====
  ...DEFAULT_PROFILE_STATE,

  // ===== PROFILE MANAGEMENT =====
  setProfileName: (name: string) => {
    set({
      profileName: name.trim() || 'DEFAULTUSER' // Never allow blank names
    });
  },

  addEndingAchieved: (endingName: string) => {
    set((state) => ({
      endingsAchieved: state.endingsAchieved.includes(endingName)
        ? state.endingsAchieved
        : [...state.endingsAchieved, endingName]
    }));
  },

  resetProfile: () => {
    set(DEFAULT_PROFILE_STATE);
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeProfileState: (): ProfileState => {
    const state = get();
    return {
      profileName: state.profileName,
      endingsAchieved: [...state.endingsAchieved]
    };
  },

  decodeProfileState: (state: ProfileState): boolean => {
    try {
      // Validate the incoming state
      if (!state || typeof state !== 'object') return false;
      if (typeof state.profileName !== 'string') return false;
      if (!Array.isArray(state.endingsAchieved)) return false;
      if (!state.endingsAchieved.every(ending => typeof ending === 'string')) return false;

      set({
        profileName: state.profileName.trim() || 'DEFAULTUSER',
        endingsAchieved: [...state.endingsAchieved]
      });
      return true;
    } catch (error) {
      console.error('Failed to decode profile state:', error);
      return false;
    }
  }
}));
