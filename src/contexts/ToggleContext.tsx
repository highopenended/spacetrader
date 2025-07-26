import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { InstalledApp } from '../types/scrAppListState';
import { GameMode } from '../types/gameState';

interface ToggleStates {
  dateReadoutEnabled: boolean;
  jobTitleReadoutEnabled: boolean;
  workButtonReadoutEnabled: boolean;
  // Future toggles can be added here
}

interface ToggleContextType {
  toggleStates: ToggleStates;
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;
  initializeFromApps: (installedApps: InstalledApp[]) => void;
  // Work mode state and functions
  gameMode: GameMode;
  beginWorkSession: () => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

interface ToggleProviderProps {
  children: ReactNode;
  installedApps?: InstalledApp[];
  // Work mode props from useGameState
  gameMode: GameMode;
  onBeginWorkSession: () => void;
}

export const ToggleProvider: React.FC<ToggleProviderProps> = ({ 
  children, 
  installedApps = [],
  gameMode,
  onBeginWorkSession
}) => {
  const [toggleStates, setToggleStates] = useState<ToggleStates>({
    dateReadoutEnabled: false,
    jobTitleReadoutEnabled: false,
    workButtonReadoutEnabled: true,
  });

  const setToggleState = (key: keyof ToggleStates, value: boolean) => {
    setToggleStates(prev => ({ ...prev, [key]: value }));
  };

  const initializeFromApps = (apps: InstalledApp[]) => {
    const initialToggles: ToggleStates = {
      dateReadoutEnabled: false,
      jobTitleReadoutEnabled: false,
      workButtonReadoutEnabled: true,
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
      beginWorkSession: onBeginWorkSession
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