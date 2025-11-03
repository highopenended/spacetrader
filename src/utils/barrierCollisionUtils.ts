/**
 * Barrier Collision Utilities
 * 
 * Handles collision detection and response for barriers.
 * Uses Circle-to-OBB collision (scrap is circular, barriers are rotated rectangles).
 * 
 * Coordinate system:
 * - All positions and sizes in screen pixels
 * - Velocities in pixels per second
 * - Barriers are converted from world units to pixels for collision detection
 * - Scrap treated as circles (matching visual appearance)
 */

import { Barrier, BarrierCollision } from '../types/barrierTypes';
import { getBarrierVertices as getSharedBarrierVertices, getBarrierBounds } from './barrierGeometry';
import { SCRAP_SIZE_WU } from '../constants/physicsConstants';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants/cameraConstants';

/**
 * Debug mode: Show bounding box overlays for barriers
 * - Green: Bounding box has overlapping scrap
 * - Red: No scrap overlapping bounding box
 */
export const DEBUG_BARRIER_BOUNDS = true;

/**
 * Module-level state tracking which barriers have overlapping bounding boxes
 * Updated during collision detection, read by debug rendering
 */
const barrierOverlapState = new Map<string, boolean>();

/**
 * 2D vector operations
 */
const vec2 = {
  dot: (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.x + a.y * b.y,
  length: (v: { x: number; y: number }) => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: { x: number; y: number }) => {
    const len = vec2.length(v);
    return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
  },
  subtract: (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v: { x: number; y: number }, s: number) => ({ x: v.x * s, y: v.y * s })
};

/**
 * Calculate scrap radius in pixels from viewport dimensions
 */
const getScrapRadiusPx = (viewportWidth: number, viewportHeight: number): number => {
  // Calculate zoom factor to convert world units to pixels
  const zoomX = viewportWidth / WORLD_WIDTH;
  const zoomY = viewportHeight / WORLD_HEIGHT;
  const zoom = Math.min(zoomX, zoomY);
  
  // Scrap is circular with diameter = SCRAP_SIZE_WU
  return (SCRAP_SIZE_WU / 2) * zoom;
};

/**
 * Find closest point on an OBB (Oriented Bounding Box) to a given point
 * Returns the closest point on or inside the OBB
 */
const closestPointOnOBB = (
  point: { x: number; y: number },
  obbCenter: { x: number; y: number },
  obbHalfExtents: { width: number; height: number },
  obbRotationRad: number
): { x: number; y: number } => {
  // Transform point to OBB's local space (undo rotation)
  const cos = Math.cos(-obbRotationRad);
  const sin = Math.sin(-obbRotationRad);
  const dx = point.x - obbCenter.x;
  const dy = point.y - obbCenter.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  // Clamp to box extents in local space
  const clampedX = Math.max(-obbHalfExtents.width, Math.min(obbHalfExtents.width, localX));
  const clampedY = Math.max(-obbHalfExtents.height, Math.min(obbHalfExtents.height, localY));
  
  // Transform back to world space (apply rotation)
  const cos2 = Math.cos(obbRotationRad);
  const sin2 = Math.sin(obbRotationRad);
  const worldX = clampedX * cos2 - clampedY * sin2 + obbCenter.x;
  const worldY = clampedX * sin2 + clampedY * cos2 + obbCenter.y;
  
  return { x: worldX, y: worldY };
};

/**
 * Check if circle overlaps with OBB (Oriented Bounding Box)
 * Returns collision info with penetration depth and normal
 */
const checkCircleOBBCollision = (
  circleCenter: { x: number; y: number },
  circleRadius: number,
  barrierVertices: Array<{ x: number; y: number }>,
  barrierRotationRad: number
): { collides: boolean; penetration: number; normal: { x: number; y: number } | null; closestPoint: { x: number; y: number } | null } => {
  // Calculate barrier center and half-extents from vertices
  const barrierCenter = {
    x: barrierVertices.reduce((sum, v) => sum + v.x, 0) / barrierVertices.length,
    y: barrierVertices.reduce((sum, v) => sum + v.y, 0) / barrierVertices.length
  };
  
  // Calculate half-extents (distance from center to edge)
  const v0 = barrierVertices[0];
  const v1 = barrierVertices[1];
  const v3 = barrierVertices[3];
  const halfWidth = vec2.length(vec2.subtract(v1, v0)) / 2;
  const halfHeight = vec2.length(vec2.subtract(v3, v0)) / 2;
  
  // Find closest point on OBB to circle center
  const closest = closestPointOnOBB(
    circleCenter,
    barrierCenter,
    { width: halfWidth, height: halfHeight },
    barrierRotationRad
  );
  
  // Calculate distance from circle center to closest point
  const distance = vec2.length(vec2.subtract(circleCenter, closest));
  
  // Check collision
  if (distance >= circleRadius) {
    return { collides: false, penetration: 0, normal: null, closestPoint: null };
  }
  
  // Calculate penetration depth and collision normal
  const penetration = circleRadius - distance;
  
  // Normal points from closest point toward circle center
  let normal: { x: number; y: number };
  if (distance > 0.0001) {
    // Circle center is outside/on edge of OBB - normal is from closest point to center
    const diff = vec2.subtract(circleCenter, closest);
    normal = vec2.normalize(diff);
  } else {
    // Circle center is inside OBB - need to find shortest exit direction
    // Use the direction from barrier center to circle center
    const diff = vec2.subtract(circleCenter, barrierCenter);
    normal = vec2.length(diff) > 0.0001 ? vec2.normalize(diff) : { x: 0, y: -1 }; // Default to up if coincident
  }
  
  return { collides: true, penetration, normal, closestPoint: closest };
};

