/**
 * Physics constants for Work Mode scrap interactions.
 * Units are in viewport height (vh) per second for vertical motion.
 */

export const SCRAP_BASELINE_BOTTOM_VH = 24; // Matches .scrap-item bottom in CSS

// Gravity points downward (reduces positive y which is "above baseline")
export const GRAVITY_VH_PER_S2 = -250;

// Optional clamps for stability (not strictly required yet)
export const MAX_UPWARD_SPEED_VH_PER_S = 200;
export const MAX_DOWNWARD_SPEED_VH_PER_S = -600;
export const MAX_HORIZONTAL_SPEED_VW_PER_S = 40;

// Global momentum scaling to reduce throw extremeness (~20% reduction)
export const MOMENTUM_SCALE = 0.8;

// Utility conversions
export const pxPerVh = () => (typeof window !== 'undefined' ? window.innerHeight / 100 : 8); // fallback ~800px height
export const vhFromPx = (px: number) => px / pxPerVh();
export const pxFromVh = (vh: number) => vh * pxPerVh();


