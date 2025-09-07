/**
 * Window State Store (Zustand)
 * 
 * Centralized window management using Zustand.
 * Handles window lifecycle, positioning, sizing, and z-index management.
 * Replaces the useWindowState hook to eliminate prop drilling and improve performance.
 * 
 * Migrated from useWindowState hook to follow Zustand architecture pattern.
 */

import { create } from 'zustand';
import React from 'react';
import { WindowData } from '../types/windowState';
import { WINDOW_DEFAULTS, APP_WINDOW_DEFAULTS } from '../constants/windowConstants';
import { APP_REGISTRY } from '../constants/appListConstants';
import { clampPositionToBounds, isPositionOutOfBounds } from '../utils/viewportConstraints';

interface WindowState {
  // Core window data
  windows: WindowData[];
  lastWindowPositions: Record<string, { x: number; y: number }>;
  lastWindowSizes: Record<string, { width: number; height: number }>;
  nextZIndex: number;
}

interface WindowActions {
  // ===== WINDOW LIFECYCLE =====
  openOrCloseWindow: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }) => void;
  syncWindowLayout: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }, savedSize?: { width: number; height: number }) => void;
  closeWindow: (windowId: string) => void;
  closeWindowsByAppType: (appType: string) => void;
  dockAllWindows: () => void;

  // ===== POSITION & SIZE MANAGEMENT =====
  updateWindowPosition: (appType: string, position: { x: number; y: number }) => void;
  updateWindowSize: (appType: string, size: { width: number; height: number }) => void;
  bringToFront: (windowId: string) => void;

  // ===== UTILITY FUNCTIONS =====
  enforceWindowBounds: (appType: string) => void;

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeWindowState: () => any;
  decodeWindowState: (encodedState: any) => boolean;

  // ===== RESET FUNCTION =====
  resetWindowState: () => void;
}

type WindowStore = WindowState & WindowActions;

const initialWindowState: WindowState = {
  windows: [],
  lastWindowPositions: {},
  lastWindowSizes: {},
  nextZIndex: 1000, // Start at 1000, increment for each new window
};

