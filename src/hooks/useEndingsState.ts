/**
 * Endings State Hook
 * 
 * Manages the endings system state.
 * Follows single-instance pattern - only called once in App.tsx.
 */

import { useState, useCallback } from 'react';
import { EndingState, EndingTriggerData, EndingDefinition, ActiveEnding } from '../types/endingState';
import { useProfileStore } from '../stores';

const DEFAULT_ENDING_STATE: EndingState = {
  activeEnding: null
};

export const useEndingsState = () => {
  const [endingState, setEndingState] = useState<EndingState>(DEFAULT_ENDING_STATE);

  /**
   * Check all registered endings to see if any should trigger
   * Currently only supports the recursive purge ending
   */
  const checkForEndingTriggers = useCallback((triggerData: EndingTriggerData, endingsRegistry: Record<string, EndingDefinition>) => {
    // Don't trigger if an ending is already active
    if (endingState.activeEnding) return;

    // Check each ending to see if it should trigger
    for (const ending of Object.values(endingsRegistry)) {
      if (ending.checkTrigger(triggerData)) {
        // Trigger this ending
        const activeEnding: ActiveEnding = {
          ending,
          triggeredAt: Date.now()
        };
        
        setEndingState({ activeEnding });
        useProfileStore.getState().addEndingAchieved(ending.id);
        return; // Only trigger one ending at a time
      }
    }
  }, [endingState.activeEnding]);

  /**
   * Clear the active ending (called when cutscene completes)
   */
  const clearActiveEnding = useCallback(() => {
    setEndingState({ activeEnding: null });
  }, []);

  return {
    endingState,
    checkForEndingTriggers,
    clearActiveEnding
  };
};
