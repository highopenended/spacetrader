import React from 'react';
import { InstalledApp } from '../types/appListState';
import { QuickBarFlags } from '../types/quickBarState';
import { useUpgradesStore, useQuickBarStore } from '../stores';
import { QUICKBAR_CONFIG } from '../constants/quickBarConstants';

interface KeyboardManagerProps {
  installedApps: InstalledApp[];
}

const KeyboardManager: React.FC<KeyboardManagerProps> = ({ installedApps }) => {
  // Get quick bar state from store
  const quickBarFlags = useQuickBarStore(state => state.quickBarFlags);
  const setQuickBarFlag = useQuickBarStore(state => state.setQuickBarFlag);
  
  // Get upgrade checker from upgradesStore
  const isUpgradePurchased = useUpgradesStore(state => state.isPurchased);
  
  React.useEffect(() => {
    // Build a quick lookup of key -> toggleKey using conditional rendering logic
    const keyToToggleKey = new Map<string, keyof QuickBarFlags>();
    Object.values(QUICKBAR_CONFIG).forEach(cfg => {
      if (!cfg.showInQuickBar) return;
      if (cfg.requiresAppId && !installedApps.some(app => app.id === cfg.requiresAppId)) return;
      if (cfg.requiresUpgradeId && !isUpgradePurchased(cfg.requiresUpgradeId)) return;
      if (!cfg.shortcutKey || !cfg.toggleFlagKey) return;
      keyToToggleKey.set(String(cfg.shortcutKey).toUpperCase(), cfg.toggleFlagKey);
    });

    const shouldIgnoreTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (target.isContentEditable) return true;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (shouldIgnoreTarget(e.target)) return;

      const pressed = e.key.toUpperCase();
      const toggleKey = keyToToggleKey.get(pressed);
      if (!toggleKey) return;

      const current = Boolean(quickBarFlags[toggleKey]);
      setQuickBarFlag(toggleKey, !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [installedApps, quickBarFlags, setQuickBarFlag, isUpgradePurchased]);

  return null;
};

export default KeyboardManager;


