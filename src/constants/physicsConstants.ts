/**
 * Physics constants for Work Mode scrap interactions.
 * Units:
 * - Vertical positions/velocities use vh (viewport height) and vh/s
 * - Horizontal positions/velocities use vw (viewport width) and vw/s
 * Rationale: viewport-relative units keep behavior stable across zoom/resolution.
 */

import { GlobalField } from '../types/physicsTypes';

// ===== LEGACY PHYSICS CONSTANTS (for airborne scrap after release) =====
// These will remain for the post-release physics system

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
// Ignore tiny jitter below this speed (px/s) so "still" releases don't throw
export const VELOCITY_MIN_THRESHOLD_PX_PER_S = 80;

// Conversion helpers between px and vh (fallback assumes ~800px height when window is unavailable)
export const pxPerVh = () => (typeof window !== 'undefined' ? window.innerHeight / 100 : 8);
export const vhFromPx = (px: number) => px / pxPerVh();
export const pxFromVh = (vh: number) => vh * pxPerVh();

// ===== NEW FIELD-BASED PHYSICS CONSTANTS =====

/**
 * Default Gravity Field
 * 
 * Applied during scrap dragging. Strength is tuned so default manipulator
 * can easily ignore it (manipulatorStrength of 1.5 can handle baseMass of 1 
 * plus gravity of 0.3 when dragging upward).
 */
export const DEFAULT_GRAVITY_FIELD: GlobalField = {
  type: 'global',
  id: 'default-gravity',
  direction: 'down',
  strength: 0.3, // Weak enough for default manipulator to overcome
  description: 'Default downward gravitational force'
};

/**
 * Default Manipulator Strength
 * 
 * Base strength for moving scrap. At strength 1.5, can handle:
 * - baseMass 1 moving horizontally (effectiveLoad = 1)
 * - baseMass 1 moving upward against gravity (effectiveLoad = 1.3)
 * - baseMass 1 moving downward with gravity (effectiveLoad = 0.7)
 */
export const DEFAULT_MANIPULATOR_STRENGTH = 1.5;

/**
 * Default Manipulator Max Load
 * 
 * Absolute maximum load the manipulator can handle. Beyond this, scrap won't move.
 * Set to 3x strength to allow for heavy objects or strong opposing fields.
 */
export const DEFAULT_MANIPULATOR_MAX_LOAD = 4.5;

/**
 * Default Scrap Base Mass
 * 
 * Standard mass for most scrap objects. Mutators and scrap type can modify this.
 */
export const DEFAULT_SCRAP_BASE_MASS = 1;

/**
 * Manipulator Cursor Following Rate
 * 
 * Multiplier for the lag/ineffectiveness when effectiveness is below 100%.
 * Controls how quickly you can create distance between cursor and scrap.
 * At 100% effectiveness, this has NO effect (scrap always follows exactly).
 * Below 100% effectiveness, this scales the lag amount:
 * - 1.0: Normal lag (ineffectiveness as calculated by physics)
 * - 2.0: Double lag (easier to put distance between cursor and scrap)
 * - 0.5: Half lag (harder to put distance, more responsive feel)
 * - 0.0: No lag from ineffectiveness (always follows cursor exactly, ignores effectiveness)
 */
export const MANIPULATOR_CURSOR_FOLLOW_RATE = 2;

/**
 * Manipulator Gap Closure Rate
 * 
 * Base rate at which the manipulator pulls scrap toward cursor position (per second).
 * This creates a distance-based attraction that continues even when cursor stops.
 * Controls how quickly scrap catches up when you hold cursor still.
 * - Higher values (10-15): Fast catch-up, minimal visible lag
 * - Lower values (3-5): Slow catch-up, pronounced lag
 * - 8.0: Balanced catch-up speed
 * Scaled by manipulator effectiveness and distance.
 */
export const MANIPULATOR_GAP_CLOSURE_RATE = 6.0;


