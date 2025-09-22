/**
 * Quick Bar Constants
 * 
 * Static configuration for quick bar keys and functionality.
 * Defines keyboard shortcuts, labels, and requirements for quick bar items.
 */

import { QuickBarConfig } from '../types/quickBarState';

export const QUICKBAR_CONFIG: QuickBarConfig = {
  dumpsterVision: {
    id: 'dumpsterVision',
    label: 'Dumpster Vision',
    shortcutKey: 'X',
    showInQuickBar: true,
    toggleFlagKey: 'isActiveDumpsterVision',
    requiresAppId: 'dumpsterVision',
    requiresUpgradeId: 'dumpsterVision.addQuickKey',
  },
  chronoTrack: {
    id: 'chronoTrack',
    label: 'Time Control',
    shortcutKey: 'T',
    showInQuickBar: true,
    toggleFlagKey: 'isActiveTimeControl',
    requiresAppId: 'chronoTrack',
    requiresUpgradeId: 'chronoTrack.addQuickKey',
  },
};
