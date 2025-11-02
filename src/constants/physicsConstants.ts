/**
 * Physics constants for Work Mode scrap interactions.
 * 
 * WORLD UNITS SYSTEM:
 * - All physics calculations use world units (wu)
 * - World size: 20w × 10h (width × height)
 * - Positions: world units (0-20 X, 0-10 Y)
 * - Velocities: world units per second (wu/s)
 * - Forces: world units (arbitrary scale matched to mass)
 * 
 * Rationale: World units provide consistent physics behavior across all
 * screen sizes, resolutions, and aspect ratios. The camera system handles
 * conversion between world units and screen pixels.
 * 
 * Coordinate conversion is handled by src/constants/cameraConstants.ts:
 * - screenToWorld() - converts screen pixels to world coordinates
 * - worldToScreen() - converts world coordinates to screen pixels
 */

import { GlobalField } from '../types/physicsTypes';

// ===== AIRBORNE PHYSICS CONSTANTS (after release) =====

/**
 * Scrap Size (world units)
 * 
 * Width and height of scrap items (square).
 * Defined in world units for consistent sizing across all devices.
 * 
 * 0.72 wu = 3.6% of world width (20 wu) = 3.6vw on screen
 */
export const SCRAP_SIZE_WU = 0.72;

/**
 * Scrap Baseline Height (world units)
 * 
 * Vertical position where grounded scrap sits on the assembly line.
 * Measured from bottom of world (Y=0) upward.
 * 
 * 1.2 wu = 12% of world height (10 wu)
 */
export const SCRAP_BASELINE_BOTTOM_WU = 1.2;

/**
 * Scrap Bin Size (world units)
 * 
 * Width and height of the scrap bin (square).
 * Defined in world units for consistent sizing across all devices.
 * 
 * 1.5 wu = 7.5% of world width (20 wu)
 */
export const SCRAP_BIN_SIZE_WU = 1.5;

/**
 * Scrap Bin Position (world units)
 * 
 * World position where the scrap bin is centered.
 * X is horizontal center of world, Y is distance from top.
 * 
 * x: 10 wu = center of 20 wu wide world
 * y: 0.5 wu = near top of world (0.5 wu from top edge)
 */
export const SCRAP_BIN_POSITION_WU = {
  x: 10,  // Center horizontally
  y: 0.5  // Near top (0.5 wu from top edge)
};

/**
 * Assembly Line Height (world units)
 * 
 * Thickness/height of the assembly line track.
 * Defined in world units for consistent sizing across all devices.
 * 
 * 0.1 wu = 1% of world height (10 wu)
 */
export const ASSEMBLY_LINE_HEIGHT_WU = 0.05;

/**
 * Assembly Line Position (world units)
 * 
 * World position where the assembly line is positioned.
 * The line sits at the scrap baseline height, spanning full world width.
 * Y is measured from bottom of world (matches SCRAP_BASELINE_BOTTOM_WU).
 * 
 * x: 0 to WORLD_WIDTH (spans full width)
 * yFromBottom: SCRAP_BASELINE_BOTTOM_WU = 1.2 wu from bottom
 */
export const ASSEMBLY_LINE_POSITION_WU = {
  x: 0,                      // Starts at left edge
  width: 20,                 // Full world width
  yFromBottom: SCRAP_BASELINE_BOTTOM_WU  // Same as scrap baseline
};

/**
 * Gravity Acceleration (world units per second squared)
 * 
 * Downward acceleration applied to airborne scrap.
 * Negative value = downward direction.
 * 
 * -25 wu/s² provides snappy but weighty falls for a 10 wu tall world.
 */
export const GRAVITY_WU_PER_S2 = -25;

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



// ===== DRAG PHYSICS CONSTANTS (during manipulation) =====

/**
 * Maximum Scrap Drag Speed (world units per second)
 * 
 * Speed limit for dragged scrap movement to prevent tunneling and physics breakage.
 * Applied to velocity magnitude during integration, acting as a safety ceiling.
 * 
 * - Mainly constrains light/high-effectiveness scrap during rapid cursor movements
 * - Heavy/low-effectiveness scrap naturally stays below limit due to physics
 * - Higher values (40+): More permissive, allows very fast drags
 * - Lower values (15-25): Tighter control, more predictable interactions
 * 
 * 30 wu/s = can traverse 1.5× world width per second (fast but controlled)
 */
export const MAX_SCRAP_DRAG_SPEED_WU_PER_S = 30;

/**
 * Spring Stiffness (world units)
 * 
 * How strongly the manipulator pulls scrap toward cursor position.
 * This is the "spring constant" in the spring-damper physics model.
 * Force = distance × SPRING_STIFFNESS × effectiveness
 * 
 * - Higher values (80-120): Very strong pull, tight following, minimal swing
 * - Medium values (50-80): Strong pull, responsive with some momentum
 * - Lower values (30-50): Balanced feel, noticeable momentum with control
 * - Very low (10-30): Loose feel, dramatic pendulum swings
 * 
 * 60 wu = fast response with controlled momentum for 20w × 10h world
 * 
 * Note: Scaled by manipulator effectiveness (low effectiveness = weak spring = heavy swinging)
 */
export const SPRING_STIFFNESS_WU = 60;

/**
 * Drag Damping (dimensionless)
 * 
 * Per-frame velocity damping factor to prevent infinite oscillation.
 * Applied as: velocity *= DRAG_DAMPING each frame
 * 
 * - 1.0: No damping (would oscillate forever)
 * - 0.95-0.98: Very light damping, long momentum trails
 * - 0.90-0.94: Light damping, maintains velocity well
 * - 0.85-0.90: Balanced damping, natural feel
 * - 0.7-0.8: Heavy damping, quick stops
 * 
 * 0.96 = light damping, maintains momentum, responsive feel
 * 
 * Note: Works with spring stiffness to create natural spring-damper behavior
 */
export const DRAG_DAMPING = 0.96;


