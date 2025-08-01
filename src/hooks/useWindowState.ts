/**
 * Window Manager Hook
 * 
 * Custom hook that manages window state, positions, and sizes.
 * Provides functions to open, close, and update windows.
 * Automatically repositions windows when viewport resizes.
 * 
 * Used by: App.tsx and potentially other components that need window management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WindowData } from '../types/windowState';
import { WINDOW_DEFAULTS, APP_WINDOW_DEFAULTS } from '../constants/windowConstants';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { clampPositionToBounds, getViewportBounds } from '../utils/viewportConstraints';

export const useWindowState = () => {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [lastWindowPositions, setLastWindowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [lastWindowSizes, setLastWindowSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [nextZIndex, setNextZIndex] = useState(1000); // Start at 1000, increment for each new window

  // Monitor viewport changes and reposition windows
  useEffect(() => {
    const handleViewportResize = () => {
      setWindows(prevWindows => 
        prevWindows.map(window => {
          // Constrain each window to new viewport bounds
          const constrainedPosition = clampPositionToBounds(
            window.position, 
            window.size, 
            20 // Default footer height - could be made dynamic
          );
          
          // Only update if position actually changed
          if (constrainedPosition.x !== window.position.x || constrainedPosition.y !== window.position.y) {
            // Update the last known position too
            setLastWindowPositions(prev => ({
              ...prev,
              [window.appType]: constrainedPosition
            }));
            
            return {
              ...window,
              position: constrainedPosition
            };
          }
          
          return window;
        })
      );
    };

    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, []);

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

  const syncWindowLayout = (appType: string, title: string, content?: React.ReactNode, savedPosition?: { x: number; y: number }, savedSize?: { width: number; height: number }) => {
    const defaultContent = React.createElement('div', {}, 'No Data Available');
    const windowContent = content || defaultContent;
    
    // Use saved position/size if provided, otherwise use last known or defaults
    const lastPosition = savedPosition || lastWindowPositions[appType];
    const defaultPosition = { 
      x: WINDOW_DEFAULTS.POSITION.x + (windows.length * WINDOW_DEFAULTS.POSITION_OFFSET), 
      y: WINDOW_DEFAULTS.POSITION.y + (windows.length * WINDOW_DEFAULTS.POSITION_OFFSET) 
    };
    
    const lastSize = savedSize || lastWindowSizes[appType];
    const defaultSize = APP_WINDOW_DEFAULTS[appType] || WINDOW_DEFAULTS.SIZE;
    
    const newWindow: WindowData = {
      id: `window-${appType}-${Date.now()}`,
      appType,
      title,
      content: windowContent,
      position: lastPosition || defaultPosition,
      size: lastSize || defaultSize,
      zIndex: nextZIndex
    };
    setNextZIndex(prev => prev + 1); // Increment for next window
    setWindows(prev => [...prev, newWindow]);
  };

  const openOrCloseWindow = (appType: string, title: string, content?: React.ReactNode) => {
    // Check if a window for this app type already exists
    const existingWindowIndex = windows.findIndex(window => window.appType === appType);
    
    if (existingWindowIndex !== -1) {
      // Window exists, close it
      setWindows(prev => prev.filter(window => window.appType !== appType));
    } else {
      // Window doesn't exist, open it using syncWindowLayout
      syncWindowLayout(appType, title, content);
    }
  };

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(window => window.id !== windowId));
  };

  // Close all windows for a given appType
  const closeWindowsByAppType = (appType: string) => {
    setWindows(prev => prev.filter(window => window.appType !== appType));
  };

  // Bring a window to front (highest z-index)
  const bringToFront = (windowId: string) => {
    setWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, zIndex: nextZIndex }
          : window
      )
    );
    setNextZIndex(prev => prev + 1);
  };

  const dockAllWindows = () => {
    // Close all windows (dock them back to terminal)
    setWindows([]);
  };

  // ===== RESET FUNCTION =====
  const resetWindowState = useCallback(() => {
    // Close all windows
    setWindows([]);
    // Reset position and size tracking
    setLastWindowPositions({});
    setLastWindowSizes({});
    // Reset z-index counter
    setNextZIndex(1000);
  }, []);

  // ===== SAVE/LOAD FUNCTIONS =====
  const encodeWindowState = () => {
    return {
      lastWindowPositions,
      lastWindowSizes,
      nextZIndex,
      openWindowTypes: windows.map(w => w.appType) // Track which windows were open for reconstruction
    };
  };

  const decodeWindowState = (encodedState: any) => {
    if (!encodedState) return false;
    
    try {
      // Validate required fields
      if (!encodedState.lastWindowPositions || 
          !encodedState.lastWindowSizes ||
          typeof encodedState.nextZIndex !== 'number') {
        console.error('Invalid window state format');
        return false;
      }

      // Validate position and size data structure
      const positionsValid = Object.values(encodedState.lastWindowPositions).every(
        (pos: any) => typeof pos === 'object' && typeof pos.x === 'number' && typeof pos.y === 'number'
      );
      
      const sizesValid = Object.values(encodedState.lastWindowSizes).every(
        (size: any) => typeof size === 'object' && typeof size.width === 'number' && typeof size.height === 'number'
      );

      if (!positionsValid || !sizesValid) {
        console.error('Invalid window position or size data');
        return false;
      }

      // Apply the decoded state
      setLastWindowPositions(encodedState.lastWindowPositions);
      setLastWindowSizes(encodedState.lastWindowSizes);
      setNextZIndex(encodedState.nextZIndex);

      // WINDOW RECONSTRUCTION: Restore open windows after loading saved state
      // This is why syncWindowLayout exists as a separate function - it allows us to
      // reconstruct windows with their saved positions and sizes when loading a game,
      // rather than having to minimize/re-expand windows to apply the proper layout.
      if (encodedState.openWindowTypes) {
        // Clear current windows to prevent duplicates
        setWindows([]);
        
        // Reconstruct each window that was previously open
        encodedState.openWindowTypes.forEach((appType: string) => {
          const appConfig = APP_REGISTRY[appType];
          if (appConfig) {
            // Pass the decoded position and size directly to avoid async state issues
            const savedPosition = encodedState.lastWindowPositions[appType];
            const savedSize = encodedState.lastWindowSizes[appType];
            syncWindowLayout(appType, appConfig.name, null, savedPosition, savedSize);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to decode window state:', error);
      return false;
    }
  };

  return {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    syncWindowLayout,
    closeWindow,
    closeWindowsByAppType,
    bringToFront,
    dockAllWindows,
    resetWindowState,
    
    // Save/Load
    encodeWindowState,
    decodeWindowState,
  };
}; 