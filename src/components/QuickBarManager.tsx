import React from 'react';
import { InstalledApp } from '../types/appListState';
import { QuickBarFlags, QuickBarConfig } from '../types/quickBarState';

interface QuickBarManagerProps {
  installedApps: InstalledApp[];
  quickBarFlags: QuickBarFlags;
  setQuickBarFlag: (key: keyof QuickBarFlags, value: boolean) => void;
  quickBarConfig: QuickBarConfig;
}

const QuickBarManager: React.FC<QuickBarManagerProps> = ({ installedApps, quickBarFlags, setQuickBarFlag, quickBarConfig }) => {
  // No effects needed - QuickKeysBar and KeyboardManager handle conditional rendering
  return null;
};

export default QuickBarManager;


