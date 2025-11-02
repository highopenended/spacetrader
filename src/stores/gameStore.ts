/**
 * Game State Store (Zustand)
 * 
 * Unified game state management using Zustand.
 * Combines credits, time, phases, and app list into one cohesive store.
 * Handles cross-cutting concerns like monthly cost deductions automatically.
 * 
 * Zustand store for game state management, eliminating prop drilling and improving performance.
 */

import { create } from 'zustand';
import { GameTime, GamePhase, GameMode, PlayerState } from '../types/gameState';
import { advanceGameTime, getNextGamePhase } from '../utils/gameStateUtils';
import { INITIAL_GAME_STATE } from '../constants/gameConstants';
import { APP_REGISTRY } from '../constants/appListConstants';
import { AppDefinition, InstalledApp } from '../types/appListState';
import { useScrapStore } from './scrapStore';

interface GameState {
  // Core game data
  credits: number;
  gamePhase: GamePhase;
  gameTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;
  
  // Player state
  playerState: PlayerState;
  
  // App management
  installedApps: InstalledApp[];
  
  // Work mode state
  gameMode: GameMode;
  workSessionStartTime: number; // Scaled time when work session began (0 = not in session)
  workSessionDuration: number; // Duration in milliseconds (30000 = 30 seconds)
  
  // Background state
  gameBackground: string;

  // Computed values (derived state)
  apps: (AppDefinition & InstalledApp)[];
  appOrder: string[];
}

interface GameActions {
  // ===== CREDITS MANAGEMENT =====
  updateCredits: (amount: number) => void;
  setCredits: (amount: number) => void;

  // ===== WORK MODE MANAGEMENT =====
  beginWorkSession: () => void;
  endWorkSession: () => void;
  updateWorkSessionTime: (scaledTime: number) => void;

  // ===== PHASE MANAGEMENT =====
  setGamePhase: (phase: GamePhase) => void;
  advanceGamePhase: () => void;

  // ===== BACKGROUND MANAGEMENT =====
  setGameBackground: (backgroundId: string) => void;

  // ===== TIME MANAGEMENT =====
  advanceTime: () => void;
  pauseTime: () => void;
  resumeTime: () => void;
  setGameTime: (newTime: GameTime) => void;

  // ===== APP MANAGEMENT =====
  installApp: (appId: string, position?: number) => void;
  uninstallApp: (appId: string) => void;
  reorderApps: (newApps: InstalledApp[]) => void;
  installAppOrder: (order: string[]) => void;
  resetToDefaults: () => void;
  getAvailableApps: () => AppDefinition[];

  // ===== PLAYER STATE MANAGEMENT =====
  setManipulatorStrength: (strength: number) => void;
  setManipulatorMaxLoad: (maxLoad: number) => void;

  // ===== COMPUTED VALUE UPDATES =====
  updateComputedValues: () => void;

  // ===== SAVE/LOAD =====
  encodeGameState: () => any;
  decodeGameState: (encodedState: any) => boolean;

  // ===== GLOBAL =====
  resetGameState: () => void;
}

type GameStore = GameState & GameActions;