export const useWindowStore = create<WindowStore>((set, get) => ({
  ...initialWindowState,

  // ===== POSITION & SIZE MANAGEMENT =====
  updateWindowPosition: (appType: string, position: { x: number; y: number }) => {
    set((state) => ({
      lastWindowPositions: {
        ...state.lastWindowPositions,
        [appType]: position
      }
    }));
  },

  updateWindowSize: (appType: string, size: { width: number; height: number }) => {
    set((state) => ({
      lastWindowSizes: {
        ...state.lastWindowSizes,
        [appType]: size
      }
    }));
  },

  bringToFront: (windowId: string) => {
    set((state) => ({
      windows: state.windows.map(window => 
        window.id === windowId 
          ? { ...window, zIndex: state.nextZIndex }
          : window
      ),
      nextZIndex: state.nextZIndex + 1
    }));
  },

  // ===== WINDOW LIFECYCLE =====
  syncWindowLayout: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }, savedSize?: { width: number; height: number }) => {
    const state = get();
    const defaultContent = React.createElement('div', {}, 'No Data Available');
    const windowContent = content || defaultContent;
    
    // Use drop position if provided, otherwise use last known or defaults
    let lastPosition = dropPosition || state.lastWindowPositions[appType];
    const defaultPosition = { 
      x: WINDOW_DEFAULTS.POSITION.x + (state.windows.length * WINDOW_DEFAULTS.POSITION_OFFSET), 
      y: WINDOW_DEFAULTS.POSITION.y + (state.windows.length * WINDOW_DEFAULTS.POSITION_OFFSET) 
    };
    
    let lastSize = savedSize || state.lastWindowSizes[appType];
    const defaultSize = APP_WINDOW_DEFAULTS[appType] || WINDOW_DEFAULTS.SIZE;
    
    // If drop position is provided, center the window on the drop point
    if (dropPosition) {
      const windowSize = lastSize || defaultSize;
      lastPosition = {
        x: dropPosition.x - (windowSize.width / 2),
        y: dropPosition.y - (windowSize.height / 2)
      };
    }
    
    // Check if saved position is out of bounds and clamp it to viewport bounds
    if (lastPosition) {
      // Use lastSize if available, otherwise use default size for bounds checking
      const sizeForBoundsCheck = lastSize || defaultSize;
      const isOutOfBounds = isPositionOutOfBounds(lastPosition, sizeForBoundsCheck, 0);
      if (isOutOfBounds) {
        // Clamp the position to viewport bounds instead of clearing it
        const clampedPosition = clampPositionToBounds(lastPosition, sizeForBoundsCheck, 0);
        
        // Update the saved position with the clamped version
        set((state) => ({
          lastWindowPositions: {
            ...state.lastWindowPositions,
            [appType]: clampedPosition
          }
        }));
        
        lastPosition = clampedPosition; // Use the clamped position
      }
    }
    
    const newWindow: WindowData = {
      id: `window-${appType}-${Date.now()}`,
      appType,
      title,
      content: windowContent,
      position: lastPosition || defaultPosition,
      size: lastSize || defaultSize,
      zIndex: state.nextZIndex
    };
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: state.nextZIndex + 1
    }));
  },

  openOrCloseWindow: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }) => {
    const state = get();
    // Check if a window for this app type already exists
    const existingWindowIndex = state.windows.findIndex(window => window.appType === appType);
    
    if (existingWindowIndex !== -1) {
      // Window exists, close it
      set((state) => ({
        windows: state.windows.filter(window => window.appType !== appType)
      }));
    } else {
      // Window doesn't exist, open it (bounds checking happens in syncWindowLayout)
      get().syncWindowLayout(appType, title, content, dropPosition);
    }
  },

  closeWindow: (windowId: string) => {
    set((state) => ({
      windows: state.windows.filter(window => window.id !== windowId)
    }));
  },

  closeWindowsByAppType: (appType: string) => {
    set((state) => ({
      windows: state.windows.filter(window => window.appType !== appType)
    }));
  },

  dockAllWindows: () => {
    set({ windows: [] });
  },

  // ===== UTILITY FUNCTIONS =====
  enforceWindowBounds: (appType: string) => {
    const state = get();
    // Find the actual opened window and check if it's out of bounds
    const openedWindow = state.windows.find(window => window.appType === appType);
    
    if (openedWindow) {
      const isOutOfBounds = isPositionOutOfBounds(openedWindow.position, openedWindow.size, 0);
      if (isOutOfBounds) {
        // Clear the saved position so next time it opens with default positioning
        set((state) => {
          const updated = { ...state.lastWindowPositions };
          delete updated[appType];
          return {
            lastWindowPositions: updated,
            // Also close the offscreen window
            windows: state.windows.filter(window => window.appType !== appType)
          };
        });
      }
    }
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeWindowState: () => {
    const state = get();
    return {
      lastWindowPositions: state.lastWindowPositions,
      lastWindowSizes: state.lastWindowSizes,
      nextZIndex: state.nextZIndex,
      openWindowTypes: state.windows.map(w => w.appType) // Track which windows were open for reconstruction
    };
  },

  decodeWindowState: (encodedState: any): boolean => {
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
      set({
        lastWindowPositions: encodedState.lastWindowPositions,
        lastWindowSizes: encodedState.lastWindowSizes,
        nextZIndex: encodedState.nextZIndex,
        windows: [] // Clear current windows first
      });

      // WINDOW RECONSTRUCTION: Restore open windows after loading saved state
      if (encodedState.openWindowTypes) {
        // Reconstruct each window that was previously open
        encodedState.openWindowTypes.forEach((appType: string) => {
          const appConfig = APP_REGISTRY[appType];
          if (appConfig) {
            // Pass the decoded position and size directly to avoid async state issues
            const savedPosition = encodedState.lastWindowPositions[appType];
            const savedSize = encodedState.lastWindowSizes[appType];
            get().syncWindowLayout(appType, appConfig.name, null, savedPosition, savedSize);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to decode window state:', error);
      return false;
    }
  },

  // ===== RESET FUNCTION =====
  resetWindowState: () => {
    set(initialWindowState);
  }
}));
