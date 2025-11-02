/**
 * useScrapRendering Hook
 *
 * Provides position calculation utilities for rendering scrap objects.
 * Handles world-to-screen coordinate conversion with support for airborne
 * physics and drag overrides.
 *
 * WORLD UNITS:
 * - All world positions use world units (wu) for device-independent behavior
 * - World coordinates: Y=0 is top, increases downward
 * - Camera system (worldToScreen) handles pixel conversions
 */

import { useCallback } from "react";
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU } from "../constants/physicsConstants";
import { WORLD_HEIGHT } from "../constants/cameraConstants";
import { useCameraUtils } from "./useCameraUtils";
import { AirborneState } from "./useScrapPhysics";
import { ActiveScrapObject } from "../utils/scrapUtils";

export interface UseScrapRenderingOptions {
    // Get airborne state for a scrap (from useScrapPhysics)
    getAirborneState: (scrapId: string) => AirborneState | undefined;

    // Get drag style for a scrap (from useScrapDrag)
    getDragStyle: (scrapId: string) => React.CSSProperties | undefined;
}

export interface UseScrapRenderingApi {
    /**
     * Calculate actual on-screen position for a scrap in screen pixels.
     *
     * Handles:
     * - World-to-screen coordinate conversion
     * - Airborne physics offsets
     * - Drag overrides
     *
     * @param scrap - Scrap object to calculate position for
     * @returns Screen position in pixels (center point)
     */
    getRenderedPosition: (scrap: ActiveScrapObject) => { x: number; y: number };
}

export const useScrapRendering = (options: UseScrapRenderingOptions): UseScrapRenderingApi => {
    const { getAirborneState, getDragStyle } = options;
    const { viewport, worldSizeToPx, worldToScreenPx } = useCameraUtils();

    const getRenderedPosition = useCallback(
        (scrap: ActiveScrapObject) => {
            // Calculate world position (center of scrap)
            const airborne = getAirborneState(scrap.id);
            const centerXWu = scrap.x + SCRAP_SIZE_WU / 2; // scrap.x is left edge, convert to center

            // Calculate Y position in world units (Y=0 is top, increases downward)
            // World Y from bottom = SCRAP_BASELINE_BOTTOM_WU + airborne offset
            const worldYFromBottomWu = SCRAP_BASELINE_BOTTOM_WU + (airborne?.isAirborne ? airborne.yWu : 0);
            // Convert to world Y coordinate (Y=0 is top, WORLD_HEIGHT is bottom)
            const centerYWu = WORLD_HEIGHT - worldYFromBottomWu;

            // Convert world position to screen pixels using camera system
            let screenPos = worldToScreenPx(centerXWu, centerYWu);

            // If dragging, override from drag style (dragStyle returns pixels)
            const dragStyle = getDragStyle(scrap.id);
            if (dragStyle) {
                const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
                const left = dragStyle.left as unknown as string | number | undefined;
                const bottom = dragStyle.bottom as unknown as string | number | undefined;

                if (typeof left === "string" && left.endsWith("px")) {
                    // dragStyle.left is left edge in pixels, convert to center
                    screenPos.x = parseFloat(left) + scrapSizePx / 2;
                } else if (typeof left === "number") {
                    screenPos.x = left + scrapSizePx / 2;
                }

                if (typeof bottom === "string" && bottom.endsWith("px")) {
                    // bottom is distance from bottom of viewport, convert to screen Y (top=0)
                    screenPos.y = viewport.height - parseFloat(bottom) - scrapSizePx / 2;
                } else if (typeof bottom === "number") {
                    screenPos.y = viewport.height - bottom - scrapSizePx / 2;
                }
            }

            return screenPos;
        },
        [getAirborneState, getDragStyle, viewport, worldSizeToPx, worldToScreenPx]
    );

    return { getRenderedPosition };
};
