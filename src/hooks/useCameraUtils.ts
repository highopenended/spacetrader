/**
 * useCameraUtils Hook
 * 
 * Provides camera and viewport utilities for components.
 * Automatically subscribes to viewport store and memoizes calculations.
 * 
 * This hook eliminates the need to:
 * - Read window.innerWidth/Height directly
 * - Repeatedly calculate zoom
 * - Pass viewport dimensions around manually
 * 
 * Usage:
 *   const { viewport, zoom, worldSizeToPx } = useCameraUtils();
 */

import { useMemo, useCallback } from 'react';
import { useViewportStore } from '../stores';
import { calculateZoom, worldToScreen, screenToWorld } from '../constants/cameraConstants';
import { worldSizeToPixels, worldRectToScreenStyles, worldRectToScreenStylesFromViewport } from '../utils/cameraUtils';
import type { WorldRect } from '../utils/cameraUtils';

export const useCameraUtils = () => {
  const viewport = useViewportStore(state => state.viewport);
  
  // Memoize zoom calculation - only recalculates when viewport changes
  const zoom = useMemo(
    () => calculateZoom(viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );
  
  // Convert world size to pixels (convenience wrapper)
  const worldSizeToPx = useCallback(
    (sizeWu: number) => worldSizeToPixels(sizeWu, viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );
  
  // Convert world coordinates to screen coordinates
  const worldToScreenPx = useCallback(
    (worldX: number, worldY: number) => worldToScreen(worldX, worldY, viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );
  
  // Convert screen coordinates to world coordinates
  const screenToWorldCoords = useCallback(
    (screenX: number, screenY: number) => screenToWorld(screenX, screenY, viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );
  
  // Convert world rectangle to CSS styles
  const worldRectToStyles = useCallback(
    (rect: WorldRect) => worldRectToScreenStylesFromViewport(rect, viewport),
    [viewport]
  );
  
  return {
    viewport,
    zoom,
    worldSizeToPx,
    worldToScreenPx,
    screenToWorldCoords,
    worldRectToStyles
  };
};
