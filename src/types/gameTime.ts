export interface GameTime {
  annumReckoning: number;  // Year
  ledgerCycle: number;     // Month (1-20)
  grind: number;           // Day (1-8)
  tithe: number;           // Period (1-4)
  age: number;             // Player age
}

export interface GameTimeState {
  currentTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;      // Timestamp of last update
}

export const getTitheName = (tithe: number): string => {
  const titheNames = ['1st Tithe', '2nd Tithe', '3rd Tithe', '4th Tithe'];
  return titheNames[tithe - 1] || 'Unknown Tithe';
};

export const getLedgerCycleName = (cycle: number): string => {
  return cycle.toString().padStart(2, '0');
}; 
 