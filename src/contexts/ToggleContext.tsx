import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToggleStates {
  dateReadoutEnabled: boolean;
  // Future toggles can be added here
}

interface ToggleContextType {
  toggleStates: ToggleStates;
  updateToggle: (key: keyof ToggleStates, value: boolean) => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

interface ToggleProviderProps {
  children: ReactNode;
}

export const ToggleProvider: React.FC<ToggleProviderProps> = ({ children }) => {
  const [toggleStates, setToggleStates] = useState<ToggleStates>({
    dateReadoutEnabled: false,
  });

  const updateToggle = (key: keyof ToggleStates, value: boolean) => {
    setToggleStates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <ToggleContext.Provider value={{ toggleStates, updateToggle }}>
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