/**
 * Physics constants for Work Mode scrap interactions.
 * Units:
 * - All positions/velocities use vp (viewport-min) and vp/s
 * - vp = viewport units based on minimum dimension (width or height)
 * Rationale: unified viewport-relative units keep behavior stable across zoom/resolution and aspect ratio.
 */

import { GlobalField } from '../types/physicsTypes';

// ===== UNIFIED PHYSICS CONSTANTS (for airborne scrap after release) =====
// All units use vp (viewport-min) for consistent behavior across aspect ratios
// NOTE: Old vh/vw constants below are deprecated but kept for reference

// Baseline height (vp) for the assembly line; scrap sits at this bottom value when grounded (matches .scrap-item bottom in CSS)
export const SCRAP_BASELINE_BOTTOM_VP = 12;

// Gravity in vp/s^2 (negative => downward). Tuned for snappy but weighty falls
export const GRAVITY_VP_PER_S2 = -250;

// Speed caps (vp/s) to avoid unrealistic upward, downward, or horizontal spikes
export const MAX_UPWARD_SPEED_VP_PER_S = 200;
export const MAX_DOWNWARD_SPEED_VP_PER_S = -600;
export const MAX_HORIZONTAL_SPEED_VP_PER_S = 40; // Keep same as original vw limit for balanced throws

// Global throw strength scaling (~20% reduction) for better control/feel
export const MOMENTUM_SCALE = 0.5;

// Momentum capture thresholds (drag hook): preserve momentum only if release
// occurs within this window after last meaningful motion (ms)
export const MOMENTUM_VALID_WINDOW_MS = 120;
// Ignore tiny jitter below this speed (px/s) so "still" releases don't throw
export const VELOCITY_MIN_THRESHOLD_PX_PER_S = 80;

// Conversion helpers between px and vp (viewport-min units)
// Uses minimum dimension (width or height) for consistent behavior across aspect ratios
export const pxPerVp = () => {
  if (typeof window === 'undefined') return 8; // Fallback for SSR
  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  return minDimension / 100;
};
export const vpFromPx = (px: number) => px / pxPerVp();
export const pxFromVp = (vp: number) => vp * pxPerVp();

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
 * Maximum Scrap Drag Speed (in viewport units)
 * 
 * Speed limit for dragged scrap movement to prevent tunneling and physics breakage.
 * Applied to velocity magnitude during integration, acting as a safety ceiling.
 * Scaled by viewport size at runtime (maxSpeed * pxPerVp()) for consistent behavior across screen sizes.
 * - Mainly constrains light/high-effectiveness scrap during rapid cursor movements
 * - Heavy/low-effectiveness scrap naturally stays below limit due to physics
 * - Higher values (300+): More permissive, allows very fast throws
 * - Lower values (60-150): Tighter control, more predictable interactions
 * - 300: High speed - very responsive, allows dramatic swings
 * 
 * Note: This is in viewport units. Gets converted to px/s at runtime based on screen size.
 */
export const MAX_SCRAP_DRAG_SPEED_VP_PER_S = 300;

/**
 * Spring Stiffness (Manipulator Pull Strength)
 * 
 * How strongly the manipulator pulls scrap toward cursor position (force per viewport unit of distance).
 * This is the "spring constant" in the spring-damper physics model.
 * Scaled by viewport size at runtime (k / pxPerVp()) for consistent behavior across screen sizes.
 * - Higher values (25-40): Very strong pull, tight following, minimal swing
 * - Medium values (15-25): Strong pull, responsive with some momentum
 * - Lower values (8-12): Balanced feel, noticeable momentum with control
 * - Very low (3-6): Loose feel, dramatic pendulum swings
 * - 20.0: Strong spring - fast response with controlled momentum
 * 
 * Scaled by manipulator effectiveness: low effectiveness = weak spring = heavy swinging
 */
export const SPRING_STIFFNESS = 600.0;

/**
 * Drag Damping (Velocity Decay)
 * 
 * Per-frame velocity damping factor to prevent infinite oscillation.
 * Applied as: velocity *= DRAG_DAMPING each frame
 * - 1.0: No damping (would oscillate forever)
 * - 0.95-0.98: Very light damping, long momentum trails
 * - 0.90-0.94: Light damping, maintains velocity well
 * - 0.85-0.90: Balanced damping, natural feel
 * - 0.7-0.8: Heavy damping, quick stops
 * - 0.93: Light damping - maintains momentum, responsive feel
 * 
 * Works with spring stiffness to create natural spring-damper behavior.
 */
export const DRAG_DAMPING = 0.96;


