/**
 * Profile State Hook
 * 
 * Manages user profile data including name and achievements.
 * Follows single-instance pattern - only called once in App.tsx.
 */

import { useState, useCallback } from 'react';
import { ProfileState } from '../types/profileState';

const DEFAULT_PROFILE_STATE: ProfileState = {
  profileName: 'DEFAULTUSER',
  endingsAchieved: []
};

export const useProfileState = () => {
  const [profileState, setProfileState] = useState<ProfileState>(DEFAULT_PROFILE_STATE);

  const setProfileName = useCallback((name: string) => {
    setProfileState(prev => ({
      ...prev,
      profileName: name.trim() || 'DEFAULTUSER' // Never allow blank names
    }));
  }, []);

  const addEndingAchieved = useCallback((endingName: string) => {
    setProfileState(prev => ({
      ...prev,
      endingsAchieved: prev.endingsAchieved.includes(endingName) 
        ? prev.endingsAchieved 
        : [...prev.endingsAchieved, endingName]
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_PROFILE_STATE);
  }, []);

  const encodeProfileState = useCallback((): ProfileState => {
    return {
      profileName: profileState.profileName,
      endingsAchieved: [...profileState.endingsAchieved]
    };
  }, [profileState]);

  const decodeProfileState = useCallback((state: ProfileState): boolean => {
    try {
      // Validate the incoming state
      if (!state || typeof state !== 'object') return false;
      if (typeof state.profileName !== 'string') return false;
      if (!Array.isArray(state.endingsAchieved)) return false;
      if (!state.endingsAchieved.every(ending => typeof ending === 'string')) return false;

      setProfileState({
        profileName: state.profileName.trim() || 'DEFAULTUSER',
        endingsAchieved: [...state.endingsAchieved]
      });
      return true;
    } catch (error) {
      console.error('Failed to decode profile state:', error);
      return false;
    }
  }, []);

  return {
    profileState,
    setProfileName,
    addEndingAchieved,
    resetProfile,
    encodeProfileState,
    decodeProfileState
  };
};
