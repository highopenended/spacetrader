/**
 * Merchant Family and Cathedra Lore
 *
 * Lightweight setting text intended for future in-game readouts.
 * Keep entries short, consistent, and easy to reference by id.
 */

export type LoreEntry = {
  id: string;
  title: string;
  body: string[];
  tags?: string[];
};

export const MERCHANT_FAMILY_CATHEDRA_LORE = [
  {
    id: 'merchantFamily.overview',
    title: 'The Merchant Family',
    body: [
      'The Merchant Family is not a surname. It is a ledger construct.',
      'Their power travels on paper and in permissions, not banners.',
      'Every ship, bay, and berth exists under a clause. The clause always has a price.',
    ],
    tags: ['institution', 'economy', 'peerage'],
  },
  {
    id: 'cathedra.definition',
    title: 'Cathedra',
    body: [
      'A Cathedra is a seat of authority bound to a set of accounts.',
      'Seats can be granted, purchased, or married into, but never truly owned.',
      'A seat-holder rules by quota and audit. They fail by shortfall and scandal.',
    ],
    tags: ['institution', 'rank', 'ledger'],
  },
  {
    id: 'cathedra.minor',
    title: 'Cathedra Minor',
    body: [
      'A Cathedra Minor is accepted, but not trusted.',
      'Patronage is their oxygen. Gifts are their language.',
      'They pay to be seen, and pay again to be remembered.',
    ],
    tags: ['rank', 'peerage'],
  },
  {
    id: 'cathedra.dominus',
    title: 'Cathedra Dominus',
    body: [
      'A Cathedra Dominus signs deals that move fleets.',
      'Their favors do not come with gratitude. They come with interest.',
      'They speak softly in public, then enforce loudly in private.',
    ],
    tags: ['rank', 'power'],
  },
  {
    id: 'cathedra.ultima',
    title: 'Cathedra Ultima',
    body: [
      'A Cathedra Ultima is the family made singular.',
      'They do not win arguments. They revise the ledger until the argument never existed.',
      'The work does not end at the throne. It begins there.',
    ],
    tags: ['rank', 'power', 'myth'],
  },
  {
    id: 'merchantFamily.doctrine',
    title: 'Doctrine of the Ledger',
    body: [
      'A debt unpaid is a story unfinished.',
      'A quota met is a prayer answered.',
      'A tithe missed is a reason to change your permissions.',
    ],
    tags: ['doctrine', 'economy', 'tithe'],
  },
] as const satisfies readonly LoreEntry[];

