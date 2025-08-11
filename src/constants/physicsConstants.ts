/**
 * Physics constants for Work Mode scrap interactions.
 * Units:
 * - Vertical positions/velocities use vh (viewport height) and vh/s
 * - Horizontal positions/velocities use vw (viewport width) and vw/s
 * Rationale: viewport-relative units keep behavior stable across zoom/resolution.
 */

// Baseline height (vh) for the assembly line; scrap sits at this bottom value when grounded (matches .scrap-item bottom in CSS)
export const SCRAP_BASELINE_BOTTOM_VH = 22;

// Gravity in vh/s^2 (negative => downward). Tuned for snappy but weighty falls
export const GRAVITY_VH_PER_S2 = -250;

// Vertical speed caps (vh/s) to avoid unrealistic upward or downward spikes
export const MAX_UPWARD_SPEED_VH_PER_S = 200;
export const MAX_DOWNWARD_SPEED_VH_PER_S = -600;
// Horizontal speed cap (vw/s) to prevent screen-crossing darts
export const MAX_HORIZONTAL_SPEED_VW_PER_S = 40;

// Global throw strength scaling (~20% reduction) for better control/feel
export const MOMENTUM_SCALE = 0.5;

// Momentum capture thresholds (drag hook): preserve momentum only if release
// occurs within this window after last meaningful motion (ms)
export const MOMENTUM_VALID_WINDOW_MS = 120;
// Ignore tiny jitter below this speed (px/s) so “still” releases don’t throw
export const VELOCITY_MIN_THRESHOLD_PX_PER_S = 80;

// Conversion helpers between px and vh (fallback assumes ~800px height when window is unavailable)
export const pxPerVh = () => (typeof window !== 'undefined' ? window.innerHeight / 100 : 8);
export const vhFromPx = (px: number) => px / pxPerVh();
export const pxFromVh = (vh: number) => vh * pxPerVh();


