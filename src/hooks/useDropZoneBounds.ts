/**
 * useDropZoneBounds
 *
 * Provides a ref to attach to a drop zone element and helpers to
 * read its current screen bounds and hit-test a point against it.
 *
 * - Uses centralized viewport store for resize events
 * - Still listens to scroll events (viewport-independent)
 * - Exposes an explicit measure() to force-update when needed
 */

import { useRef, useCallback, useEffect } from 'react';
import { useViewportStore } from '../stores';

export interface DropZoneBoundsApi {
  dropZoneRef: React.MutableRefObject<HTMLDivElement | null>;
  getBounds: () => DOMRect;
  isPointInside: (x: number, y: number) => boolean;
  measure: () => void;
}

export const useDropZoneBounds = (): DropZoneBoundsApi => {
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const cachedRectRef = useRef<DOMRect | null>(null);
  
  // Subscribe to viewport changes for resize-triggered remeasure
  const viewport = useViewportStore(state => state.viewport);

  const measure = useCallback(() => {
    if (dropZoneRef.current) {
      cachedRectRef.current = dropZoneRef.current.getBoundingClientRect();
    }
  }, []);

  // Initial measure after mount
  useEffect(() => {
    measure();
  }, [measure]);

  // Remeasure when viewport size changes (resize)
  useEffect(() => {
    measure();
  }, [viewport.width, viewport.height, measure]);

  // Listen to scroll events (not handled by viewport store)
  useEffect(() => {
    const handleScroll = () => {
      measure();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [measure]);

  const getBounds = useCallback((): DOMRect => {
    if (!cachedRectRef.current) {
      measure();
    }
    return (
      cachedRectRef.current ||
      // Safe empty rect fallback
      new DOMRect(0, 0, 0, 0)
    );
  }, [measure]);

  const isPointInside = useCallback(
    (x: number, y: number): boolean => {
      const rect = getBounds();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },
    [getBounds]
  );

  return { dropZoneRef, getBounds, isPointInside, measure };
};

export default useDropZoneBounds;


