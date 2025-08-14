/**
 * DOM IDS
 *
 * Centralized constants for droppable/interactive DOM element ids used across
 * drag-and-drop systems. Keep as single source of truth to avoid string
 * duplication and typos.
 */

export const DOM_IDS = {
  PURGE_ZONE: 'purge-zone-window',
  TERMINAL_DOCK: 'terminal-dock-zone'
} as const;

export type DomId = typeof DOM_IDS[keyof typeof DOM_IDS];


