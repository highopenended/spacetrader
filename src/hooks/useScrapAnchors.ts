/**
 * useScrapAnchors Hook
 *
 * Manages computation and publishing of anchor data for AR-style overlays.
 * Computes anchors from active scrap objects and publishes them to the anchors store.
 *
 * Handles:
 * - Normal updates when scrap state changes (via useEffect)
 * - High-frequency updates during drag (via requestAnimationFrame)
 * - Filtering of collected and being-collected scrap
 * - Position computation using getRenderedPosition
 *
 * WORLD UNITS:
 * - Uses getRenderedPosition which handles world-to-screen conversions
 * - Anchor positions are computed in screen pixels for overlay rendering
 */

import { useEffect } from 'react';
import { useScrapStore } from '../stores/scrapStore';
import { useAnchorsStore } from '../stores/anchorsStore';
import { computeAnchorFromScrap } from '../utils/anchorUtils';
import { ActiveScrapObject } from '../utils/scrapUtils';

export interface UseScrapAnchorsOptions {
  /**
   * Get rendered position for a scrap (from useScrapRendering)
   * Returns screen position in pixels (center point)
   */
  getRenderedPosition: (scrap: ActiveScrapObject) => { x: number; y: number };
  
  /**
   * Currently dragged scrap ID (if any)
   * When set, triggers high-frequency anchor updates via requestAnimationFrame
   */
  draggedScrapId: string | null;
}

/**
 * Hook that manages anchor computation and publishing.
 * No return value - anchors are published directly to anchorsStore.
 */
export const useScrapAnchors = (options: UseScrapAnchorsOptions): void => {
  const { getRenderedPosition, draggedScrapId } = options;
  
  // Get anchors store actions
  const setAnchors = useAnchorsStore(state => state.setAnchors);
  const getBeingCollectedIds = useScrapStore(state => state.getBeingCollectedIds);
  
  // Get scrap store version for reactive updates (triggers re-render when scrap state changes)
  const scrapVersion = useScrapStore(state => state.version);
  
  // Get scrap state (reactive to version changes via scrapVersion dependency)
  // Read state fresh in useEffect to avoid stale closures
  useEffect(() => {
    if (draggedScrapId) return; // Skip normal updates while dragging (handled by RAF loop)
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const beingCollectedIds = getBeingCollectedIds();
    
    // Read fresh state from store
    const currentState = useScrapStore.getState().getSpawnState();
    
    const anchors = currentState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        // Get position in screen pixels (center) - already derived from world units via camera system
        const centerPos = getRenderedPosition(scrap);
        // Compute anchor from scrap using shared utility
        return computeAnchorFromScrap(scrap, centerPos, viewportWidth, viewportHeight);
      });
    setAnchors(anchors);
  }, [scrapVersion, getRenderedPosition, setAnchors, getBeingCollectedIds, draggedScrapId]);

  // High-frequency anchor updates while dragging (uses requestAnimationFrame for smooth updates)
  useEffect(() => {
    if (!draggedScrapId) return;
    
    let rafId: number | null = null;
    const tick = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const beingCollectedIds = getBeingCollectedIds();
      
      // Read fresh state from store (not stale closure)
      const currentState = useScrapStore.getState().getSpawnState();
      
      const anchors = currentState.activeScrap
        .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
        .map((scrap) => {
          // Get position in screen pixels (center) - already derived from world units via camera system
          const centerPos = getRenderedPosition(scrap);
          // Compute anchor from scrap using shared utility
          return computeAnchorFromScrap(scrap, centerPos, viewportWidth, viewportHeight);
        });
      setAnchors(anchors);
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [draggedScrapId, getRenderedPosition, setAnchors, getBeingCollectedIds]);
};

