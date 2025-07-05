/**
 * Window Manager Hook
 * 
 * Custom hook that manages window state, positions, and sizes.
 * Provides functions to open, close, and update windows.
 * 
 * Used by: App.tsx and potentially other components that need window management
 */

import React, { useState } from 'react';
import { WindowData } from '../types/gameState';
import { WINDOW_DEFAULTS } from '../constants/windowConstants';

export const useWindowManager = () => {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [lastWindowPositions, setLastWindowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [lastWindowSizes, setLastWindowSizes] = useState<Record<string, { width: number; height: number }>>({});

  const updateWindowPosition = (appType: string, position: { x: number; y: number }) => {
    setLastWindowPositions(prev => ({
      ...prev,
      [appType]: position
    }));
  };

  const updateWindowSize = (appType: string, size: { width: number; height: number }) => {
    setLastWindowSizes(prev => ({
      ...prev,
      [appType]: size
    }));
  };

  const openOrCloseWindow = (appType: string, title: string, content?: React.ReactNode) => {
    const defaultContent = React.createElement('div', {}, 'No Data Available');
    const windowContent = content || defaultContent;
    
    // Check if a window for this app type already exists
    const existingWindowIndex = windows.findIndex(window => window.appType === appType);
    
    if (existingWindowIndex !== -1) {
      // Window exists, close it
      setWindows(prev => prev.filter(window => window.appType !== appType));
    } else {
      // Window doesn't exist, open it
      // Use last known position or default with offset
      const lastPosition = lastWindowPositions[appType];
      const defaultPosition = { 
        x: WINDOW_DEFAULTS.POSITION.x + (windows.length * WINDOW_DEFAULTS.POSITION_OFFSET), 
        y: WINDOW_DEFAULTS.POSITION.y + (windows.length * WINDOW_DEFAULTS.POSITION_OFFSET) 
      };
      
      // Use last known size or default
      const lastSize = lastWindowSizes[appType];
      const defaultSize = WINDOW_DEFAULTS.SIZE;
      
      const newWindow: WindowData = {
        id: `window-${appType}-${Date.now()}`,
        appType,
        title,
        content: windowContent,
        position: lastPosition || defaultPosition,
        size: lastSize || defaultSize
      };
      setWindows(prev => [...prev, newWindow]);
    }
  };

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(window => window.id !== windowId));
  };

  // Close all windows for a given appType
  const closeWindowsByAppType = (appType: string) => {
    setWindows(prev => prev.filter(window => window.appType !== appType));
  };

  return {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    closeWindow,
    closeWindowsByAppType,
  };
}; 