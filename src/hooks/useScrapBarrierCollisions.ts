/**
 * useScrapBarrierCollisions Hook
 *
 * Handles collision detection between airborne scrap objects and barriers.
 * Detects collisions, applies physics responses (position corrections, velocity reflections),
 * and supports swept collision detection to prevent tunneling.
 *
 * COORDINATE SYSTEMS:
 * - Scrap positions: World units → screen pixels (via getRenderedPosition)
 * - Barrier collision system: Uses vw/vh units (viewport-relative percentages)
 * - Conversions happen here: pixels → vw/vh for collision detection, vw/vh → world units for responses
 *
 * WORLD UNITS:
 * - Uses getRenderedPosition for accurate screen-space collision detection
 * - Handles drag overrides and airborne physics positions
 * - Converts barrier collision responses back to world units for physics system
 */

import { useCallback } from "react";
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU } from "../constants/physicsConstants";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../constants/cameraConstants";
import { checkBarrierCollision } from "../utils/barrierCollisionUtils";
import { ActiveScrapObject, ScrapSpawnState } from "../utils/scrapUtils";
import { useCameraUtils } from "./useCameraUtils";
import { useBarrierStore } from "../stores";
import { AirborneState } from "./useScrapPhysics";

export interface UseScrapBarrierCollisionsOptions {
    /** Get rendered position (from useScrapRendering) */
    getRenderedPosition: (scrap: ActiveScrapObject) => { x: number; y: number };
    
    /** Check if scrap is airborne (from useScrapPhysics) */
    isAirborne: (scrapId: string) => boolean;
    
    /** Get airborne state (from useScrapPhysics) */
    getAirborneState: (scrapId: string) => AirborneState | undefined;
    
    /** Get averaged velocity (from useScrapPhysics) */
    getAveragedVelocity: (scrapId: string) => { vx: number; vy: number } | null;
    
    /** Set velocity (from useScrapPhysics) */
    setVelocity: (scrapId: string, vxWuPerSec: number, vyWuPerSec: number) => void;
    
    /** Adjust position (from useScrapPhysics) */
    adjustPosition: (scrapId: string, deltaYWu: number) => void;
}

export interface UseScrapBarrierCollisionsApi {
    /**
     * Check all airborne scrap for collisions with barriers and apply physics responses.
     * Updates spawn state with position corrections.
     * 
     * @param prevState - Current scrap spawn state
     * @returns Updated scrap spawn state with collision corrections applied
     */
    checkBarrierCollisions: (prevState: ScrapSpawnState) => ScrapSpawnState;
}

export const useScrapBarrierCollisions = (
    options: UseScrapBarrierCollisionsOptions
): UseScrapBarrierCollisionsApi => {
    const { 
        getRenderedPosition, 
        isAirborne, 
        getAirborneState, 
        getAveragedVelocity,
        setVelocity,
        adjustPosition
    } = options;
    const { viewport, worldSizeToPx, worldToScreenPx } = useCameraUtils();

    const checkBarrierCollisions = useCallback(
        (prevState: ScrapSpawnState) => {
            // Get active barriers from store
            const activeBarriers = useBarrierStore.getState().getAllBarriers();
            const enabledBarriers = activeBarriers.filter(b => b.enabled);
            
            if (enabledBarriers.length === 0) {
                return prevState;
            }

            // Calculate scrap size in pixels and vw/vh for barrier collision system
            const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
            const scrapWidthVw = (scrapSizePx / viewport.width) * 100;
            const scrapHeightVh = (scrapSizePx / viewport.height) * 100;

            let newState = prevState;

            // Check all barriers against all airborne scrap in one pass
            prevState.activeScrap.forEach(scrap => {
                if (!isAirborne(scrap.id)) return; // Only check airborne scrap

                // Check collision against all enabled barriers
                for (const barrier of enabledBarriers) {
                    // Get position in screen pixels, convert to vw/vh for barrier collision (barrier system still uses vw/vh)
                    const centerPos = getRenderedPosition(scrap);
                    const scrapLeftXPx = centerPos.x - scrapSizePx / 2;
                    const scrapBottomYPx = viewport.height - (centerPos.y + scrapSizePx / 2);
                    const xVw = (scrapLeftXPx / viewport.width) * 100;
                    const bottomVh = (scrapBottomYPx / viewport.height) * 100;

                    // Use AVERAGED velocity over last 5 frames for stable, accurate collision response
                    const velocity = getAveragedVelocity(scrap.id);
                    if (!velocity) continue;

                    // Get previous position for swept collision detection
                    const airborneState = getAirborneState(scrap.id);
                    let prevBottomVh: number | undefined = undefined;
                    if (airborneState?.prevYWu !== undefined) {
                        // Convert world unit prevY to screen pixels, then to VH
                        const prevWorldYFromBottomWu = SCRAP_BASELINE_BOTTOM_WU + airborneState.prevYWu;
                        const prevCenterYWu = WORLD_HEIGHT - prevWorldYFromBottomWu;
                        const prevCenterXPx = scrap.x + SCRAP_SIZE_WU / 2;
                        const prevScreenPos = worldToScreenPx(prevCenterXPx, prevCenterYWu);
                        const prevBottomYPx = viewport.height - (prevScreenPos.y + scrapSizePx / 2);
                        prevBottomVh = (prevBottomYPx / viewport.height) * 100;
                    }

                    const collision = checkBarrierCollision(
                        xVw,
                        bottomVh,
                        scrapWidthVw,
                        scrapHeightVh,
                        velocity,
                        barrier,
                        prevBottomVh
                    );

                    if (collision.collided) {
                        // If swept collision provided a corrected position, use it directly
                        if (collision.correctedPositionVh !== undefined) {
                            // Swept collision: place scrap at the collision point
                            // Convert from VH back to world units for adjustPosition
                            const minDimension = Math.min(viewport.width, viewport.height);
                            const baselineBottomVh = (SCRAP_BASELINE_BOTTOM_WU * minDimension / 10) * (100 / viewport.height);
                            const correctedYOffsetVh = collision.correctedPositionVh - baselineBottomVh;
                            const correctedYWu = (correctedYOffsetVh / 100) * viewport.height / (minDimension / 10);
                            adjustPosition(scrap.id, correctedYWu - (airborneState?.yWu || 0));
                        } else {
                            // Standard collision: push scrap out along normal
                            const correctionXVw = collision.normal.x * collision.penetration;
                            const correctionYVh = collision.normal.y * collision.penetration;

                            // Update X position (horizontal in world units)
                            // Convert VW correction to world units
                            const correctionXWu = (correctionXVw / 100) * WORLD_WIDTH;
                            const newX = scrap.x + correctionXWu;
                            newState = {
                                ...newState,
                                activeScrap: newState.activeScrap.map(s =>
                                    s.id === scrap.id ? { ...s, x: newX } : s
                                )
                            };

                            // Update Y position (vertical in world units for airborne system)
                            // Convert VH to world units: VH is percentage, world height is 10 wu
                            const correctionYWu = (correctionYVh / 100) * WORLD_HEIGHT;
                            adjustPosition(scrap.id, correctionYWu);
                        }

                        // Apply reflected velocity
                        setVelocity(scrap.id, collision.newVelocity.vx, collision.newVelocity.vy);

                        // Only process first collision per scrap (break after first collision)
                        break;
                    }
                }
            });

            return newState;
        },
        [
            getRenderedPosition,
            isAirborne,
            getAirborneState,
            getAveragedVelocity,
            setVelocity,
            adjustPosition,
            viewport,
            worldSizeToPx,
            worldToScreenPx
        ]
    );

    return { checkBarrierCollisions };
};

