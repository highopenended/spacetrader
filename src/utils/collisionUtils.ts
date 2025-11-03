/**
 * Collision Detection Utilities
 * 
 * Utility functions for collision detection.
 * Provides type definitions and DOMRect conversion helpers.
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
 * Convert DOMRect to Rect interface
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

