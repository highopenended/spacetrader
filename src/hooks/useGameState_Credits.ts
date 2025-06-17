import { useState } from 'react';
import { INITIAL_CREDITS } from '../constants/gameConstants';

export const useGameState_Credits = () => {
  const [credits, setCreditsState] = useState<number>(INITIAL_CREDITS);

  const updateCredits = (amount: number) => {
    setCreditsState(prev => prev + amount);
  };

  const setCredits = (amount: number) => {
    setCreditsState(amount);
  };

  const resetCredits = () => {
    setCreditsState(INITIAL_CREDITS);
  };

  return {
    credits,
    updateCredits,
    setCredits,
    resetCredits
  };
}; 