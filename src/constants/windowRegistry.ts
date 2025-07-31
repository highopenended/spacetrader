/**
 * Window Registry System
 * 
 * Centralized registry for window components and their rendering logic.
 * Maps app types to their window components and prop builders.
 * Used by App.tsx to render windows without duplicating logic.
 */

import React from 'react';
import ScrAppWindow from '../components/scr-apps/scrAppWindow/ScrAppWindow';
import AgeAppWindow from '../components/scr-apps/ageApp/window/AgeAppWindow';
import JobTitleAppWindow from '../components/scr-apps/jobTitleApp/window/JobTitleAppWindow';
import CreditsAppWindow from '../components/scr-apps/creditsApp/window/CreditsAppWindow';
import PurgeZoneAppWindow from '../components/scr-apps/purgeZoneApp/window/PurgeZoneAppWindow';
import ScrAppStoreAppWindow from '../components/scr-apps/scrAppStoreApp/window/ScrAppStoreAppWindow';
import ChronoTrackAppWindow from '../components/scr-apps/chronoTrackApp/window/ChronoTrackAppWindow';
import CacheSyncAppWindow from '../components/scr-apps/cacheSyncApp/window/CacheSyncAppWindow';
import { WindowData } from '../types/gameState';
import { GameTime, GamePhase } from '../types/gameState';
import { WindowManagerContext } from '../contexts/WindowManagerContext';

// Interface for the game state context passed to window renderers
interface WindowGameState {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  overId: any;
  purgeNodeDragState: {
    draggedAppType: string | null;
  };
  updateCredits: (amount: number) => void;
  getAvailableApps: () => any[];
  installedApps: any[];
  installApp: (appId: string, order?: number) => void;
}

// Interface for window configuration
interface WindowConfig {
  component: React.ComponentType<any>;
  getProps: (window: WindowData, gameState: WindowGameState, windowManager: WindowManagerContext) => any;
}

/**
 * Builds common props that are shared across all window components
 * Reduces repetition in window registry configurations
 */
const buildCommonProps = (
  window: WindowData,
  gameState: WindowGameState,
  windowManager: WindowManagerContext
) => ({
  key: window.id,
  windowId: window.id,
  appType: window.appType,
  position: window.position,
  size: window.size,
  zIndex: window.zIndex,
  overId: gameState.overId,
  draggedAppType: gameState.purgeNodeDragState.draggedAppType,
  onClose: () => windowManager.closeWindow(window.id),
  onPositionChange: (pos: { x: number; y: number }) => windowManager.updateWindowPosition(window.appType, pos),
  onSizeChange: (size: { width: number; height: number }) => windowManager.updateWindowSize(window.appType, size),
  onBringToFront: () => windowManager.bringToFront(window.id),
});

// Window registry mapping app types to their configurations
export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
  purgeZone: {
    component: PurgeZoneAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      updateCredits: gameState.updateCredits
    })
  },
  age: {
    component: AgeAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      gameTime: gameState.gameTime,
      updateCredits: gameState.updateCredits
    })
  },
  jobTitle: {
    component: JobTitleAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      gamePhase: gameState.gamePhase,
      updateCredits: gameState.updateCredits
    })
  },
  scrAppStore: {
    component: ScrAppStoreAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      credits: gameState.credits,
      gamePhase: gameState.gamePhase,
      getAvailableApps: gameState.getAvailableApps,
      installedApps: gameState.installedApps,
      installApp: gameState.installApp,
      updateCredits: gameState.updateCredits
    })
  },
  chronoTrack: {
    component: ChronoTrackAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      gameTime: gameState.gameTime,
      gamePhase: gameState.gamePhase,
      updateCredits: gameState.updateCredits
    })
  },
  credits: {
    component: CreditsAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      credits: gameState.credits,
      updateCredits: gameState.updateCredits
    })
  },
  cacheSync: {
    component: CacheSyncAppWindow,
    getProps: (window, gameState, windowManager) => ({
      ...buildCommonProps(window, gameState, windowManager),
      credits: gameState.credits,
      updateCredits: gameState.updateCredits
    })
  }
};

/**
 * Renders a window using the registry configuration
 * This is a 1:1 transfer of the renderWindow function from App.tsx
 */
export const renderWindow = (
  window: WindowData, 
  gameState: WindowGameState, 
  windowManager: WindowManagerContext
): React.ReactElement => {
  const config = WINDOW_REGISTRY[window.appType];
  
  if (config) {
    const WindowComponent = config.component;
    const props = config.getProps(window, gameState, windowManager);
    return React.createElement(WindowComponent, props);
  }
  
  // Fallback to generic ScrAppWindow for unregistered app types
  return React.createElement(ScrAppWindow, {
    key: window.id,
    windowId: window.id,
    appType: window.appType,
    title: window.title,
    position: window.position,
    size: window.size,
    zIndex: window.zIndex,
    overId: gameState.overId,
    draggedAppType: gameState.purgeNodeDragState.draggedAppType,
    onClose: () => windowManager.closeWindow(window.id),
    onPositionChange: (position) => windowManager.updateWindowPosition(window.appType, position),
    onSizeChange: (size) => windowManager.updateWindowSize(window.appType, size),
    onBringToFront: () => windowManager.bringToFront(window.id),
    updateCredits: gameState.updateCredits,
    children: window.content
  });
}; 