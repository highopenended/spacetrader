/**
 * Barrier Geometry Utilities
 * 
 * SINGLE SOURCE OF TRUTH for barrier position and shape.
 * Both visual rendering and collision detection use these EXACT functions.
 * No duplicate calculations = no mismatches.
 */

import { Barrier } from '../types/barrierTypes';

/**
 * Convert degrees to radians
 */
const degToRad = (degrees: number): number => degrees * (Math.PI / 180);

/**
 * Get the 4 corner vertices of a barrier in world space
 * This is the DEFINITIVE barrier shape - both visual and collision use this.
 * 
 * Coordinate system:
 * - Position: xVw in VW units, bottomVh in VH units
 * - Width in VW, Height in VW (to match CSS which uses vw for both)
 * - But we need to convert height to screen space for Y-axis calculations
 * - Rotation in degrees (0 = horizontal, positive = clockwise like CSS)
 * - Returns corners in mixed units: x in VW, y in VH
 */
export const getBarrierVertices = (barrier: Barrier): Array<{ x: number; y: number }> => {
  const centerX = barrier.position.xVw;  // VW
  const centerY = barrier.position.bottomVh; // VH
  const halfWidth = barrier.width / 2;   // VW
  
  // Convert height from VW to VH for proper Y-axis calculations
  // Since CSS uses height in VW for aspect ratio, we need to convert to same Y-axis units
  const aspectRatio = window.innerWidth / window.innerHeight;
  const halfHeightInVh = (barrier.height / 2) * aspectRatio; // Convert VW to VH
  
  // Convert rotation to radians (negate because CSS is clockwise, math is counter-clockwise)
  const angleRad = -degToRad(barrier.rotation);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Local corners (before rotation, relative to center)
  // X offsets in VW, Y offsets in VH
  const localCorners = [
    { x: -halfWidth, y: -halfHeightInVh }, // Bottom-left
    { x: halfWidth, y: -halfHeightInVh },  // Bottom-right  
    { x: halfWidth, y: halfHeightInVh },   // Top-right
    { x: -halfWidth, y: halfHeightInVh }   // Top-left
  ];
  
  // Rotate each corner and translate to world position
  // After rotation, need to ensure we're still in correct units
  return localCorners.map(corner => {
    // Rotation mixes the axes, so we need to be careful
    // Since corner.x is in VW and corner.y is in VH, this gets complex
    // Let's convert everything to pixels, rotate, then convert back
    
    const cornerXPx = (corner.x / 100) * window.innerWidth;
    const cornerYPx = (corner.y / 100) * window.innerHeight;
    
    const rotatedXPx = cornerXPx * cos - cornerYPx * sin;
    const rotatedYPx = cornerXPx * sin + cornerYPx * cos;
    
    const rotatedXVw = (rotatedXPx / window.innerWidth) * 100;
    const rotatedYVh = (rotatedYPx / window.innerHeight) * 100;
    
    return {
      x: centerX + rotatedXVw,  // VW + VW
      y: centerY + rotatedYVh   // VH + VH
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
 */
export const getBarrierBounds = (barrier: Barrier): { 
  minX: number; 
  maxX: number; 
  minY: number; 
  maxY: number;
} => {
  const vertices = getBarrierVertices(barrier);
  
  return {
    minX: Math.min(...vertices.map(v => v.x)),
    maxX: Math.max(...vertices.map(v => v.x)),
    minY: Math.min(...vertices.map(v => v.y)),
    maxY: Math.max(...vertices.map(v => v.y))
  };
};

