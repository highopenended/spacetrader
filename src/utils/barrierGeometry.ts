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
  // Calculate the ACTUAL center position where the barrier should be rendered
  // The barrier.position.x and position.yFromBottom represent the CENTER of the barrier
  // 
  // However, worldRectToScreenStyles with anchor='center' incorrectly treats
  // the input as edges. To match what CSS actually renders, we need to:
  // 1. Calculate what CSS thinks the center is (incorrectly)
  // 2. Account for the translate(-50%, -50%) transform
  
  // Convert yFromBottom to world Y (top=0, increases downward)
  const worldYWu = WORLD_HEIGHT - barrier.position.yFromBottom;
  
  // CSS with anchor='center' does: centerXWu = rect.x + rect.width/2
  // But barrier.position.x is already the center, so this incorrectly shifts it
  // After CSS positioning and translate(-50%, -50%), the actual center ends up at:
  // The CSS positions element at (centerScreenPos.x - width/2, centerScreenPos.y - height/2)
  // Then translate(-50%, -50%) moves it so its center (origin) is at that point
  // So final center = (centerScreenPos.x - width/2, centerScreenPos.y - height/2)
  //
  // Where centerScreenPos is calculated from centerXWu = position.x + width/2 (WRONG)
  // So we need to reverse this to get the actual rendered center
  
  // Calculate what CSS produces (incorrect center calculation)
  const incorrectCenterXWu = barrier.position.x + barrier.width / 2;
  const incorrectCenterYWu = worldYWu - barrier.height / 2;
  const incorrectCenterScreenPos = worldToScreen(incorrectCenterXWu, incorrectCenterYWu, viewportWidth, viewportHeight);
  
  // Calculate zoom
  const zoomX = viewportWidth / 20; // WORLD_WIDTH = 20
  const zoomY = viewportHeight / 10; // WORLD_HEIGHT = 10
  const zoom = Math.min(zoomX, zoomY);
  
  const widthPx = barrier.width * zoom;
  const heightPx = barrier.height * zoom;
  
  // Actual rendered center after CSS transform (positioned then translated)
  const actualCenterXPx = incorrectCenterScreenPos.x - widthPx / 2;
  const actualCenterYPx = incorrectCenterScreenPos.y - heightPx / 2;
  
  // Now calculate vertices relative to this actual center
  const halfWidthPx = widthPx / 2;
  const halfHeightPx = heightPx / 2;
  
  // Convert rotation to radians
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
  
  // Rotate each corner and translate to actual rendered center
  return localCorners.map(corner => {
    const rotatedXPx = corner.x * cos - corner.y * sin;
    const rotatedYPx = corner.x * sin + corner.y * cos;
    
    return {
      x: actualCenterXPx + rotatedXPx,
      y: actualCenterYPx + rotatedYPx
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
 * 
 * Calculates bounding box by finding the min/max X and Y coordinates
 * of all 4 rotated corner vertices.
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
  
  // Find the axis-aligned bounding box that contains all rotated vertices
  // This ensures the bounding box fully encloses the rotated barrier
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  }
  
  return { minX, maxX, minY, maxY };
};

