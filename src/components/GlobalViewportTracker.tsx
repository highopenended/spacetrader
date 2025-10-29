/**
 * Global Viewport Tracker Component
 * 
 * Attaches a single resize listener to the window and updates the viewport store
 * when the viewport size changes. This provides centralized viewport tracking,
 * eliminating duplicate event listeners and improving performance.
 * 
 * Usage: Mount once at app level in App.tsx
 */

import { useEffect } from 'react';
import { useViewportStore } from '../stores/viewportStore';

export const GlobalViewportTracker: React.FC = () => {
  const updateViewport = useViewportStore(state => state.updateViewport);
  
  useEffect(() => {
    const handleResize = () => {
      updateViewport(window.innerWidth, window.innerHeight);
    };
    
    // Initial update
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewport]);
  
  return null; // This component doesn't render anything
};

export default GlobalViewportTracker;

