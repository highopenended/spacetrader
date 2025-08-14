/**
 * useScrapDropTargets
 *
 * Central resolver for scrap drop targets (purge zone, scrap bin).
 * Returns a ref for the bin drop zone and a function to resolve the target
 * from a screen-space point. Keeps WorkScreen free of ad-hoc DOM queries.
 */

import { useCallback } from 'react';
import { useDropZoneBounds } from './useDropZoneBounds';
import { DOM_IDS } from '../constants/domIds';

export type ScrapDropTarget = 'purgeZone' | 'bin' | null;

export const useScrapDropTargets = () => {
  // Reuse existing bounds helper for the bin
  const { dropZoneRef: binRef, isPointInside: isPointInsideBin } = useDropZoneBounds();

  const resolveScrapDropTarget = useCallback((pointPx: { x: number; y: number }): ScrapDropTarget => {
    // Check purge zone first (higher priority)
    const purgeZoneEl = document.getElementById(DOM_IDS.PURGE_ZONE);
    if (purgeZoneEl) {
      const rect = purgeZoneEl.getBoundingClientRect();
      if (
        pointPx.x >= rect.left &&
        pointPx.x <= rect.right &&
        pointPx.y >= rect.top &&
        pointPx.y <= rect.bottom
      ) {
        return 'purgeZone';
      }
    }

    // Then check bin
    if (isPointInsideBin(pointPx.x, pointPx.y)) {
      return 'bin';
    }

    return null;
  }, [isPointInsideBin]);

  return { binRef, resolveScrapDropTarget };
};

export default useScrapDropTargets;


