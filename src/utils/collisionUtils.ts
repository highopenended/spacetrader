/**
 * Collision Detection Utilities
 * 
 * Pure collision detection functions for game objects.
 * Handles AABB (axis-aligned bounding box) collision detection.
 */

/**
 * Rectangle bounds in screen space (pixels)
 */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Check if two rectangles overlap using AABB collision detection
 * 
 * @param rectA - First rectangle
 * @param rectB - Second rectangle
 * @returns True if rectangles overlap
 */
export const checkRectOverlap = (rectA: Rect, rectB: Rect): boolean => {
  return !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
};

/**
 * Convert viewport position to screen rectangle
 * 
 * @param xVw - X position in viewport width units
 * @param bottomVh - Bottom position in viewport height units
 * @param widthVw - Width in viewport width units
 * @param heightVh - Height in viewport height units
 * @returns Rectangle in screen pixels
 */
export const viewportToRect = (
  xVw: number,
  bottomVh: number,
  widthVw: number,
  heightVh: number
): Rect => {
  const left = (xVw / 100) * window.innerWidth;
  const width = (widthVw / 100) * window.innerWidth;
  const height = (heightVh / 100) * window.innerHeight;
  const bottom = (bottomVh / 100) * window.innerHeight;
  
  const top = window.innerHeight - bottom - height;
  const right = left + width;
  const actualBottom = top + height;
  
  return {
    left,
    top,
    right,
    bottom: actualBottom
  };
};

/**
 * Get DOMRect as Rect interface
 * 
 * @param domRect - DOMRect from getBoundingClientRect()
 * @returns Rect interface
 */
export const domRectToRect = (domRect: DOMRect): Rect => {
  return {
    left: domRect.left,
    top: domRect.top,
    right: domRect.right,
    bottom: domRect.bottom
  };
};

