/**
 * Camera Utilities
 * 
 * Helper functions for converting between world coordinates and screen coordinates.
 * These utilities simplify common patterns used throughout the codebase.
 */

import { worldToScreen, calculateZoom, WORLD_HEIGHT } from '../constants/cameraConstants';

/**
 * Convert a world unit size to screen pixels
 * 
 * @param sizeWu - Size in world units
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Size in screen pixels
 */
export const worldSizeToPixels = (
  sizeWu: number,
  viewportWidth: number,
  viewportHeight: number
): number => {
  const zoom = calculateZoom(viewportWidth, viewportHeight);
  return sizeWu * zoom;
};

/**
 * World rectangle definition
 * 
 * Supports two Y coordinate systems:
 * - y: Y coordinate from top (Y=0 is top, Y=WORLD_HEIGHT is bottom)
 * - yFromBottom: Y coordinate from bottom (Y=0 is bottom, increases upward)
 */
export interface WorldRect {
  x: number;                    // X position in world units (left edge)
  y?: number;                   // Y position from top (mutually exclusive with yFromBottom)
  yFromBottom?: number;         // Y position from bottom (mutually exclusive with y)
  width: number;                // Width in world units
  height: number;              // Height in world units
  anchor?: 'top-left' | 'center' | 'bottom-left'; // Positioning anchor (default: 'top-left')
}

/**
 * Convert a world rectangle to CSS positioning styles
 * 
 * Handles coordinate conversion, letterboxing, and CSS positioning.
 * 
 * @param rect - World rectangle definition
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns CSS styles object for React
 */
export const worldRectToScreenStyles = (
  rect: WorldRect,
  viewportWidth: number,
  viewportHeight: number
): React.CSSProperties => {
  // Convert Y coordinate (from bottom or from top)
  let worldYWu: number;
  if (rect.yFromBottom !== undefined) {
    // Convert from bottom-based to top-based coordinate
    worldYWu = WORLD_HEIGHT - rect.yFromBottom;
  } else if (rect.y !== undefined) {
    worldYWu = rect.y;
  } else {
    throw new Error('WorldRect must specify either y or yFromBottom');
  }

  const anchor = rect.anchor || 'top-left';
  
  if (anchor === 'center') {
    // Center-anchored: calculate center position, then convert to top-left for CSS
    const centerXWu = rect.x + rect.width / 2;
    const centerYWu = worldYWu - rect.height / 2; // Y increases downward in world coords
    
    const centerScreenPos = worldToScreen(centerXWu, centerYWu, viewportWidth, viewportHeight);
    const widthPx = worldSizeToPixels(rect.width, viewportWidth, viewportHeight);
    const heightPx = worldSizeToPixels(rect.height, viewportWidth, viewportHeight);
    
    return {
      left: `${centerScreenPos.x - widthPx / 2}px`,
      top: `${centerScreenPos.y - heightPx / 2}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`
    };
  } else if (anchor === 'bottom-left') {
    // Bottom-left anchored: convert corner positions, use bottom CSS property
    const leftScreenPos = worldToScreen(rect.x, worldYWu, viewportWidth, viewportHeight);
    const rightScreenPos = worldToScreen(rect.x + rect.width, worldYWu, viewportWidth, viewportHeight);
    
    const widthPx = rightScreenPos.x - leftScreenPos.x;
    const heightPx = worldSizeToPixels(rect.height, viewportWidth, viewportHeight);
    
    return {
      left: `${leftScreenPos.x}px`,
      bottom: `${viewportHeight - leftScreenPos.y}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`
    };
  } else {
    // Top-left anchored: convert corner positions
    const leftScreenPos = worldToScreen(rect.x, worldYWu, viewportWidth, viewportHeight);
    const rightScreenPos = worldToScreen(rect.x + rect.width, worldYWu, viewportWidth, viewportHeight);
    
    const widthPx = rightScreenPos.x - leftScreenPos.x;
    const heightPx = worldSizeToPixels(rect.height, viewportWidth, viewportHeight);
    
    return {
      left: `${leftScreenPos.x}px`,
      top: `${leftScreenPos.y}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`
    };
  }
};

/**
 * Convenience: Get viewport from store and convert world size to pixels
 * 
 * Useful for hooks/components that already subscribe to viewport store.
 * 
 * @param sizeWu - Size in world units
 * @param viewport - Viewport object from useViewportStore
 * @returns Size in screen pixels
 */
export const worldSizeToPixelsFromViewport = (
  sizeWu: number,
  viewport: { width: number; height: number }
): number => {
  return worldSizeToPixels(sizeWu, viewport.width, viewport.height);
};

/**
 * Convenience: Get viewport from store and convert world rect to CSS styles
 * 
 * Useful for hooks/components that already subscribe to viewport store.
 * 
 * @param rect - World rectangle definition
 * @param viewport - Viewport object from useViewportStore
 * @returns CSS styles object for React
 */
export const worldRectToScreenStylesFromViewport = (
  rect: WorldRect,
  viewport: { width: number; height: number }
): React.CSSProperties => {
  return worldRectToScreenStyles(rect, viewport.width, viewport.height);
};

