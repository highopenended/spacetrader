import { useState, useEffect, useRef } from 'react';
import { GameTime, GameTimeState } from '../types/gameTime';

const initialGameTime: GameTime = {
  annumReckoning: 242,
  ledgerCycle: 8,
  grind: 1,
  tithe: 2,
  age: 18
};

const initialGameTimeState: GameTimeState = {
  currentTime: initialGameTime,
  isPaused: false,
  lastUpdate: Date.now()
};

export const useGameTime = () => {
  const [gameTimeState, setGameTimeState] = useState<GameTimeState>(initialGameTimeState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const advanceTime = () => {
    setGameTimeState(prev => {
      const newTime = { ...prev.currentTime };
      
      // Advance grind (day)
      newTime.grind++;
      
      // Check if we need to advance ledger cycle
      if (newTime.grind > 8) {
        newTime.grind = 1;
        newTime.ledgerCycle++;
        
        // Check if we need to advance tithe
        if (newTime.ledgerCycle > 20) {
          newTime.ledgerCycle = 1;
          newTime.tithe++;
          
          // Check if we need to advance annum reckoning
          if (newTime.tithe > 4) {
            newTime.tithe = 1;
            newTime.annumReckoning++;
            newTime.age++;
          }
        }
      }
      
      return {
        ...prev,
        currentTime: newTime,
        lastUpdate: Date.now()
      };
    });
  };

  const pauseTime = () => {
    setGameTimeState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeTime = () => {
    setGameTimeState(prev => ({ ...prev, isPaused: false }));
  };

  const setGameTime = (newTime: GameTime) => {
    setGameTimeState(prev => ({
      ...prev,
      currentTime: newTime,
      lastUpdate: Date.now()
    }));
  };

  useEffect(() => {
    if (!gameTimeState.isPaused) {
      // Advance time every 5 seconds (adjust as needed for game balance)
      intervalRef.current = setInterval(advanceTime, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameTimeState.isPaused]);

  return {
    gameTime: gameTimeState.currentTime,
    isPaused: gameTimeState.isPaused,
    pauseTime,
    resumeTime,
    setGameTime
  };
}; 