const initialGameState: GameState = {
  credits: INITIAL_GAME_STATE.credits,
  gamePhase: INITIAL_GAME_STATE.gamePhase,
  gameTime: INITIAL_GAME_STATE.gameTime,
  isPaused: INITIAL_GAME_STATE.isPaused,
  lastUpdate: INITIAL_GAME_STATE.lastUpdate,
  playerState: INITIAL_GAME_STATE.playerState,
  installedApps: INITIAL_GAME_STATE.installedApps,
  gameMode: INITIAL_GAME_STATE.gameMode,
  workSessionStartTime: 0,
  workSessionDuration: 30000, // 30 seconds
  gameBackground: 'default',
  
  // Computed values - will be updated by updateComputedValues
  apps: [],
  appOrder: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState,

  // ===== CREDITS MANAGEMENT =====
  updateCredits: (amount: number) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  setCredits: (amount: number) => {
    set({ credits: amount });
  },

  // ===== WORK MODE MANAGEMENT =====
  beginWorkSession: () => {
    // Reset scrap store for fresh work session
    useScrapStore.getState().resetScrapState();
    
    set({ 
      gameMode: 'workMode',
      workSessionStartTime: 0 // Will be set by the first clock tick
    });
  },

  endWorkSession: () => {
    // Reset scrap store when work session ends
    useScrapStore.getState().resetScrapState();
    
    set({ 
      gameMode: 'freeMode',
      workSessionStartTime: 0 
    });
  },

  updateWorkSessionTime: (scaledTime: number) => {
    const state = get();
    
    // Only update if we're in work mode
    if (state.gameMode !== 'workMode') return;
    
    // Initialize start time on first update
    if (state.workSessionStartTime === 0) {
      set({ workSessionStartTime: scaledTime });
      return;
    }
    
    // Check if session duration has elapsed
    const elapsedTime = scaledTime - state.workSessionStartTime;
    if (elapsedTime >= state.workSessionDuration) {
      get().endWorkSession();
    }
  },

  // ===== PHASE MANAGEMENT =====
  setGamePhase: (phase: GamePhase) => {
    set({ gamePhase: phase });
  },

  advanceGamePhase: () => {
    set((state) => {
      const nextPhase = getNextGamePhase(state.gamePhase);
      return nextPhase ? { gamePhase: nextPhase } : state;
    });
  },

  // ===== BACKGROUND MANAGEMENT =====
  setGameBackground: (backgroundId: string) => {
    set({ gameBackground: backgroundId });
  },

  // ===== TIME MANAGEMENT =====
  advanceTime: () => {
    set((state) => {
      const newTime = { ...state.gameTime };
      newTime.grind++; // Increment grind first
      
      const advancedTime = advanceGameTime(newTime);
      
      // Check if ledger cycle advanced (new month) - handle maintenance costs
      let newCredits = state.credits;
      if (advancedTime.ledgerCycle !== state.gameTime.ledgerCycle) {
        const maintenanceCost = state.installedApps.reduce((total, app) => {
          const appDefinition = APP_REGISTRY[app.id];
          if (appDefinition) {
            return total + (appDefinition.maintenanceCost || 0);
          }
          return total;
        }, 0);
        newCredits -= maintenanceCost;
      }
      
      return {
        gameTime: advancedTime,
        credits: newCredits,
        lastUpdate: Date.now()
      };
    });
  },

  pauseTime: () => {
    set({ isPaused: true });
  },

  resumeTime: () => {
    set({ isPaused: false });
  },

  setGameTime: (newTime: GameTime) => {
    set({
      gameTime: newTime,
      lastUpdate: Date.now()
    });
  },

  // ===== APP MANAGEMENT =====
  installApp: (appId: string, position?: number) => {
    set((state) => {
      if (state.installedApps.some(app => app.id === appId)) return state; // Already installed
      
      const appDefinition = APP_REGISTRY[appId];
      if (!appDefinition) return state; // App doesn't exist

      // Calculate purchase cost using new field
      const purchaseCost = appDefinition.purchaseCost || 0;
      if (state.credits < purchaseCost) return state; // Can't afford

      const newApp: InstalledApp = {
        id: appId,
        order: position ?? state.installedApps.length + 1,
        purchased: true,
        installedAt: Date.now()
      };

      let newInstalledApps: InstalledApp[];
      let newCredits = state.credits - purchaseCost;

      if (position !== undefined) {
        // Insert at specific position and reorder
        const newList = [...state.installedApps, newApp].sort((a, b) => a.order - b.order);
        newInstalledApps = newList.map((app, index) => ({
          ...app,
          order: index + 1
        }));
      } else {
        newInstalledApps = [...state.installedApps, newApp];
      }

      // Update computed values
      const sortedApps = [...newInstalledApps].sort((a, b) => a.order - b.order);
      const newAppOrder = sortedApps.map(app => app.id);
      const newApps = sortedApps.map(installedApp => ({
        ...APP_REGISTRY[installedApp.id],
        ...installedApp
      }));

      return {
        credits: newCredits,
        installedApps: newInstalledApps,
        apps: newApps,
        appOrder: newAppOrder
      };
    });
  },

  uninstallApp: (appId: string) => {
    set((state) => {
      const appDefinition = APP_REGISTRY[appId];
      if (!appDefinition || !appDefinition.deletable) return state;
      
      const filtered = state.installedApps.filter(app => app.id !== appId);
      const reorderedApps = filtered.map((app, index) => ({
        ...app,
        order: index + 1
      }));

      // Update computed values
      const newAppOrder = reorderedApps.map(app => app.id);
      const newApps = reorderedApps.map(installedApp => ({
        ...APP_REGISTRY[installedApp.id],
        ...installedApp
      }));

      return {
        installedApps: reorderedApps,
        apps: newApps,
        appOrder: newAppOrder
      };
    });
  },

  reorderApps: (newApps: InstalledApp[]) => {
    set((state) => {
      // Update computed values
      const sortedApps = [...newApps].sort((a, b) => a.order - b.order);
      const newAppOrder = sortedApps.map(app => app.id);
      const newAppsWithDefinitions = sortedApps.map(installedApp => ({
        ...APP_REGISTRY[installedApp.id],
        ...installedApp
      }));

      return {
        installedApps: newApps,
        apps: newAppsWithDefinitions,
        appOrder: newAppOrder
      };
    });
  },

  installAppOrder: (order: string[]) => {
    const state = get();
    if (order.join(',') !== state.appOrder.join(',')) {
      const newInstalled = order.map((id, idx) => {
        const found = state.apps.find((app: any) => app.id === id);
        if (found) {
          return {
            id: found.id,
            order: idx + 1,
            purchased: true,
            installedAt: found.installedAt || Date.now(),
          };
        }
        return null;
      }).filter(Boolean) as InstalledApp[];
      
      if (newInstalled.length === order.length) {
        get().resetToDefaults();
        newInstalled.forEach((app: any, idx) => {
          if (app) get().installApp(app.id, idx + 1);
        });
      }
    }
  },

  resetToDefaults: () => {
    set((state) => {
      // Update computed values
      const sortedApps = [...INITIAL_GAME_STATE.installedApps].sort((a, b) => a.order - b.order);
      const newAppOrder = sortedApps.map(app => app.id);
      const newApps = sortedApps.map(installedApp => ({
        ...APP_REGISTRY[installedApp.id],
        ...installedApp
      }));

      return {
        installedApps: INITIAL_GAME_STATE.installedApps,
        apps: newApps,
        appOrder: newAppOrder
      };
    });
  },

  getAvailableApps: (): AppDefinition[] => {
    const state = get();
    const installedIds = state.installedApps.map(app => app.id);
    return Object.values(APP_REGISTRY).filter(
      app => !installedIds.includes(app.id)
    );
  },

  // ===== PLAYER STATE MANAGEMENT =====
  setManipulatorStrength: (strength: number) => {
    set(state => ({
      playerState: {
        ...state.playerState,
        manipulatorStrength: Math.max(0, strength)
      }
    }));
  },

  setManipulatorMaxLoad: (maxLoad: number) => {
    set(state => ({
      playerState: {
        ...state.playerState,
        manipulatorMaxLoad: Math.max(0, maxLoad)
      }
    }));
  },

  // ===== COMPUTED VALUE UPDATES =====
  updateComputedValues: () => {
    set((state) => {
      const sortedInstalledApps = [...state.installedApps].sort((a, b) => a.order - b.order);
      const newAppOrder = sortedInstalledApps.map(app => app.id);
      const newApps = sortedInstalledApps.map(installedApp => ({
        ...APP_REGISTRY[installedApp.id],
        ...installedApp
      }));

      return {
        apps: newApps,
        appOrder: newAppOrder
      };
    });
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeGameState: () => {
    const state = get();
    return {
      credits: state.credits,
      gamePhase: state.gamePhase,
      gameTime: state.gameTime,
      isPaused: state.isPaused,
      lastUpdate: state.lastUpdate,
      installedApps: state.installedApps,
      gameMode: state.gameMode,
      workSessionStartTime: state.workSessionStartTime,
      workSessionDuration: state.workSessionDuration,
      gameBackground: state.gameBackground
    };
  },

  decodeGameState: (encodedState: any): boolean => {
    if (!encodedState) return false;
    
    try {
      // Validate required fields
      if (typeof encodedState.credits !== 'number' ||
          typeof encodedState.gamePhase !== 'string' ||
          !encodedState.gameTime ||
          typeof encodedState.isPaused !== 'boolean' ||
          typeof encodedState.lastUpdate !== 'number' ||
          !Array.isArray(encodedState.installedApps) ||
          typeof encodedState.gameMode !== 'string' ||
          typeof encodedState.gameBackground !== 'string') {
        console.error('Invalid game state format');
        return false;
      }

      // Apply the decoded state
      set({
        credits: encodedState.credits,
        gamePhase: encodedState.gamePhase,
        gameTime: encodedState.gameTime,
        isPaused: encodedState.isPaused,
        lastUpdate: encodedState.lastUpdate,
        installedApps: encodedState.installedApps,
        gameMode: encodedState.gameMode,
        workSessionStartTime: encodedState.workSessionStartTime || 0,
        workSessionDuration: encodedState.workSessionDuration || 30000,
        gameBackground: encodedState.gameBackground
      });

      // Update computed values after loading
      get().updateComputedValues();

      return true;
    } catch (error) {
      console.error('Failed to decode game state:', error);
      return false;
    }
  },

  // ===== RESET FUNCTION =====
  resetGameState: () => {
    set({
      ...initialGameState
    });

    // Update computed values after reset
    get().updateComputedValues();
  }
}));

// Initialize computed values on store creation
setTimeout(() => {
  useGameStore.getState().updateComputedValues();
}, 0);
