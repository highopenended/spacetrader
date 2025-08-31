import React from 'react';
import { InstalledApp } from '../types/appListState';
import { QuickBarFlags, QuickBarConfig } from '../types/quickBarState';

interface QuickBarManagerProps {
  installedApps: InstalledApp[];
  quickBarFlags: QuickBarFlags;
  setQuickBarFlag: (key: keyof QuickBarFlags, value: boolean) => void;
  quickBarConfig: QuickBarConfig;
  isUpgradePurchased?: (id: string) => boolean;
}

const QuickBarManager: React.FC<QuickBarManagerProps> = ({ installedApps, quickBarFlags, setQuickBarFlag, quickBarConfig, isUpgradePurchased }) => {
  React.useEffect(() => {
    // Auto-disable flags when their required app is not installed
    Object.values(quickBarConfig).forEach(cfg => {
      if (!cfg.toggleFlagKey) return;
      if (cfg.requiresAppId && !installedApps.some(a => a.id === cfg.requiresAppId)) {
        if (quickBarFlags[cfg.toggleFlagKey]) {
          setQuickBarFlag(cfg.toggleFlagKey, false);
        }
      }
    });
  }, [installedApps, quickBarConfig, quickBarFlags, setQuickBarFlag]);

  return null;
};

export default QuickBarManager;


