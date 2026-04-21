/**
 * Shared shape for lore snippets used in-game (Game Lore app and future readouts).
 */

export type LoreEntry = {
  id: string;
  title: string;
  /** Used for grouping in the Game Lore browser. */
  category: string;
  /** Readonly so `as const` lore arrays type-check. */
  body: readonly string[];
  tags?: readonly string[];
};
