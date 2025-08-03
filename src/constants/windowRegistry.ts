/**
 * Window Registry System
 * 
 * Centralized registry for window components and their rendering logic.
 * Maps app types to their window components and prop builders.
 * Used by App.tsx to render windows without duplicating logic.
 */

import React from 'react';
import ScrAppWindow from '../components/scr-apps/scrAppWindow/ScrAppWindow';
import JobTitleAppWindow from '../components/scr-apps/jobTitleApp/window/JobTitleAppWindow';
import CreditsAppWindow from '../components/scr-apps/creditsApp/window/CreditsAppWindow';
import PurgeZoneAppWindow from '../components/scr-apps/purgeZoneApp/window/PurgeZoneAppWindow';
import ScrAppStoreAppWindow from '../components/scr-apps/scrAppStoreApp/window/ScrAppStoreAppWindow';
import ChronoTrackAppWindow from '../components/scr-apps/chronoTrackApp/window/ChronoTrackAppWindow';
import CacheSyncAppWindow from '../components/scr-apps/cacheSyncApp/window/CacheSyncAppWindow';
import { WindowData } from '../types/windowState';
import { GameTime, GamePhase, GameMode } from '../types/gameState';
import { WindowManagerContext } from '../contexts/WindowManagerContext';
import { APP_WINDOW_MIN_SIZES, WINDOW_DEFAULTS } from './windowConstants';

// Interface for window controller passed to window renderers
interface WindowController {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  gameMode: GameMode;
  beginWorkSession: () => void;
  overId: any;
  dragNodeState: {
    draggedAppType: string | null;
  };
  updateCredits: (amount: number) => void;
  getAvailableApps: () => any[];
  installedApps: any[];
  installApp: (appId: string, order?: number) => void;
  encodeGameState: () => any;
  decodeGameState: (state: any) => boolean;
  getAppTierData: (appType: string) => any;
  changeAppTier: (appType: string, tier: number) => void;
  encodeWindowState: () => any;
  decodeWindowState: (state: any) => boolean;
  saveToLocalCache: () => boolean;
  loadFromLocalCache: () => boolean;
  exportToFile: () => boolean;
  importFromFile: (file: File) => Promise<boolean>;
  SAVE_COST: number;
}

// Interface for window configuration
interface WindowConfig {
  component: React.ComponentType<any>;
  getProps: (window: WindowData, windowController: WindowController, windowManager: WindowManagerContext, toggleData?: { toggleStates: any; setToggleState: any }) => any;
}

/**
 * Builds common props that are shared across all window components
 * Reduces repetition in window registry configurations
 */
const buildCommonProps = (
  window: WindowData,
  windowController: WindowController,
  windowManager: WindowManagerContext,
  toggleData?: { toggleStates: any; setToggleState: any }
) => ({
  key: window.id,
  windowId: window.id,
  appType: window.appType,
  title: window.title,
  position: window.position,
  size: window.size,
  zIndex: window.zIndex,
  overId: windowController.overId,
  draggedAppType: windowController.dragNodeState.draggedAppType,
  onClose: () => windowManager.closeWindow(window.id),
  onPositionChange: (pos: { x: number; y: number }) => windowManager.updateWindowPosition(window.appType, pos),
  onSizeChange: (size: { width: number; height: number }) => windowManager.updateWindowSize(window.appType, size),
  onBringToFront: () => windowManager.bringToFront(window.id),
  updateCredits: windowController.updateCredits,
  getAppTierData: windowController.getAppTierData,
  changeAppTier: windowController.changeAppTier,
  toggleStates: toggleData?.toggleStates,
  setToggleState: toggleData?.setToggleState,
  minSize: APP_WINDOW_MIN_SIZES[window.appType] || WINDOW_DEFAULTS.MIN_SIZE,
});

// Window registry mapping app types to their configurations
export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
  purgeZone: {
    component: PurgeZoneAppWindow,
    getProps: (window, gameState, windowManager, toggleData) => ({
      ...buildCommonProps(window, gameState, windowManager, toggleData)
    })
  },

  jobTitle: {
    component: JobTitleAppWindow,
    getProps: (window, windowController, windowManager, toggleData) => ({
      ...buildCommonProps(window, windowController, windowManager, toggleData),
      gamePhase: windowController.gamePhase,
      gameMode: windowController.gameMode,
      beginWorkSession: windowController.beginWorkSession
    })
  },
  scrAppStore: {
    component: ScrAppStoreAppWindow,
    getProps: (window, windowController, windowManager, toggleData) => ({
      ...buildCommonProps(window, windowController, windowManager, toggleData),
      credits: windowController.credits,
      gamePhase: windowController.gamePhase,
      getAvailableApps: windowController.getAvailableApps,
      installedApps: windowController.installedApps,
      installApp: windowController.installApp
    })
  },
  chronoTrack: {
    component: ChronoTrackAppWindow,
    getProps: (window, windowController, windowManager, toggleData) => ({
      ...buildCommonProps(window, windowController, windowManager, toggleData),
      gameTime: windowController.gameTime,
      gamePhase: windowController.gamePhase
    })
  },
  credits: {
    component: CreditsAppWindow,
    getProps: (window, windowController, windowManager, toggleData) => ({
      ...buildCommonProps(window, windowController, windowManager, toggleData),
      credits: windowController.credits
    })
  },
  cacheSync: {
    component: CacheSyncAppWindow,
    getProps: (window, windowController, windowManager, toggleData) => ({
      ...buildCommonProps(window, windowController, windowManager, toggleData),
      credits: windowController.credits,
      saveToLocalCache: windowController.saveToLocalCache,
      loadFromLocalCache: windowController.loadFromLocalCache,
      exportToFile: windowController.exportToFile,
      importFromFile: windowController.importFromFile,
      SAVE_COST: windowController.SAVE_COST
    })
  }
};

/**
 * Renders a window using the registry configuration
 * This is a 1:1 transfer of the renderWindow function from App.tsx
 */
export const renderWindow = (
  window: WindowData, 
  windowController: WindowController, 
  windowManager: WindowManagerContext,
  toggleData?: { toggleStates: any; setToggleState: any }
): React.ReactElement => {
  const config = WINDOW_REGISTRY[window.appType];
  
  if (config) {
    const WindowComponent = config.component;
    const props = config.getProps(window, windowController, windowManager, toggleData);
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
    overId: windowController.overId,
    draggedAppType: windowController.dragNodeState.draggedAppType,
    onClose: () => windowManager.closeWindow(window.id),
    onPositionChange: (position) => windowManager.updateWindowPosition(window.appType, position),
    onSizeChange: (size) => windowManager.updateWindowSize(window.appType, size),
    onBringToFront: () => windowManager.bringToFront(window.id),
    updateCredits: windowController.updateCredits,
    children: window.content
  });
}; 