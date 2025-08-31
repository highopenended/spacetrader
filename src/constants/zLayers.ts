/**
 * Z-Layers
 * Centralized z-index values to keep layering predictable and DRY.
 */

export const Z_LAYERS = {
  WINDOWS_BASE: 1000,
  TERMINAL_BASE: 1000,
  TERMINAL_SCANLINES: 1005,
  DRAG_OVERLAY: 2000,
  SCRAP_DRAG: 2500,
  OPTIONS_GEAR: 9999
} as const;

export type ZLayer = typeof Z_LAYERS[keyof typeof Z_LAYERS];


