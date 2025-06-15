import { GamePhase, GAME_PHASES, GameTime } from '../types/gameState';

export const getTitheName = (tithe: number): string => {
  const titheNames = ['1st Tithe', '2nd Tithe', '3rd Tithe', '4th Tithe'];
  return titheNames[tithe - 1] || 'Unknown Tithe';
};

export const getLedgerCycleName = (cycle: number): string => {
  return cycle.toString().padStart(2, '0');
};

export const getAnnumReckoningName = (annum: number): string => {
  return annum.toString();
};

export const getGrindName = (grind: number): string => {
  return grind.toString();
};

export const getNextGamePhase = (currentPhase: GamePhase): GamePhase | null => {
  const currentId = GAME_PHASES[currentPhase].id;
  const nextPhase = Object.entries(GAME_PHASES).find(
    ([_, phaseData]) => phaseData.id === currentId + 1
  );
  return nextPhase ? (nextPhase[0] as GamePhase) : null;
};

export const calculateTithe = (ledgerCycle: number): number => {
  if (ledgerCycle >= 1 && ledgerCycle <= 5) return 1;
  if (ledgerCycle >= 6 && ledgerCycle <= 10) return 2;
  if (ledgerCycle >= 11 && ledgerCycle <= 15) return 3;
  if (ledgerCycle >= 16 && ledgerCycle <= 20) return 4;
  return 1; // fallback
};

export const advanceGameTime = (currentTime: GameTime): GameTime => {
  const newTime = { ...currentTime };
  
  // Handle grind rollover
  if (newTime.grind > 8) {
    newTime.grind = 1;
    newTime.ledgerCycle++;
    
    // Handle ledger cycle rollover
    if (newTime.ledgerCycle > 20) {
      newTime.ledgerCycle = 1;
      newTime.annumReckoning++;
      newTime.age++;
    }
  }
  
  // Recalculate tithe based on current ledger cycle
  newTime.tithe = calculateTithe(newTime.ledgerCycle);
  
  return newTime;
}; 