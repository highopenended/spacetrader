/**
 * Viewport Bounds Hook
 * 
 * Custom hook that monitors viewport changes and provides functions 
 * to constrain window positions and sizes within viewport bounds.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getViewportBounds, 
  clampPositionToBounds, 
  clampSizeToBounds,
  repositionOutOfBoundsWindows 
} from '../utils/viewportConstraints';

interface UseViewportBoundsOptions {
  onViewportResize?: (viewport: { width: number; height: number }) => void;
}

export const useViewportBounds = (options: UseViewportBoundsOptions = {}) => {
  const { onViewportResize } = options;
  const [viewport, setViewport] = useState(getViewportBounds());

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      const newViewport = getViewportBounds();
      setViewport(newViewport);
      
      if (onViewportResize) {
        onViewportResize(newViewport);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onViewportResize]);

  // Constrain position to viewport bounds
  const constrainPosition = useCallback((
    position: { x: number; y: number },
    windowSize: { width: number; height: number },
    footerHeight: number = 20
  ) => {
    return clampPositionToBounds(position, windowSize, footerHeight);
  }, []);

  // Constrain size to viewport bounds
  const constrainSize = useCallback((
    size: { width: number; height: number },
    position: { x: number; y: number },
    minSize: { width: number; height: number },
    footerHeight: number = 20
  ) => {
    return clampSizeToBounds(size, position, minSize, footerHeight);
  }, []);

  // Reposition out-of-bounds windows (useful for viewport resize)
  const repositionWindows = useCallback(<T extends { position: { x: number; y: number }; size: { width: number; height: number } }>(
    windows: T[],
    footerHeight: number = 20
  ): T[] => {
    return repositionOutOfBoundsWindows(windows, footerHeight);
  }, []);

  return {
    viewport,
    constrainPosition,
    constrainSize,
    repositionWindows
  };
}; 