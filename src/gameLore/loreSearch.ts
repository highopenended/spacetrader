/**
 * Filter and group lore for the Game Lore browser.
 */

import type { LoreEntry } from './loreTypes';

/** Case-insensitive substring match on title, category, and tags. */
export function filterLoreEntries(
  entries: readonly LoreEntry[],
  query: string
): LoreEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...entries];
  return entries.filter((entry) => {
    if (entry.title.toLowerCase().includes(q)) return true;
    if (entry.category.toLowerCase().includes(q)) return true;
    return entry.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
  });
}

/** Category headings sorted A–Z; entries within each category sorted by title. */
export function groupLoreByCategory(entries: readonly LoreEntry[]): [string, LoreEntry[]][] {
  const map = new Map<string, LoreEntry[]>();
  for (const entry of entries) {
    const key = entry.category;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  Array.from(map.values()).forEach((list) => {
    list.sort((a, b) => a.title.localeCompare(b.title));
  });
  return Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((category): [string, LoreEntry[]] => [category, map.get(category)!]);
}
