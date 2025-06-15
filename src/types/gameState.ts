export interface GameTime {
  annumReckoning: number;  // Year
  ledgerCycle: number;     // Month (1-20)
  grind: number;           // Day (1-8)
  tithe: number;           // Period (1-4, 1 per 5 ledger cycles)
  age: number;             // Player age
}

export type GamePhase = 
  | 'lineRat'
  | 'bayBoss' 
  | 'scrapCaptain'
  | 'fleetBoss'
  | 'subsectorWarden'
  | 'sectorCommodore'
  | 'ledgerPatrician'
  | 'cathedraMinor'
  | 'cathedraDominus'
  | 'cathedraUltima';

export interface GameState {
  gamePhase: GamePhase;
  credits: number;
  currentTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;      // Timestamp of last update
}

export const GAME_PHASES: Record<GamePhase, { id: number; title: string; description: string }> = {
  lineRat: { id: 1, title: 'Line Rat', description: 'Assembly line worker on a scrap ship' },
  bayBoss: { id: 2, title: 'Bay Boss', description: 'In charge of a scrap bay on a ship' },
  scrapCaptain: { id: 3, title: 'Scrap Captain', description: 'In charge of a scrap ship, technically part of the peerage now but only in name' },
  fleetBoss: { id: 4, title: 'Fleet Boss', description: 'In charge of multiple scrap ships' },
  subsectorWarden: { id: 5, title: 'Subsector Warden', description: 'In charge of the scrap ships of an entire subsystem' },
  sectorCommodore: { id: 6, title: 'Sector Commodore', description: 'In charge of an entire system, part of the high peerage now' },
  ledgerPatrician: { id: 7, title: 'Ledger Patrician', description: 'Part of a council that manages the merchant family finances like a board of directors' },
  cathedraMinor: { id: 8, title: 'Cathedra Minor', description: 'Married into the merchant family, royalty now but the lowest level, have to grovel for patronage and spend tons of credits on gifts for your betters' },
  cathedraDominus: { id: 9, title: 'Cathedra Dominus', description: 'Finally gaining some real control and power' },
  cathedraUltima: { id: 10, title: 'Cathedra Ultima', description: 'The merchant lord of the entire family' }
}; 