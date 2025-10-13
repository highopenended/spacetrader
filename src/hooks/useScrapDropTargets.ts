/**
 * useScrapDropTargets
 *
 * Central resolver for scrap drop targets (purge zone only).
 * Returns a ref for the bin (for collision detection) and a function to check purge zone.
 * Bin collection is handled by continuous collision detection, not drop events.
 */

import { useCallback } from 'react';
import { useDropZoneBounds } from './useDropZoneBounds';
import { DOM_IDS } from '../constants/domIds';

export type ScrapDropTarget = 'purgeZone' | null;

export const useScrapDropTargets = () => {
  // Keep bin ref for collision detection (not for drop events)
  const { dropZoneRef: binRef } = useDropZoneBounds();

  const resolveScrapDropTarget = useCallback((pointPx: { x: number; y: number }): ScrapDropTarget => {
    // Check purge zones - work mode, then window
    const workModePurgeZoneEl = document.getElementById(DOM_IDS.PURGE_ZONE_WORKMODE);
    if (workModePurgeZoneEl) {
      const rect = workModePurgeZoneEl.getBoundingClientRect();
      if (
        pointPx.x >= rect.left &&
        pointPx.x <= rect.right &&
        pointPx.y >= rect.top &&
        pointPx.y <= rect.bottom
      ) {
        return 'purgeZone';
      }
    }

    const windowPurgeZoneEl = document.getElementById(DOM_IDS.PURGE_ZONE_WINDOW);
    if (windowPurgeZoneEl) {
      const rect = windowPurgeZoneEl.getBoundingClientRect();
      if (
        pointPx.x >= rect.left &&
        pointPx.x <= rect.right &&
        pointPx.y >= rect.top &&
        pointPx.y <= rect.bottom
      ) {
        return 'purgeZone';
      }
    }

    return null;
  }, []);

  return { binRef, resolveScrapDropTarget };
};

export default useScrapDropTargets;


