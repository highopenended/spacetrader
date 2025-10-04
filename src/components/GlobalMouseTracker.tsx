/**
 * Global Mouse Tracker Component
 * 
 * Attaches a single throttled mousemove listener to the document when
 * any component subscribes to mouse tracking via the dragStore.
 * 
 * This provides centralized mouse position tracking, eliminating
 * duplicate event listeners and improving performance.
 * 
 * Usage: Mount once at app level in App.tsx
 */

import { useEffect, useRef } from 'react';
import { useDragStore } from '../stores';

const THROTTLE_MS = 16; // ~60fps

export const GlobalMouseTracker: React.FC = () => {
  const isTrackingMouse = useDragStore(state => state.mouseTracking.isTrackingMouse);
  const updateGlobalMousePosition = useDragStore(state => state.updateGlobalMousePosition);
  
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isThrottledRef = useRef(false);

  useEffect(() => {
    if (!isTrackingMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isThrottledRef.current) return;

      isThrottledRef.current = true;
      updateGlobalMousePosition({ x: e.clientX, y: e.clientY });

      throttleTimeoutRef.current = setTimeout(() => {
        isThrottledRef.current = false;
      }, THROTTLE_MS);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [isTrackingMouse, updateGlobalMousePosition]);

  return null; // This component doesn't render anything
};

export default GlobalMouseTracker;

