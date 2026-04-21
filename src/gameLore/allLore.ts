/**
 * Single list of all lore records for the Game Lore app and tooling.
 */

import type { LoreEntry } from './loreTypes';
import { LEDGER_RITES_LORE } from './ledgerRites';
import { MERCHANT_FAMILY_CATHEDRA_LORE } from './merchantFamilyCathedra';

export const ALL_LORE: readonly LoreEntry[] = [
  ...MERCHANT_FAMILY_CATHEDRA_LORE,
  ...LEDGER_RITES_LORE,
];
