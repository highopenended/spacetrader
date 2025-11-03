/**
 * Barrier Geometry Utilities
 * 
 * SINGLE SOURCE OF TRUTH for barrier position and shape.
 * Both visual rendering and collision detection use these EXACT functions.
 * No duplicate calculations = no mismatches.
 */

import { Barrier } from '../types/barrierTypes';
import { worldToScreen, WORLD_HEIGHT } from '../constants/cameraConstants';

/**
 * Convert degrees to radians
 */
const degToRad = (degrees: number): number => degrees * (Math.PI / 180);

/**
 * Get the 4 corner vertices of a barrier in screen pixel coordinates
 * This is the DEFINITIVE barrier shape - both visual and collision use this.
 * 
 * Coordinate system:
 * - Input: Barrier in world units (x, yFromBottom, width, height in wu)
 * - Rotation in degrees (0 = horizontal, positive = clockwise like CSS)
 * - Returns corners in screen pixels (for collision detection)
 */
export const getBarrierVertices = (
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number
): Array<{ x: number; y: number }> => {
  // Convert barrier center position from world units to screen pixels
  // yFromBottom is measured from bottom, convert to world Y (top=0, increases downward)
  const centerYWu = WORLD_HEIGHT - barrier.position.yFromBottom;
  const centerScreenPos = worldToScreen(barrier.position.x, centerYWu, viewportWidth, viewportHeight);
  
  // Calculate half-dimensions in world units
  const halfWidthWu = barrier.width / 2;
  const halfHeightWu = barrier.height / 2;
  
  // Convert half-dimensions to screen pixels
  // We need to convert world units to pixels for rotation
  const zoomX = viewportWidth / 20; // WORLD_WIDTH = 20
  const zoomY = viewportHeight / 10; // WORLD_HEIGHT = 10
  const zoom = Math.min(zoomX, zoomY);
  
  const halfWidthPx = halfWidthWu * zoom;
  const halfHeightPx = halfHeightWu * zoom;
  
  // Convert rotation to radians
  // In screen coordinates (Y-down), positive angles produce clockwise rotation (same as CSS)
  const angleRad = degToRad(barrier.rotation);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Local corners (before rotation, relative to center) in pixels
  const localCorners = [
    { x: -halfWidthPx, y: -halfHeightPx }, // Bottom-left
    { x: halfWidthPx, y: -halfHeightPx },  // Bottom-right  
    { x: halfWidthPx, y: halfHeightPx },   // Top-right
    { x: -halfWidthPx, y: halfHeightPx }   // Top-left
  ];
  
  // Rotate each corner and translate to screen position
  return localCorners.map(corner => {
    const rotatedXPx = corner.x * cos - corner.y * sin;
    const rotatedYPx = corner.x * sin + corner.y * cos;
    
    return {
      x: centerScreenPos.x + rotatedXPx,  // Screen pixels
      y: centerScreenPos.y + rotatedYPx   // Screen pixels (top=0, increases downward)
    };
  });
};

/**
 * Get CSS transform string for barrier
 * Uses same geometry calculations as collision
 */
export const getBarrierTransform = (barrier: Barrier): string => {
  // Center the element at its position, then rotate
  // This matches how we calculate vertices above
  return `translate(-50%, -50%) rotate(${barrier.rotation}deg)`;
};

/**
 * Get barrier bounding box (axis-aligned, for quick overlap checks)
 * Returns bounding box in screen pixels
 */
export const getBarrierBounds = (
  barrier: Barrier,
  viewportWidth: number,
  viewportHeight: number
): { 
  minX: number; 
  maxX: number; 
  minY: number; 
  maxY: number;
} => {
  const vertices = getBarrierVertices(barrier, viewportWidth, viewportHeight);
  
  return {
    minX: Math.min(...vertices.map(v => v.x)),
    maxX: Math.max(...vertices.map(v => v.x)),
    minY: Math.min(...vertices.map(v => v.y)),
    maxY: Math.max(...vertices.map(v => v.y))
  };
};

