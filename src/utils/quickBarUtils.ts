/**
 * Quick Bar Utilities
 * 
 * Shared utilities for quick bar functionality to avoid code duplication
 * between KeyboardManager and QuickKeysBar components.
 */

import { InstalledApp } from '../types/appListState';
import { QuickBarFlags } from '../types/quickBarState';
import { QUICKBAR_CONFIG } from '../constants/quickBarConstants';

/**
 * Builds a Map of keyboard keys to their corresponding toggle flag keys
 * based on current app installation and upgrade states.
 */
export const buildKeyToToggleKeyMap = (
  installedApps: InstalledApp[],
  isUpgradePurchased: (id: string) => boolean
): Map<string, keyof QuickBarFlags> => {
  const keyToToggleKey = new Map<string, keyof QuickBarFlags>();
  
  Object.values(QUICKBAR_CONFIG).forEach(cfg => {
    if (!cfg.showInQuickBar) return;
    if (cfg.requiresAppId && !installedApps.some(app => app.id === cfg.requiresAppId)) return;
    if (cfg.requiresUpgradeId && !isUpgradePurchased(cfg.requiresUpgradeId)) return;
    if (!cfg.shortcutKey || !cfg.toggleFlagKey) return;
    keyToToggleKey.set(String(cfg.shortcutKey).toUpperCase(), cfg.toggleFlagKey);
  });
  
  return keyToToggleKey;
};

/**
 * Builds an array of quick bar items for rendering
 * based on current app installation and upgrade states.
 */
export const buildQuickBarItems = (
  installedApps: InstalledApp[],
  isUpgradePurchased: (id: string) => boolean
) => {
  return Object.values(QUICKBAR_CONFIG)
    .filter(cfg => cfg.showInQuickBar)
    .filter(cfg => !cfg.requiresAppId || installedApps.some(app => app.id === cfg.requiresAppId))
    .filter(cfg => !cfg.requiresUpgradeId || isUpgradePurchased(cfg.requiresUpgradeId))
    .map(cfg => ({
      id: cfg.id,
      keyLetter: cfg.shortcutKey,
      label: cfg.label,
      toggleKey: cfg.toggleFlagKey
    }));
};
