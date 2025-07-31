/**
 * Window Manager Context
 * 
 * Provides window management functionality through React context.
 * Handles window positioning, sizing, closing, and z-index management.
 * Used by window components and the window registry system.
 */

import React, { createContext, useContext, ReactNode } from 'react';

// Interface for window manager context passed to window renderers
export interface WindowManagerContext {
  closeWindow: (windowId: string) => void;
  updateWindowPosition: (appType: string, position: { x: number; y: number }) => void;
  updateWindowSize: (appType: string, size: { width: number; height: number }) => void;
  bringToFront: (windowId: string) => void;
}

// Create the context
const WindowManagerContext = createContext<WindowManagerContext | null>(null);

// Provider component props
interface WindowManagerProviderProps {
  children: ReactNode;
  value: WindowManagerContext;
}

// Provider component
export const WindowManagerProvider: React.FC<WindowManagerProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
};

// Hook to use the window manager context
export const useWindowManagerContext = (): WindowManagerContext => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManagerContext must be used within a WindowManagerProvider');
  }
  return context;
}; 