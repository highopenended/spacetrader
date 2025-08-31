/**
 * Upgrade Registry
 *
 * Single source of truth for all upgrades in the game. Upgrades are referenced
 * by their stable id. Keep this list minimal and DRY; windows and systems
 * should consume it rather than duplicating upgrade definitions.
 */

import { UpgradeRegistry } from '../types/upgradeState';

export const UPGRADE_REGISTRY: UpgradeRegistry = {
  // Dumpster Vision: Add Quick Key
  'dumpsterVision.addQuickKey': {
    id: 'dumpsterVision.addQuickKey',
    appId: 'dumpsterVision',
    label: 'ADD QUICK KEY',
    description: 'Adds a Dumpster Vision quick key to the Quick Bar.',
    cost: 100,
    refundable: true,
  },
};


