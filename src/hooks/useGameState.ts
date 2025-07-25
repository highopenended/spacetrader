/**
 * Unified Game State Hook
 * 
 * Single source of truth for all game state management.
 * Combines credits, time, phases, and app list into one cohesive state.
 * Handles cross-cutting concerns like monthly cost deductions automatically.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { GameTime, GamePhase, GameMode } from '../types/gameState';
import { advanceGameTime, getNextGamePhase } from '../utils/gameStateUtils';
import { INITIAL_GAME_STATE } from '../constants/gameConstants';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { AppDefinition, InstalledApp } from '../types/scrAppListState';

interface GameState {
  // Core game data
  credits: number;
  gamePhase: GamePhase;
  gameTime: GameTime;
  isPaused: boolean;
  lastUpdate: number;
  
  // App management
  installedApps: InstalledApp[];
  
  // Work mode state
  gameMode: GameMode;
}

const initialGameState: GameState = {
  credits: INITIAL_GAME_STATE.credits,
  gamePhase: INITIAL_GAME_STATE.gamePhase,
  gameTime: INITIAL_GAME_STATE.gameTime,
  isPaused: INITIAL_GAME_STATE.isPaused,
  lastUpdate: INITIAL_GAME_STATE.lastUpdate,
  installedApps: INITIAL_GAME_STATE.installedApps,
  gameMode: INITIAL_GAME_STATE.gameMode
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workSessionRef = useRef<NodeJS.Timeout | null>(null);

  // ===== CREDITS MANAGEMENT =====
  const updateCredits = useCallback((amount: number) => {
    setGameState(prev => ({ ...prev, credits: prev.credits + amount }));
  }, []);

  const setCredits = useCallback((amount: number) => {
    setGameState(prev => ({ ...prev, credits: amount }));
  }, []);

  // ===== WORK MODE MANAGEMENT =====
  const beginWorkSession = useCallback(() => {
    setGameState(prev => ({ ...prev, gameMode: 'workMode' }));
    
    // 5 second timer for testing
    workSessionRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, gameMode: 'freeMode' }));
      workSessionRef.current = null;
    }, 30000);
  }, []);

  // ===== PHASE MANAGEMENT =====
  const setGamePhase = useCallback((phase: GamePhase) => {
    setGameState(prev => ({ ...prev, gamePhase: phase }));
  }, []);

  const advanceGamePhase = useCallback(() => {
    setGameState(prev => {
      const nextPhase = getNextGamePhase(prev.gamePhase);
      return nextPhase ? { ...prev, gamePhase: nextPhase } : prev;
    });
  }, []);

  // ===== TIME MANAGEMENT =====
  const advanceTime = useCallback(() => {
    setGameState(prev => {
      const newTime = { ...prev.gameTime };
      newTime.grind++; // Increment grind first
      
      const advancedTime = advanceGameTime(newTime);
      
      // Check if ledger cycle advanced (new month) - handle monthly costs
      let newCredits = prev.credits;
      if (advancedTime.ledgerCycle !== prev.gameTime.ledgerCycle) {
        const monthlyCost = prev.installedApps.reduce((total, app) => {
          const appDefinition = APP_REGISTRY[app.id];
          if (appDefinition && appDefinition.tiers) {
            const tierData = appDefinition.tiers.find(tier => tier.tier === app.currentTier);
            return total + (tierData?.monthlyCost || 0);
          }
          return total;
        }, 0);
        newCredits -= monthlyCost;
      }
      
      return {
        ...prev,
        gameTime: advancedTime,
        credits: newCredits,
        lastUpdate: Date.now()
      };
    });
  }, []);

  const pauseTime = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeTime = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const setGameTime = useCallback((newTime: GameTime) => {
    setGameState(prev => ({
      ...prev,
      gameTime: newTime,
      lastUpdate: Date.now()
    }));
  }, []);

  // ===== APP MANAGEMENT =====

  const installApp = useCallback((appId: string, position?: number) => {
    setGameState(prev => {
      if (prev.installedApps.some(app => app.id === appId)) return prev; // Already installed
      if (!APP_REGISTRY[appId]) return prev; // App doesn't exist

      const newApp: InstalledApp = {
        id: appId,
        order: position ?? prev.installedApps.length + 1,
        purchased: true,
        installedAt: Date.now(),
        currentTier: 1
      };

      if (position !== undefined) {
        // Insert at specific position and reorder
        const newList = [...prev.installedApps, newApp].sort((a, b) => a.order - b.order);
        return {
          ...prev,
          installedApps: newList.map((app, index) => ({
            ...app,
            order: index + 1
          }))
        };
      } else {
        return {
          ...prev,
          installedApps: [...prev.installedApps, newApp]
        };
      }
    });
  }, []);

  const uninstallApp = useCallback((appId: string) => {
    setGameState(prev => {
      const appDefinition = APP_REGISTRY[appId];
      if (!appDefinition || !appDefinition.deletable) return prev;
      
      const filtered = prev.installedApps.filter(app => app.id !== appId);
      return {
        ...prev,
        installedApps: filtered.map((app, index) => ({
          ...app,
          order: index + 1
        }))
      };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      installedApps: INITIAL_GAME_STATE.installedApps
    }));
  }, []);

  const changeAppTier = useCallback((appId: string, newTier: number) => {
    setGameState(prev => ({
      ...prev,
      installedApps: prev.installedApps.map(app => 
        app.id === appId 
          ? { ...app, currentTier: newTier }
          : app
      )
    }));
  }, []);

  // ===== COMPUTED VALUES =====
  const appOrder = gameState.installedApps
    .sort((a, b) => a.order - b.order)
    .map(app => app.id);

  const apps: (AppDefinition & InstalledApp)[] = gameState.installedApps
    .sort((a, b) => a.order - b.order)
    .map(installedApp => ({
      ...APP_REGISTRY[installedApp.id],
      ...installedApp
    }));

  const getAvailableApps = useCallback((): AppDefinition[] => {
    const installedIds = gameState.installedApps.map(app => app.id);
    return Object.values(APP_REGISTRY).filter(
      app => !installedIds.includes(app.id)
    );
  }, [gameState.installedApps]);

  const getAppTierData = useCallback((appId: string) => {
    const appDefinition = APP_REGISTRY[appId];
    const installedApp = gameState.installedApps.find(app => app.id === appId);
    return {
      tiers: appDefinition?.tiers || [],
      currentTier: installedApp?.currentTier || 1
    };
  }, [gameState.installedApps]);

  const reorderApps = useCallback((newApps: InstalledApp[]) => {
    setGameState(prev => ({
      ...prev,
      installedApps: newApps
    }));
  }, []);

  // ===== TIME INTERVAL MANAGEMENT =====
  useEffect(() => {
    if (!gameState.isPaused) {
      intervalRef.current = setInterval(advanceTime, 1000);
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
  }, [gameState.isPaused, advanceTime]);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (workSessionRef.current) {
        clearTimeout(workSessionRef.current);
      }
    };
  }, []);

  // ===== RESET FUNCTION =====
  const resetGame = useCallback(() => {
    setGameState(initialGameState);
  }, []);

  return {
    // State
    gameState,
    
    // Credits
    credits: gameState.credits,
    updateCredits,
    setCredits,
    
    // Phases
    gamePhase: gameState.gamePhase,
    setGamePhase,
    advanceGamePhase,
    
    // Time
    gameTime: gameState.gameTime,
    isPaused: gameState.isPaused,
    pauseTime,
    resumeTime,
    setGameTime,
    
    // Work Mode
    gameMode: gameState.gameMode,
    beginWorkSession,
    
    // Apps
    apps,
    appOrder,
    installedApps: gameState.installedApps,
    installApp,
    uninstallApp,
    reorderApps,
    resetToDefaults,
    getAvailableApps,
    changeAppTier,
    getAppTierData,
    
    // Global
    resetGame
  };
}; 