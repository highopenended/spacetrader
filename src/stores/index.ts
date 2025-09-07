/**
 * Store Index
 * 
 * Central export file for all Zustand stores.
 * Import stores from here to maintain consistency.
 */

export { useGameStore } from './gameStore';
export { useUpgradesStore } from './upgradesStore';

// Future stores can be exported here as they're migrated:
// export { useWindowStore } from './windowStore';
// export { useToggleStore } from './toggleStore';
// export { useQuickBarStore } from './quickBarStore';
// export { useProfileStore } from './profileStore';
// export { useEndingsStore } from './endingsStore';
