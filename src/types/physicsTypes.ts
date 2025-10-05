/**
 * Physics System Type Definitions
 * 
 * Type definitions for the field-based physics system used in scrap dragging.
 * Supports both global fields (like gravity) and point source fields (like magnets).
 */

/**
 * Global Field - Applied uniformly across entire space
 * 
 * Example: Gravity that pulls everything downward with equal force
 */
export interface GlobalField {
  type: 'global';
  id: string;                    // Unique identifier
  direction: 'up' | 'down' | 'left' | 'right';
  strength: number;              // Force magnitude (arbitrary units)
  description?: string;          // Optional description for debugging
}

/**
 * Point Source Field - Applied from a specific point with distance-based falloff
 * 
 * Example: Magnetic attractor that pulls objects toward it
 */
export interface PointSourceField {
  type: 'pointSource';
  id: string;                    // Unique identifier
  position: { x: number; y: number }; // Position in screen space (px)
  strength: number;              // Force magnitude at distance = 1px
  falloffExponent: number;       // How quickly force decreases with distance (2 = inverse square, 1 = linear, etc.)
  maxRange?: number;             // Optional maximum effective range (px)
  description?: string;          // Optional description for debugging
}

/**
 * Field - Union type of all field types
 */
export type Field = GlobalField | PointSourceField;

/**
 * Physics Context - Complete physics state for calculating effective load
 * 
 * Contains all active fields and player/scrap properties needed for physics calculations.
 */
export interface PhysicsContext {
  // Active fields affecting objects
  globalFields: GlobalField[];
  pointSourceFields: PointSourceField[];
  
  // Player manipulator properties
  manipulatorStrength: number;   // Base strength for moving objects
  manipulatorMaxLoad: number;    // Absolute maximum effective load
  
  // Scrap properties
  scrapMass: number;             // Mass of the scrap being moved
  
  // Current drag direction (for directional field calculations)
  dragDirection?: {
    x: number;                   // -1 to 1 (left to right)
    y: number;                   // -1 to 1 (down to up in screen coords)
  };
}

/**
 * Effective Load Result - Output of effective load calculation
 * 
 * Contains the resolved forces and final effective load for all directions.
 */
export interface EffectiveLoadResult {
  // Cardinal direction loads (after applying all fields)
  loadUp: number;                // Effective load when dragging upward
  loadDown: number;              // Effective load when dragging downward
  loadLeft: number;              // Effective load when dragging left
  loadRight: number;             // Effective load when dragging right
  
  // Final effective load for current drag direction
  effectiveLoad: number;         // Combined load based on drag direction
  
  // Manipulator effectiveness (0% to 100%)
  manipulatorEffectiveness: number; // How effectively the manipulator can move this object
}

