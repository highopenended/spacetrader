/**
 * Viewport Constraint Utilities
 * 
 * Utility functions for constraining window positions and sizes within viewport bounds.
 * Ensures windows cannot be dragged or resized outside the visible screen area.
 */

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Get current viewport dimensions
 */
export const getViewportBounds = (): Size => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Calculate the allowed bounds for a window position
 * @param windowSize - Current size of the window
 * @param footerHeight - Additional height for footer (e.g., 140px for expanded footer)
 * @returns Bounds object with min/max allowed positions
 */
export const calculateWindowBounds = (
  windowSize: Size, 
  footerHeight: number = 20
): Bounds => {
  const viewport = getViewportBounds();
  
  return {
    minX: 0,
    maxX: Math.max(0, viewport.width - windowSize.width),
    minY: 0,
    maxY: Math.max(0, viewport.height - windowSize.height - footerHeight)
  };
};

/**
 * Clamp a position to stay within viewport bounds
 * @param position - Desired position
 * @param windowSize - Size of the window
 * @param footerHeight - Additional height for footer
 * @returns Constrained position that stays within bounds
 */
export const clampPositionToBounds = (
  position: Position, 
  windowSize: Size, 
  footerHeight: number = 20
): Position => {
  const bounds = calculateWindowBounds(windowSize, footerHeight);
  
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y))
  };
};

/**
 * Clamp a window size to fit within viewport
 * @param size - Desired size
 * @param position - Current position
 * @param minSize - Minimum allowed size
 * @param footerHeight - Additional height for footer
 * @returns Constrained size that fits within viewport
 */
export const clampSizeToBounds = (
  size: Size,
  position: Position,
  minSize: Size,
  footerHeight: number = 20
): Size => {
  const viewport = getViewportBounds();
  
  const maxWidth = viewport.width - position.x;
  const maxHeight = viewport.height - position.y - footerHeight;
  
  return {
    width: Math.max(minSize.width, Math.min(maxWidth, size.width)),
    height: Math.max(minSize.height, Math.min(maxHeight, size.height))
  };
};

/**
 * Check if a position would place a window outside viewport bounds
 * @param position - Position to check
 * @param windowSize - Size of the window
 * @param footerHeight - Additional height for footer
 * @returns True if position is outside bounds
 */
export const isPositionOutOfBounds = (
  position: Position,
  windowSize: Size,
  footerHeight: number = 20
): boolean => {
  const bounds = calculateWindowBounds(windowSize, footerHeight);
  
  return (
    position.x < bounds.minX ||
    position.x > bounds.maxX ||
    position.y < bounds.minY ||
    position.y > bounds.maxY
  );
};

/**
 * Reposition windows that are outside viewport bounds (useful for viewport resize)
 * @param windows - Array of window data with position and size
 * @param footerHeight - Additional height for footer
 * @returns Array of windows with corrected positions
 */
export const repositionOutOfBoundsWindows = <T extends { position: Position; size: Size }>(
  windows: T[],
  footerHeight: number = 20
): T[] => {
  return windows.map(window => {
    if (isPositionOutOfBounds(window.position, window.size, footerHeight)) {
      const constrainedPosition = clampPositionToBounds(
        window.position, 
        window.size, 
        footerHeight
      );
      
      return {
        ...window,
        position: constrainedPosition
      };
    }
    
    return window;
  });
}; 