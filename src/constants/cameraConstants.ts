/**
 * Camera and World Constants
 * 
 * Defines the fixed game world size and camera behavior.
 * All physics operates in world units for consistent behavior across devices.
 */

// ===== WORLD DIMENSIONS =====
// Fixed game world size in world units (consistent across all devices)
export const WORLD_WIDTH = 20;  // 20 world units wide
export const WORLD_HEIGHT = 10; // 10 world units tall

/**
 * Calculate camera zoom based on viewport size
 * Zoom is chosen to fit the entire world within the viewport
 * 
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Zoom factor (pixels per world unit)
 */
export const calculateZoom = (viewportWidth: number, viewportHeight: number): number => {
  const zoomX = viewportWidth / WORLD_WIDTH;
  const zoomY = viewportHeight / WORLD_HEIGHT;
  // Use minimum to ensure entire world fits
  return Math.min(zoomX, zoomY);
};

/**
 * Calculate letterbox bars (black space on sides)
 * 
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Object with left, right, top, bottom bar sizes in pixels
 */
export const calculateLetterbox = (viewportWidth: number, viewportHeight: number) => {
  const zoom = calculateZoom(viewportWidth, viewportHeight);
  
  // Calculate world size in pixels at current zoom
  const worldWidthPx = WORLD_WIDTH * zoom;
  const worldHeightPx = WORLD_HEIGHT * zoom;
  
  // Calculate excess space
  const excessWidth = viewportWidth - worldWidthPx;
  const excessHeight = viewportHeight - worldHeightPx;
  
  // Distribute excess space equally on both sides
  const left = Math.max(0, excessWidth / 2);
  const right = Math.max(0, excessWidth / 2);
  const top = Math.max(0, excessHeight / 2);
  const bottom = Math.max(0, excessHeight / 2);
  
  return { left, right, top, bottom };
};

/**
 * Convert screen coordinates (pixels) to world coordinates (world units)
 * 
 * @param screenX - X position in screen pixels
 * @param screenY - Y position in screen pixels (top-left origin)
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns World coordinates
 */
export const screenToWorld = (
  screenX: number,
  screenY: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } => {
  const zoom = calculateZoom(viewportWidth, viewportHeight);
  const letterbox = calculateLetterbox(viewportWidth, viewportHeight);
  
  // Adjust for letterbox offset
  const adjustedX = screenX - letterbox.left;
  const adjustedY = screenY - letterbox.top;
  
  // Convert to world units
  const worldX = adjustedX / zoom;
  const worldY = adjustedY / zoom;
  
  return { x: worldX, y: worldY };
};

/**
 * Convert world coordinates (world units) to screen coordinates (pixels)
 * 
 * @param worldX - X position in world units
 * @param worldY - Y position in world units
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Screen coordinates in pixels
 */
export const worldToScreen = (
  worldX: number,
  worldY: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } => {
  const zoom = calculateZoom(viewportWidth, viewportHeight);
  const letterbox = calculateLetterbox(viewportWidth, viewportHeight);
  
  // Convert to screen pixels
  const screenX = worldX * zoom + letterbox.left;
  const screenY = worldY * zoom + letterbox.top;
  
  return { x: screenX, y: screenY };
};

