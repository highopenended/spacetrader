/**
 * Barrier System Type Definitions
 * 
 * Defines barriers that scrap can collide with and bounce off.
 * Barriers are static obstacles with rotation, position, and physical properties.
 */

/**
 * Barrier - Static obstacle that scrap interacts with
 * 
 * All positions and dimensions in world units (wu).
 * World size: 20w × 10h (top-left is 0,0; bottom-right is 20,10).
 */
export interface Barrier {
  id: string;                      // Unique identifier
  position: {
    x: number;                     // Center X position (world units, 0-20)
    yFromBottom: number;           // Center Y position from bottom (world units, 0-10)
  };
  width: number;                   // Width in world units
  height: number;                  // Height (thickness) in world units
  rotation: number;                // Rotation in degrees (0 = horizontal, positive = clockwise like CSS)
  restitution: number;             // Bounciness (0 = no bounce, 1 = perfect bounce)
  friction: number;                // Friction coefficient (0 = ice, 1 = sticky)
  enabled: boolean;                // Whether collision detection is active
  visual?: {
    color?: string;                // Override default color
    opacity?: number;              // Override default opacity
  };
}

/**
 * Collision result from barrier collision check
 */
export interface BarrierCollision {
  collided: boolean;               // Whether collision occurred
  normal: { x: number; y: number }; // Surface normal vector (unit vector)
  penetration: number;             // How far scrap penetrated (in pixels)
  newVelocity: { vx: number; vy: number }; // Reflected velocity (in pixels per second)
  correctedPositionPx?: { x: number; y: number }; // If swept collision, the screen position to place scrap at
}