/**
 * Broad-phase collision detection: Check if circle bounding box overlaps barrier bounding box
 * Fast approximate check before expensive circle-to-OBB calculation
 */
const checkBoundingBoxOverlap = (
  scrapCenterXPx: number,
  scrapCenterYPx: number,
  scrapRadiusPx: number,
  barrierBounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean => {
  // Circle bounding box
  const scrapMinX = scrapCenterXPx - scrapRadiusPx;
  const scrapMaxX = scrapCenterXPx + scrapRadiusPx;
  const scrapMinY = scrapCenterYPx - scrapRadiusPx;
  const scrapMaxY = scrapCenterYPx + scrapRadiusPx;
  
  // Check if bounding boxes overlap (AABB collision)
  return !(
    scrapMaxX < barrierBounds.minX ||  // Scrap is to the left
    scrapMinX > barrierBounds.maxX ||  // Scrap is to the right
    scrapMaxY < barrierBounds.minY ||  // Scrap is above
    scrapMinY > barrierBounds.maxY     // Scrap is below
  );
};

/**
 * Check collision between circular scrap and rotated barrier rectangle
 * Uses broad-phase (bounding box) check first, then narrow-phase (circle-to-OBB)
 * Supports swept collision detection to prevent tunneling
 * 
 * @param scrapCenterXPx - Scrap center X position (screen pixels)
 * @param scrapCenterYPx - Scrap center Y position (screen pixels, top=0)
 * @param velocity - Scrap velocity (pixels per second)
 * @param barrier - Barrier to check against (in world units)
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @param prevScrapCenterYPx - Optional previous center Y position for swept detection
 * @returns Collision result with normal, reflected velocity, and corrected position
 */
export const checkBarrierCollision = (
  scrapCenterXPx: number,
  scrapCenterYPx: number,
  velocity: { vx: number; vy: number },
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number,
  prevScrapCenterYPx?: number
): BarrierCollision => {
  // Calculate scrap radius in pixels
  const scrapRadiusPx = getScrapRadiusPx(viewportWidth, viewportHeight);
  
  // BROAD-PHASE: Check bounding box overlap first (fast approximate check)
  const barrierBounds = getBarrierBounds(barrier, viewportWidth, viewportHeight);
  const boundingBoxOverlaps = checkBoundingBoxOverlap(
    scrapCenterXPx,
    scrapCenterYPx,
    scrapRadiusPx,
    barrierBounds
  );
  
  // Early exit: no bounding box overlap means no collision possible
  if (!boundingBoxOverlaps) {
    return {
      collided: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      newVelocity: velocity
    };
  }
  
  // NARROW-PHASE: Bounding boxes overlap, check precise geometric collision
  // Convert barrier from world units to screen pixels for collision detection
  const barrierVertices = getSharedBarrierVertices(barrier, viewportWidth, viewportHeight);
  const barrierRotationRad = (barrier.rotation * Math.PI) / 180;
  
  // SWEPT COLLISION DETECTION: Check intermediate positions to prevent tunneling
  // If previous position provided and scrap moved significantly, check the path
  if (prevScrapCenterYPx !== undefined) {
    const movementPx = Math.abs(scrapCenterYPx - prevScrapCenterYPx);
    const thresholdPx = scrapRadiusPx; // If moved more than radius
    
    if (movementPx > thresholdPx) {
      // Sub-step through the movement path
      const numSteps = Math.ceil(movementPx / thresholdPx);
      
      for (let i = 1; i <= numSteps; i++) {
        const t = i / numSteps;
        const interpCenterY = prevScrapCenterYPx + (scrapCenterYPx - prevScrapCenterYPx) * t;
        
        const interpCollision = checkCircleOBBCollision(
          { x: scrapCenterXPx, y: interpCenterY },
          scrapRadiusPx,
          barrierVertices,
          barrierRotationRad
        );
        
        if (interpCollision.collides && interpCollision.normal) {
          // Found collision along path! Use this position for collision response
          const result = resolveCollision(
            { x: scrapCenterXPx, y: interpCenterY },
            scrapRadiusPx,
            velocity,
            barrier,
            interpCollision.normal,
            interpCollision.penetration
          );
          return result;
        }
      }
    }
  }
  
  // Standard discrete collision check at current position
  const collision = checkCircleOBBCollision(
    { x: scrapCenterXPx, y: scrapCenterYPx },
    scrapRadiusPx,
    barrierVertices,
    barrierRotationRad
  );
  
  if (!collision.collides || !collision.normal) {
    // No collision
    return {
      collided: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      newVelocity: velocity
    };
  }
  
  // Resolve collision at current position
  return resolveCollision(
    { x: scrapCenterXPx, y: scrapCenterYPx },
    scrapRadiusPx,
    velocity,
    barrier,
    collision.normal,
    collision.penetration
  );
};

/**
 * Helper: Resolve collision response given circle center, collision normal, and penetration
 * Calculates reflected velocity and corrected position
 */
const resolveCollision = (
  scrapCenter: { x: number; y: number },
  scrapRadiusPx: number,
  velocity: { vx: number; vy: number },
  barrier: Barrier,
  normal: { x: number; y: number },
  penetration: number
): BarrierCollision => {
  // Push scrap out of barrier along collision normal
  const correctedCenterX = scrapCenter.x + normal.x * penetration;
  const correctedCenterY = scrapCenter.y + normal.y * penetration;
  
  // Calculate reflected velocity using: v' = v - (1 + restitution) × (v · n) × n
  const RESTITUTION = barrier.restitution;
  const FRICTION = barrier.friction;
  
  const velocityVec = { x: velocity.vx, y: velocity.vy };
  const velocityDotNormal = vec2.dot(velocityVec, normal);
  
  // If velocity into surface is very small, treat as resting contact (no bounce)
  const RESTING_THRESHOLD = 5; // pixels/s - below this, no bounce
  const isResting = Math.abs(velocityDotNormal) < RESTING_THRESHOLD;
  
  let reflectedVelocity;
  if (isResting) {
    // Resting contact: just zero out velocity into surface, keep tangential
    const tangent = { x: -normal.y, y: normal.x };
    const tangentVelocity = vec2.dot(velocityVec, tangent);
    reflectedVelocity = vec2.scale(tangent, tangentVelocity);
  } else {
    // Moving contact: apply reflection with restitution
    const reflectionScale = (1 + RESTITUTION) * velocityDotNormal;
    const reflection = vec2.scale(normal, reflectionScale);
    reflectedVelocity = vec2.subtract(velocityVec, reflection);
  }
  
  // Apply friction to tangential component
  // Tangent is perpendicular to normal
  const tangent = { x: -normal.y, y: normal.x };
  const tangentVelocity = vec2.dot(reflectedVelocity, tangent);
  const frictionDamping = 1 - FRICTION * 0.5; // Scale friction effect
  const dampedTangentVelocity = tangentVelocity * frictionDamping;
  
  // Reconstruct velocity from normal and tangent components
  const normalComponent = vec2.scale(normal, vec2.dot(reflectedVelocity, normal));
  const tangentComponent = vec2.scale(tangent, dampedTangentVelocity);
  
  const finalVelocity = {
    vx: normalComponent.x + tangentComponent.x,
    vy: normalComponent.y + tangentComponent.y
  };
  
  return {
    collided: true,
    normal,
    penetration,
    newVelocity: finalVelocity,
    correctedPositionPx: {
      x: correctedCenterX,
      y: correctedCenterY
    }
  };
};

/**
 * Check if scrap overlaps barrier bounding box and update debug state
 * Used for debug visualization
 */
export const checkAndUpdateBarrierOverlap = (
  scrapCenterXPx: number,
  scrapCenterYPx: number,
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number
): boolean => {
  if (!DEBUG_BARRIER_BOUNDS) return false;
  
  const scrapRadiusPx = getScrapRadiusPx(viewportWidth, viewportHeight);
  const barrierBounds = getBarrierBounds(barrier, viewportWidth, viewportHeight);
  const overlaps = checkBoundingBoxOverlap(
    scrapCenterXPx,
    scrapCenterYPx,
    scrapRadiusPx,
    barrierBounds
  );
  
  if (overlaps) {
    barrierOverlapState.set(barrier.id, true);
  }
  
  return overlaps;
};

/**
 * Get whether a barrier's bounding box currently has overlapping scrap
 * Used for debug visualization
 * 
 * @param barrierId - Barrier ID to check
 * @returns true if bounding box has overlap, false otherwise
 */
export const getBarrierOverlapState = (barrierId: string): boolean => {
  return barrierOverlapState.get(barrierId) || false;
};

/**
 * Clear overlap state for all barriers (call at start of frame)
 */
export const clearBarrierOverlapState = (): void => {
  barrierOverlapState.clear();
};


