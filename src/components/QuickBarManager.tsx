import React from 'react';
import { InstalledApp } from '../types/appListState';

interface QuickBarManagerProps {
  installedApps: InstalledApp[];
}

const QuickBarManager: React.FC<QuickBarManagerProps> = ({ installedApps }) => {
  // No effects needed - QuickKeysBar and KeyboardManager handle conditional rendering
  return null;
};

export default QuickBarManager;


