/**
 * useScrapBinCollisions Hook
 *
 * Handles collision detection between scrap objects and the collection bin.
 * Treats scrap as circles and bin as rectangle for accurate collision detection.
 * Collects overlapping scrap and manages credit rewards.
 *
 * WORLD UNITS:
 * - Uses getRenderedPosition for accurate screen-space collision detection
 * - Handles drag overrides and airborne physics positions
 */

import { useCallback } from "react";
import { SCRAP_SIZE_WU } from "../constants/physicsConstants";
import { domRectToRect, Rect } from "../utils/collisionUtils";
import { collectScrap, calculateScrapValue, ActiveScrapObject } from "../utils/scrapUtils";
import { ScrapSpawnState } from "../utils/scrapUtils";
import { useCameraUtils } from "./useCameraUtils";

export interface UseScrapBinCollisionsOptions {
    /** Ref to the bin DOM element for collision bounds */
    binRef: React.RefObject<HTMLElement> | React.MutableRefObject<HTMLElement | null>;
    
    /** Get rendered position (from useScrapRendering) */
    getRenderedPosition: (scrap: ActiveScrapObject) => { x: number; y: number };
    
    /** Callback when credits are earned */
    onCreditsEarned?: (amount: number) => void;
    
    /** Callback when scrap is collected (for counter updates) */
    onScrapCollected?: () => void;
}

export interface UseScrapBinCollisionsApi {
    /**
     * Check all active scrap for collisions with the bin and collect overlapping items.
     * Updates spawn state and notifies callbacks.
     */
    checkBinCollisions: (prevState: ScrapSpawnState) => ScrapSpawnState;
}

/**
 * Check if a circle overlaps with an axis-aligned rectangle
 * 
 * @param circleCenter - Center point of the circle (in screen pixels)
 * @param circleRadius - Radius of the circle (in screen pixels)
 * @param rect - Rectangle bounds (in screen pixels)
 * @returns true if circle overlaps rectangle
 */
const checkCircleRectOverlap = (
    circleCenter: { x: number; y: number },
    circleRadius: number,
    rect: Rect
): boolean => {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.left, Math.min(circleCenter.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(circleCenter.y, rect.bottom));
    
    // Calculate distance from circle center to closest point
    const distanceX = circleCenter.x - closestX;
    const distanceY = circleCenter.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    // Check if distance is less than radius (collision)
    return distanceSquared < (circleRadius * circleRadius);
};

export const useScrapBinCollisions = (
    options: UseScrapBinCollisionsOptions
): UseScrapBinCollisionsApi => {
    const { binRef, getRenderedPosition, onCreditsEarned, onScrapCollected } = options;
    const { worldSizeToPx } = useCameraUtils();

    const checkBinCollisions = useCallback(
        (prevState: ScrapSpawnState) => {
            if (!binRef.current) {
                return prevState;
            }

            const scrapRadiusPx = worldSizeToPx(SCRAP_SIZE_WU) / 2;
            const binRect = domRectToRect(binRef.current.getBoundingClientRect());

            let newState = prevState;
            let creditsToAdd = 0;

            // Check each active scrap for collision with bin
            for (const scrap of prevState.activeScrap) {
                if (scrap.isCollected) continue;

                // Get current rendered position in screen pixels (center)
                const centerPos = getRenderedPosition(scrap);

                // Check circle-to-rectangle collision
                if (checkCircleRectOverlap(centerPos, scrapRadiusPx, binRect)) {
                    // Collect this scrap
                    const result = collectScrap(scrap.id, newState);
                    newState = result.spawnState;

                    if (result.collectedScrap && onCreditsEarned) {
                        creditsToAdd += calculateScrapValue(result.collectedScrap);
                    }

                    if (onScrapCollected) {
                        onScrapCollected();
                    }
                }
            }

            // Apply credits once after all collections
            if (creditsToAdd > 0 && onCreditsEarned) {
                onCreditsEarned(creditsToAdd);
            }

            return newState;
        },
        [binRef, getRenderedPosition, onCreditsEarned, onScrapCollected, worldSizeToPx]
    );

    return { checkBinCollisions };
};
