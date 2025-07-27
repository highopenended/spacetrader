/**
 * ToggleContext
 * 
 * Manages toggle states for various UI elements and provides work mode functionality.
 * Used by DataReadout and window components to control visibility of readout elements.
 * 
 * STATE FLOW ARCHITECTURE:
 * 
 * All game state flows through a single path to prevent synchronization issues:
 * 
 * 1. useGameState() → App.tsx → ToggleProvider → DataReadout
 * 2. useGameState() → App.tsx → Window Components (via props)
 * 
 * This ensures DataReadout and all window components use the same source of truth.
 * 
 * IMPORTANT: DataReadout is wrapped inside ToggleProvider, so it must get game state
 * through the context rather than calling useGameState() directly. This prevents
 * the "two instances of state" problem where DataReadout and app components show
 * different values for the same data.
 * 
 * CRITICAL PATTERN:
 * - Window components: Get state via props from App.tsx renderWindow()
 * - DataReadout: Get state via useToggleContext() (which gets it from App.tsx)
 * - NEVER call useGameState() directly in DataReadout or window components
 * - This ensures single source of truth and prevents state synchronization issues
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { InstalledApp } from '../types/scrAppListState';
import { GameMode } from '../types/gameState';

interface ToggleStates {
  dateReadoutEnabled: boolean;
  jobTitleReadoutEnabled: boolean;
  workButtonReadoutEnabled: boolean;
  creditsReadoutEnabled: boolean;
  // Future toggles can be added here
}

interface ToggleContextType {
  toggleStates: ToggleStates;
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;
  initializeFromApps: (installedApps: InstalledApp[]) => void;
  // Work mode state and functions
  gameMode: GameMode;
  beginWorkSession: () => void;
  // Game state for DataReadout
  credits: number;
  gameTime: any;
  gamePhase: any;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

interface ToggleProviderProps {
  children: ReactNode;
  installedApps?: InstalledApp[];
  // Work mode props from useGameState
  gameMode: GameMode;
  onBeginWorkSession: () => void;
  // Game state for DataReadout
  credits: number;
  gameTime: any;
  gamePhase: any;
}

export const ToggleProvider: React.FC<ToggleProviderProps> = ({ 
  children, 
  installedApps = [],
  gameMode,
  onBeginWorkSession,
  credits,
  gameTime,
  gamePhase
}) => {
  const [toggleStates, setToggleStates] = useState<ToggleStates>({
    dateReadoutEnabled: false,
    jobTitleReadoutEnabled: false,
    workButtonReadoutEnabled: true,
    creditsReadoutEnabled: false,
  });

  const setToggleState = (key: keyof ToggleStates, value: boolean) => {
    setToggleStates(prev => ({ ...prev, [key]: value }));
  };

  const initializeFromApps = (apps: InstalledApp[]) => {
    const initialToggles: ToggleStates = {
      dateReadoutEnabled: false,
      jobTitleReadoutEnabled: false,
      workButtonReadoutEnabled: true,
      creditsReadoutEnabled: false,
    };

    apps.forEach(app => {
      const appDef = APP_REGISTRY[app.id];
      if (appDef?.defaultToggles) {
        Object.assign(initialToggles, appDef.defaultToggles);
      }
    });

    setToggleStates(initialToggles);
  };

  // Initialize toggles only once when component mounts
  useEffect(() => {
    initializeFromApps(installedApps);
  }, []); // Empty dependency array - only run once

  return (
    <ToggleContext.Provider value={{ 
      toggleStates, 
      setToggleState, 
      initializeFromApps,
      gameMode,
      beginWorkSession: onBeginWorkSession,
      credits,
      gameTime,
      gamePhase
    }}>
      {children}
    </ToggleContext.Provider>
  );
};

export const useToggleContext = () => {
  const context = useContext(ToggleContext);
  if (context === undefined) {
    throw new Error('useToggleContext must be used within a ToggleProvider');
  }
  return context;
}; 