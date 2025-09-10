import React from 'react';
import { InstalledApp } from '../types/appListState';
import { useUpgradesStore, useQuickBarStore } from '../stores';
import { buildKeyToToggleKeyMap } from '../utils/quickBarUtils';

interface KeyboardManagerProps {
  installedApps: InstalledApp[];
}

const KeyboardManager: React.FC<KeyboardManagerProps> = ({ installedApps }) => {

  const setQuickBarFlag = useQuickBarStore(state => state.setQuickBarFlag);
  
  // Get upgrade checker from upgradesStore
  const isUpgradePurchased = useUpgradesStore(state => state.isPurchased);
  
  React.useEffect(() => {
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
      
      // Build key lookup dynamically to get current state
      const keyToToggleKey = buildKeyToToggleKeyMap(installedApps, isUpgradePurchased);

      const toggleKey = keyToToggleKey.get(pressed);
      if (!toggleKey) return;

      // Get current state dynamically
      const currentState = useQuickBarStore.getState().quickBarFlags;
      const current = Boolean(currentState[toggleKey]);
      setQuickBarFlag(toggleKey, !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [installedApps, setQuickBarFlag, isUpgradePurchased]);

  return null;
};

export default KeyboardManager;


