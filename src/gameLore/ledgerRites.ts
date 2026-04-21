/**
 * Ledger and tithe lore snippets.
 *
 * Short readouts for calendar and obligation flavor text.
 */

import type { LoreEntry } from './merchantFamilyCathedra';

export const LEDGER_RITES_LORE = [
  {
    id: 'ledger.titheBoundary',
    title: 'Tithe Boundaries',
    body: [
      'When the ledger cycle rolls, the tithe window opens.',
      'What you owe is already written. What you pay is proof you read it.',
      'Miss the boundary and your permissions cool. Not all at once. Just enough to notice.',
    ],
    tags: ['calendar', 'tithe', 'economy'],
  },
] as const satisfies readonly LoreEntry[];
