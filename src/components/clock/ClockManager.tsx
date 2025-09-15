/**
 * ClockManager Component
 * 
 * Invisible component that manages the global game clock.
 * Automatically starts the clock when mounted and stops it when unmounted.
 * This component should be placed near the root of the React tree.
 * 
 * Key Responsibilities:
 * - Start/stop the global clock loop
 * - Integrate with game pause state
 * - Handle cleanup on unmount
 * - Sync with existing game timing systems
 */

import React, { useEffect } from 'react';
import { useClockStore } from '../../stores';

interface ClockManagerProps {
  /** Optional: Start the clock paused */
  startPaused?: boolean;
  
  /** Optional: Initial time scale */
  initialTimeScale?: number;
}

const ClockManager: React.FC<ClockManagerProps> = ({ 
  startPaused = false, 
  initialTimeScale = 1.0 
}) => {
  // Clock store actions
  const startClock = useClockStore(state => state.startClock);
  const stopClock = useClockStore(state => state.stopClock);
  const pauseClock = useClockStore(state => state.pauseClock);
  const resumeClock = useClockStore(state => state.resumeClock);
  const setTimeScale = useClockStore(state => state.setTimeScale);
  const resetClock = useClockStore(state => state.resetClock);
  
  // Clock state for initialization
  const currentTimeScale = useClockStore(state => state.timeScale);

  // Initialize clock on mount
  useEffect(() => {
    // Set initial time scale
    if (initialTimeScale !== currentTimeScale) {
      setTimeScale(initialTimeScale);
    }
    
    // Start the clock
    startClock();
    
    // Set initial pause state
    if (startPaused) {
      pauseClock();
    } else {
      resumeClock();
    }
    
    // Cleanup on unmount
    return () => {
      stopClock();
      resetClock();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount - intentionally ignoring deps for initialization


  // This component renders nothing - it's purely for side effects
  return null;
};

export default ClockManager;
