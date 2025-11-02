/**
 * useScrapBinCollisions Hook
 *
 * Handles collision detection between scrap objects and the collection bin.
 * Collects overlapping scrap and manages credit rewards.
 *
 * WORLD UNITS:
 * - Uses getRenderedPosition for accurate screen-space collision detection
 * - Handles drag overrides and airborne physics positions
 */

import { useCallback } from "react";
import { SCRAP_SIZE_WU } from "../constants/physicsConstants";
import { checkRectOverlap, domRectToRect, Rect } from "../utils/collisionUtils";
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

            const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
            const binRect = domRectToRect(binRef.current.getBoundingClientRect());

            let newState = prevState;
            let creditsToAdd = 0;

            // Check each active scrap for collision with bin
            for (const scrap of prevState.activeScrap) {
                if (scrap.isCollected) continue;

                // Get current rendered position in screen pixels (center)
                const centerPos = getRenderedPosition(scrap);

                // Convert center position + size to rect (top-left corner)
                const scrapRect: Rect = {
                    left: centerPos.x - scrapSizePx / 2,
                    top: centerPos.y - scrapSizePx / 2,
                    right: centerPos.x + scrapSizePx / 2,
                    bottom: centerPos.y + scrapSizePx / 2
                };

                // Check collision
                if (checkRectOverlap(scrapRect, binRect)) {
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
