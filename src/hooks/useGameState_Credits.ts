import { useState } from 'react';

export const useGameState_Credits = () => {
  const [credits, setCreditsState] = useState<number>(0);

  const updateCredits = (amount: number) => {
    setCreditsState(prev => prev + amount);
  };

  const setCredits = (amount: number) => {
    setCreditsState(amount);
  };

  return {
    credits,
    updateCredits,
    setCredits
  };
}; 