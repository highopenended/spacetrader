/**
 * Toggle State Hook
 * 
 * Simple state holder for DataReadout visibility controls.
 * Follows single instance pattern - called only in App.tsx.
 * Provides toggle states and setters for window components to use.
 */

import { useState, useCallback } from 'react';
import { ToggleStates } from '../types/toggleState';

const initialToggleStates: ToggleStates = {
  readoutEnabled_Date: true,
  readoutEnabled_JobTitle: true,
  readoutEnabled_WorkButton: true,
  readoutEnabled_Credits: true,
};

export const useToggleState = () => {
  const [toggleStates, setToggleStates] = useState<ToggleStates>(initialToggleStates);

  const setToggleState = useCallback((key: keyof ToggleStates, value: boolean) => {
    setToggleStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // ===== RESET FUNCTION =====
  const resetToggleState = useCallback(() => {
    setToggleStates(initialToggleStates);
  }, []);

  // ===== SAVE/LOAD FUNCTIONS =====
  const encodeToggleState = useCallback(() => {
    return {
      toggleStates
    };
  }, [toggleStates]);

  const decodeToggleState = useCallback((encodedState: any) => {
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
      setToggleStates(encodedState.toggleStates);
      return true;
    } catch (error) {
      console.error('Failed to decode toggle state:', error);
      return false;
    }
  }, []);

  return {
    toggleStates,
    setToggleState,
    resetToggleState,
    encodeToggleState,
    decodeToggleState
  };
}; 