/**
 * Barrier Collision Utilities
 * 
 * Handles collision detection and response for barriers.
 * Uses Oriented Bounding Box (OBB) collision for rotated rectangles.
 * 
 * Coordinate system:
 * - Positions in vw/vh units
 * - Velocities in vp/s (viewport-min per second)
 * - Rotation in degrees (0 = horizontal, positive = counter-clockwise)
 */

import { Barrier, BarrierCollision } from '../types/barrierTypes';
import { getBarrierVertices as getSharedBarrierVertices } from './barrierGeometry';

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
 * Get vertices for scrap rectangle (always axis-aligned, no rotation)
 */
const getScrapVertices = (
  centerX: number,
  centerY: number,
  width: number,
  height: number
): Array<{ x: number; y: number }> => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  return [
    { x: centerX - halfWidth, y: centerY - halfHeight }, // Bottom-left
    { x: centerX + halfWidth, y: centerY - halfHeight }, // Bottom-right
    { x: centerX + halfWidth, y: centerY + halfHeight }, // Top-right
    { x: centerX - halfWidth, y: centerY + halfHeight }  // Top-left
  ];
};

/**
 * Project polygon onto axis and return min/max
 */
const projectPolygon = (vertices: Array<{ x: number; y: number }>, axis: { x: number; y: number }) => {
  let min = vec2.dot(vertices[0], axis);
  let max = min;
  
  for (let i = 1; i < vertices.length; i++) {
    const p = vec2.dot(vertices[i], axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  
  return { min, max };
};

/**
 * Check if two rectangles overlap using SAT (Separating Axis Theorem)
 * Returns overlap amount and axis if collision detected
 */
const checkRectangleOverlap = (
  rect1Vertices: Array<{ x: number; y: number }>,
  rect2Vertices: Array<{ x: number; y: number }>
): { overlaps: boolean; minOverlap: number; separatingAxis: { x: number; y: number } | null } => {
  const axes: Array<{ x: number; y: number }> = [];
  
  // Get axes from both rectangles (perpendicular to edges)
  const addAxes = (vertices: Array<{ x: number; y: number }>) => {
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const edge = vec2.subtract(v2, v1);
      // Perpendicular to edge (normalized)
      const axis = vec2.normalize({ x: -edge.y, y: edge.x });
      axes.push(axis);
    }
  };
  
  addAxes(rect1Vertices);
  addAxes(rect2Vertices);
  
  let minOverlap = Infinity;
  let separatingAxis: { x: number; y: number } | null = null;
  
  // Test all axes
  for (const axis of axes) {
    const proj1 = projectPolygon(rect1Vertices, axis);
    const proj2 = projectPolygon(rect2Vertices, axis);
    
    const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
    
    if (overlap < 0) {
      // Found separating axis - no collision
      return { overlaps: false, minOverlap: 0, separatingAxis: null };
    }
    
    // Track minimum overlap and axis
    if (overlap < minOverlap) {
      minOverlap = overlap;
      separatingAxis = axis;
    }
  }
  
  // All axes overlap - collision detected
  return { overlaps: true, minOverlap, separatingAxis };
};

/**
 * Check collision between scrap and rotated barrier rectangle
 * Uses actual geometric rectangle-rectangle intersection (SAT algorithm)
 * Supports swept collision detection to prevent tunneling
 * 
 * @param scrapXVw - Scrap left X position (vw)
 * @param scrapBottomVh - Scrap bottom position (vh)
 * @param scrapWidthVw - Scrap width (vw)
 * @param scrapHeightVh - Scrap height (vh)
 * @param velocity - Scrap velocity (vp/s)
 * @param barrier - Barrier to check against
 * @param prevScrapBottomVh - Optional previous position for swept detection
 * @returns Collision result with normal and reflected velocity
 */
export const checkBarrierCollision = (
  scrapXVw: number,
  scrapBottomVh: number,
  scrapWidthVw: number,
  scrapHeightVh: number,
  velocity: { vx: number; vy: number },
  barrier: Barrier,
  prevScrapBottomVh?: number
): BarrierCollision => {
  // SWEPT COLLISION DETECTION: Check intermediate positions to prevent tunneling
  // If previous position provided and scrap moved significantly, check the path
  if (prevScrapBottomVh !== undefined) {
    const movementVh = Math.abs(scrapBottomVh - prevScrapBottomVh);
    const thresholdVh = scrapHeightVh * 0.5; // If moved more than half scrap height
    
    if (movementVh > thresholdVh) {
      // Sub-step through the movement path
      const numSteps = Math.ceil(movementVh / thresholdVh);
      
      for (let i = 1; i <= numSteps; i++) {
        const t = i / numSteps;
        const interpY = prevScrapBottomVh + (scrapBottomVh - prevScrapBottomVh) * t;
        const interpCenterY = interpY + scrapHeightVh / 2;
        
        const interpVertices = getScrapVertices(
          scrapXVw + scrapWidthVw / 2,
          interpCenterY,
          scrapWidthVw,
          scrapHeightVh
        );
        
        const barrierVertices = getSharedBarrierVertices(barrier);
        const interpCollision = checkRectangleOverlap(interpVertices, barrierVertices);
        
        if (interpCollision.overlaps && interpCollision.separatingAxis) {
          // Found collision along path! Use this position for collision response
          const result = resolveCollision(
            scrapXVw + scrapWidthVw / 2,
            interpCenterY,
            scrapWidthVw,
            scrapHeightVh,
            velocity,
            barrier,
            {
              minOverlap: interpCollision.minOverlap,
              separatingAxis: interpCollision.separatingAxis
            }
          );
          // Return the interpolated Y position so scrap can be placed there
          result.correctedPositionVh = interpY;
          return result;
        }
      }
    }
  }
  
  // Standard discrete collision check at current position
  const scrapCenterX = scrapXVw + scrapWidthVw / 2;
  const scrapCenterY = scrapBottomVh + scrapHeightVh / 2;
  const scrapVertices = getScrapVertices(scrapCenterX, scrapCenterY, scrapWidthVw, scrapHeightVh);
  
  // Use SHARED geometry calculation for barrier - guarantees visual matches collision
  const barrierVertices = getSharedBarrierVertices(barrier);
  
  // Check ACTUAL geometric overlap using SAT
  const collision = checkRectangleOverlap(scrapVertices, barrierVertices);
  
  if (!collision.overlaps || !collision.separatingAxis) {
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
    scrapCenterX,
    scrapCenterY,
    scrapWidthVw,
    scrapHeightVh,
    velocity,
    barrier,
    {
      minOverlap: collision.minOverlap,
      separatingAxis: collision.separatingAxis
    }
  );
};

/**
 * Helper: Resolve collision response given an overlap detection result
 */
const resolveCollision = (
  scrapCenterX: number,
  scrapCenterY: number,
  scrapWidthVw: number,
  scrapHeightVh: number,
  velocity: { vx: number; vy: number },
  barrier: Barrier,
  collision: { minOverlap: number; separatingAxis: { x: number; y: number } }
): BarrierCollision => {
  // Use the separating axis as the collision normal
  let normal = collision.separatingAxis;
  const penetration = collision.minOverlap;
  
  // Ensure normal points from barrier toward scrap (for correct bounce direction)
  const barrierCenterX = barrier.position.xVw;
  const barrierCenterY = barrier.position.bottomVh;
  const toScrap = vec2.subtract({ x: scrapCenterX, y: scrapCenterY }, { x: barrierCenterX, y: barrierCenterY });
  if (vec2.dot(normal, toScrap) < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  
  // Calculate reflected velocity using: v' = v - (1 + restitution) × (v · n) × n
  const velocityVec = { x: velocity.vx, y: velocity.vy };
  const velocityDotNormal = vec2.dot(velocityVec, normal);
  
  // If velocity into surface is very small, treat as resting contact (no bounce)
  const RESTING_THRESHOLD = 5; // vp/s - below this, no bounce
  const isResting = Math.abs(velocityDotNormal) < RESTING_THRESHOLD;
  
  let reflectedVelocity;
  if (isResting) {
    // Resting contact: just zero out velocity into surface, keep tangential
    const tangent = { x: -normal.y, y: normal.x };
    const tangentVelocity = vec2.dot(velocityVec, tangent);
    reflectedVelocity = vec2.scale(tangent, tangentVelocity);
  } else {
    // Moving contact: apply reflection with restitution
    const reflectionScale = (1 + barrier.restitution) * velocityDotNormal;
    const reflection = vec2.scale(normal, reflectionScale);
    reflectedVelocity = vec2.subtract(velocityVec, reflection);
  }
  
  // Apply friction to tangential component
  // Tangent is perpendicular to normal
  const tangent = { x: -normal.y, y: normal.x };
  const tangentVelocity = vec2.dot(reflectedVelocity, tangent);
  const frictionDamping = 1 - barrier.friction * 0.5; // Scale friction effect
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
    newVelocity: finalVelocity
  };
};

/**
 * Get barrier corner vertices in world space (for rendering/debugging)
 * Uses shared geometry calculation
 * 
 * @param barrier - Barrier to get vertices for
 * @returns Array of 4 corner points [bottomLeft, bottomRight, topRight, topLeft]
 */
export const getBarrierVertices = (barrier: Barrier): Array<{ xVw: number; bottomVh: number }> => {
  const vertices = getSharedBarrierVertices(barrier);
  return vertices.map(v => ({ xVw: v.x, bottomVh: v.y }));
};

