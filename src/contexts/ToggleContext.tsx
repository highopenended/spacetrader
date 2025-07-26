import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { InstalledApp } from '../types/scrAppListState';

interface ToggleStates {
  dateReadoutEnabled: boolean;
  // Future toggles can be added here
}

interface ToggleContextType {
  toggleStates: ToggleStates;
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;
  initializeFromApps: (installedApps: InstalledApp[]) => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

interface ToggleProviderProps {
  children: ReactNode;
  installedApps?: InstalledApp[];
}

export const ToggleProvider: React.FC<ToggleProviderProps> = ({ children, installedApps = [] }) => {
  const [toggleStates, setToggleStates] = useState<ToggleStates>({
    dateReadoutEnabled: false,
  });

  const setToggleState = (key: keyof ToggleStates, value: boolean) => {
    setToggleStates(prev => ({ ...prev, [key]: value }));
  };

  const initializeFromApps = (apps: InstalledApp[]) => {
    const initialToggles: ToggleStates = {
      dateReadoutEnabled: false,
    };

    apps.forEach(app => {
      const appDef = APP_REGISTRY[app.id];
      if (appDef?.defaultToggles) {
        Object.assign(initialToggles, appDef.defaultToggles);
      }
    });

    setToggleStates(initialToggles);
  };

  // Initialize toggles when installedApps changes
  useEffect(() => {
    initializeFromApps(installedApps);
  }, [installedApps]);

  return (
    <ToggleContext.Provider value={{ toggleStates, setToggleState, initializeFromApps }}>
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