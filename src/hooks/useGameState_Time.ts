import { useState, useEffect, useRef } from 'react';
import { GameTime } from '../types/gameState';
import { advanceGameTime } from '../utils/gameStateUtils';

interface GameTimeState {
  currentTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;
}

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

export const useGameState_Time = () => {
  const [gameTimeState, setGameTimeState] = useState<GameTimeState>(initialGameTimeState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const advanceTime = () => {
    console.log('ADVANCING TIME');

    setGameTimeState(prev => {
      const newTime = { ...prev.currentTime };
      newTime.grind++; // Increment grind first
      
      const advancedTime = advanceGameTime(newTime);
      
      return {
        ...prev,
        currentTime: advancedTime,
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