import React from 'react';
import { InstalledApp } from '../types/appListState';
import { QuickBarConfig, QuickBarFlags } from '../types/quickBarState';
import { useUpgradesStore } from '../stores';

interface KeyboardManagerProps {
  installedApps: InstalledApp[];
  quickBarFlags: QuickBarFlags;
  setQuickBarFlag: (key: keyof QuickBarFlags, value: boolean) => void;
  quickBarConfig: QuickBarConfig;
}

const KeyboardManager: React.FC<KeyboardManagerProps> = ({ installedApps, quickBarFlags, setQuickBarFlag, quickBarConfig }) => {
  // Get upgrade checker from upgradesStore
  const isUpgradePurchased = useUpgradesStore(state => state.isPurchased);
  
  React.useEffect(() => {
    // Build a quick lookup of key -> toggleKey using conditional rendering logic
    const keyToToggleKey = new Map<string, keyof QuickBarFlags>();
    Object.values(quickBarConfig).forEach(cfg => {
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
  }, [installedApps, quickBarFlags, setQuickBarFlag, quickBarConfig, isUpgradePurchased]);

  return null;
};

export default KeyboardManager;


