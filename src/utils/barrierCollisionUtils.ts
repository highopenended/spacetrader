/**
 * Barrier Collision Utilities
 * 
 * Handles collision detection and response for barriers.
 * Uses Oriented Bounding Box (OBB) collision for rotated rectangles.
 * 
 * Coordinate system:
 * - All positions and sizes in screen pixels
 * - Velocities in pixels per second
 * - Barriers are converted from world units to pixels for collision detection
 */

import { Barrier, BarrierCollision } from '../types/barrierTypes';
import { getBarrierVertices as getSharedBarrierVertices, getBarrierBounds } from './barrierGeometry';

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
 * Broad-phase collision detection: Check if axis-aligned bounding boxes overlap
 * Fast approximate check before expensive SAT algorithm
 */
const checkBoundingBoxOverlap = (
  scrapLeftXPx: number,
  scrapTopYPx: number,
  scrapWidthPx: number,
  scrapHeightPx: number,
  barrierBounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean => {
  const scrapRightXPx = scrapLeftXPx + scrapWidthPx;
  const scrapBottomYPx = scrapTopYPx + scrapHeightPx;
  
  // Check if bounding boxes overlap (AABB collision)
  return !(
    scrapRightXPx < barrierBounds.minX ||  // Scrap is to the left
    scrapLeftXPx > barrierBounds.maxX ||   // Scrap is to the right
    scrapBottomYPx < barrierBounds.minY || // Scrap is above
    scrapTopYPx > barrierBounds.maxY       // Scrap is below
  );
};

/**
 * Check collision between scrap and rotated barrier rectangle
 * Uses broad-phase (bounding box) check first, then narrow-phase (SAT algorithm)
 * Supports swept collision detection to prevent tunneling
 * 
 * @param scrapLeftXPx - Scrap left X position (screen pixels)
 * @param scrapTopYPx - Scrap top Y position (screen pixels, top=0)
 * @param scrapWidthPx - Scrap width (screen pixels)
 * @param scrapHeightPx - Scrap height (screen pixels)
 * @param velocity - Scrap velocity (pixels per second)
 * @param barrier - Barrier to check against (in world units)
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @param prevScrapTopYPx - Optional previous top Y position for swept detection
 * @returns Collision result with normal and reflected velocity
 */
export const checkBarrierCollision = (
  scrapLeftXPx: number,
  scrapTopYPx: number,
  scrapWidthPx: number,
  scrapHeightPx: number,
  velocity: { vx: number; vy: number },
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number,
  prevScrapTopYPx?: number
): BarrierCollision => {
  // BROAD-PHASE: Check bounding box overlap first (fast approximate check)
  const barrierBounds = getBarrierBounds(barrier, viewportWidth, viewportHeight);
  const boundingBoxOverlaps = checkBoundingBoxOverlap(
    scrapLeftXPx,
    scrapTopYPx,
    scrapWidthPx,
    scrapHeightPx,
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
  
  // SWEPT COLLISION DETECTION: Check intermediate positions to prevent tunneling
  // If previous position provided and scrap moved significantly, check the path
  if (prevScrapTopYPx !== undefined) {
    const movementPx = Math.abs(scrapTopYPx - prevScrapTopYPx);
    const thresholdPx = scrapHeightPx * 0.5; // If moved more than half scrap height
    
    if (movementPx > thresholdPx) {
      // Sub-step through the movement path
      const numSteps = Math.ceil(movementPx / thresholdPx);
      
      for (let i = 1; i <= numSteps; i++) {
        const t = i / numSteps;
        const interpTopY = prevScrapTopYPx + (scrapTopYPx - prevScrapTopYPx) * t;
        const interpCenterY = interpTopY + scrapHeightPx / 2;
        
        const interpVertices = getScrapVertices(
          scrapLeftXPx + scrapWidthPx / 2,
          interpCenterY,
          scrapWidthPx,
          scrapHeightPx
        );
        
        const interpCollision = checkRectangleOverlap(interpVertices, barrierVertices);
        
        if (interpCollision.overlaps && interpCollision.separatingAxis) {
          // Found collision along path! Use this position for collision response
          const result = resolveCollision(
            scrapLeftXPx + scrapWidthPx / 2,
            interpCenterY,
            scrapWidthPx,
            scrapHeightPx,
            velocity,
            barrierVertices,
            barrier,
            {
              minOverlap: interpCollision.minOverlap,
              separatingAxis: interpCollision.separatingAxis
            }
          );
          // Return the interpolated position so scrap can be placed there
          result.correctedPositionPx = {
            x: scrapLeftXPx,
            y: interpTopY
          };
          return result;
        }
      }
    }
  }
  
  // Standard discrete collision check at current position
  const scrapCenterX = scrapLeftXPx + scrapWidthPx / 2;
  const scrapCenterY = scrapTopYPx + scrapHeightPx / 2;
  const scrapVertices = getScrapVertices(scrapCenterX, scrapCenterY, scrapWidthPx, scrapHeightPx);
  
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
    scrapWidthPx,
    scrapHeightPx,
    velocity,
    barrierVertices,
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
  scrapWidthPx: number,
  scrapHeightPx: number,
  velocity: { vx: number; vy: number },
  barrierVertices: Array<{ x: number; y: number }>,
  barrier: Barrier,
  collision: { minOverlap: number; separatingAxis: { x: number; y: number } }
): BarrierCollision => {
  // Use the separating axis as the collision normal
  let normal = collision.separatingAxis;
  const penetration = collision.minOverlap;
  
  // Calculate barrier center from vertices
  const barrierCenterX = barrierVertices.reduce((sum, v) => sum + v.x, 0) / barrierVertices.length;
  const barrierCenterY = barrierVertices.reduce((sum, v) => sum + v.y, 0) / barrierVertices.length;
  
  // Ensure normal points from barrier toward scrap (for correct bounce direction)
  const toScrap = vec2.subtract({ x: scrapCenterX, y: scrapCenterY }, { x: barrierCenterX, y: barrierCenterY });
  if (vec2.dot(normal, toScrap) < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  
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
    newVelocity: finalVelocity
  };
};

/**
 * Check if scrap overlaps barrier bounding box and update debug state
 * Used for debug visualization
 */
export const checkAndUpdateBarrierOverlap = (
  scrapLeftXPx: number,
  scrapTopYPx: number,
  scrapWidthPx: number,
  scrapHeightPx: number,
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number
): boolean => {
  if (!DEBUG_BARRIER_BOUNDS) return false;
  
  const barrierBounds = getBarrierBounds(barrier, viewportWidth, viewportHeight);
  const overlaps = checkBoundingBoxOverlap(
    scrapLeftXPx,
    scrapTopYPx,
    scrapWidthPx,
    scrapHeightPx,
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


