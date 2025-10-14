/**
 * Barrier System Type Definitions
 * 
 * Defines barriers that scrap can collide with and bounce off.
 * Barriers are static obstacles with rotation, position, and physical properties.
 */

/**
 * Barrier - Static obstacle that scrap interacts with
 */
export interface Barrier {
  id: string;                      // Unique identifier
  position: {
    xVw: number;                   // Center X position (viewport width units)
    bottomVh: number;              // Center bottom position (viewport height units)
  };
  width: number;                   // Width in vw
  height: number;                  // Height (thickness) in vw
  rotation: number;                // Rotation in degrees (0 = horizontal)
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
  penetration: number;             // How far scrap penetrated (vp units)
  newVelocity: { vx: number; vy: number }; // Reflected velocity (vp/s)
}

