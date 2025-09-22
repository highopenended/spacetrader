import { QuickBarFlags } from '../../../types/quickBarState';
import React from 'react';
import DumpsterVisionOverlay from './DumpsterVisionOverlay';
import UpgradeProgressOverlay from './UpgradeProgressOverlay';
import { VisualOverlayProps } from '../types';

export interface VisualOverlayEntry {
  id: string;
  Component: React.ComponentType<VisualOverlayProps>;
  isActive: (flags: QuickBarFlags) => boolean;
  zIndex?: number;
}

export const OVERLAY_MANIFEST: VisualOverlayEntry[] = [
  {
    id: 'dumpsterVision',
    Component: DumpsterVisionOverlay,
    isActive: (flags) => flags.isActiveDumpsterVision,
    zIndex: 3000,
  },
  {
    id: 'upgradeProgress',
    Component: UpgradeProgressOverlay,
    isActive: (flags) => flags.isUpgradeInProgress,
    zIndex: 4000,
  },
];


