/**
 * Anchor Utilities
 * 
 * Utility functions for computing anchor positions and labels from scrap objects.
 * Centralizes the logic for transforming scrap game state into anchor view data.
 */

import { ActiveScrapObject } from './scrapUtils';
import { Anchor } from '../stores/anchorsStore';
import { ScrapRegistry } from '../constants/scrapRegistry';
import { MutatorRegistry } from '../constants/mutatorRegistry';
import { SCRAP_SIZE_WU } from '../constants/physicsConstants';
import { calculateZoom } from '../constants/cameraConstants';

/**
 * Compute anchor label text from scrap type and mutators
 */
export const computeAnchorLabel = (scrap: ActiveScrapObject): string => {
  const typeEntry = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  const typeLabel = `${typeEntry?.label ?? scrap.typeId}`;
  const mutatorLinesArr = scrap.mutators
    .map(id => {
      const m = MutatorRegistry[id as keyof typeof MutatorRegistry];
      return m ? `${m.appearance} ${m.label}` : id;
    });
  return [typeLabel, ...mutatorLinesArr].join('\n');
};

/**
 * Compute anchor position and label from a scrap object
 * 
 * @param scrap - Scrap object to compute anchor for
 * @param centerPos - Screen position in pixels (center of scrap) from getRenderedPosition
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Anchor object with position and label
 */
export const computeAnchorFromScrap = (
  scrap: ActiveScrapObject,
  centerPos: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number
): Anchor => {
  const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
  const labelOffsetPx = scrapSizePx * 0.7; // Offset labels slightly from scrap edge (scales with world units)
  
  // Calculate scrap bounds in screen pixels
  const leftPx = centerPos.x - scrapSizePx / 2;
  const bottomPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
  
  // Compute label text
  const label = computeAnchorLabel(scrap);
  
  // Compute scrap center for connectors (in screen pixels)
  const cxPx = centerPos.x;
  const cyPx = viewportHeight - centerPos.y;
  
  return {
    id: scrap.id,
    xPx: leftPx + scrapSizePx + labelOffsetPx, // Label positioned to the right of scrap
    bottomPx: bottomPx + scrapSizePx + labelOffsetPx, // Label positioned above scrap
    label,
    cxPx,
    cyPx,
  };
};

