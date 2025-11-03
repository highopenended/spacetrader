/**
 * useScrapBarrierCollisions Hook
 *
 * Handles collision detection between airborne scrap objects and barriers.
 * Detects collisions, applies physics responses (position corrections, velocity reflections),
 * and supports swept collision detection to prevent tunneling.
 *
 * COORDINATE SYSTEMS:
 * - Scrap positions: World units → screen pixels (via getRenderedPosition)
 * - Barrier collision system: Barriers stored in world units, converted to pixels for collision
 * - Collision detection: All calculations in screen pixels
 * - Responses: Converted back to world units for physics system
 *
 * WORLD UNITS:
 * - Uses getRenderedPosition for accurate screen-space collision detection
 * - Handles drag overrides and airborne physics positions
 * - Converts barrier collision responses back to world units for physics system
 */

import { useCallback } from "react";
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU } from "../constants/physicsConstants";
import { WORLD_HEIGHT, screenToWorld } from "../constants/cameraConstants";
import { checkBarrierCollision } from "../utils/barrierCollisionUtils";
import { ScrapSpawnState, ActiveScrapObject } from "../utils/scrapUtils";
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

            // Calculate scrap size in pixels
            const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
            // Calculate zoom factor for velocity conversion (world units/s -> pixels/s)
            const zoomX = viewport.width / 20; // WORLD_WIDTH = 20
            const zoomY = viewport.height / 10; // WORLD_HEIGHT = 10
            const zoom = Math.min(zoomX, zoomY);

            let newState = prevState;

            // Check all barriers against all airborne scrap in one pass
            prevState.activeScrap.forEach(scrap => {
                if (!isAirborne(scrap.id)) return; // Only check airborne scrap

                // Check collision against all enabled barriers
                for (const barrier of enabledBarriers) {
                    // Get scrap position in screen pixels (center point)
                    const centerPos = getRenderedPosition(scrap);
                    
                    // Convert to top-left corner (for collision function)
                    const scrapLeftXPx = centerPos.x - scrapSizePx / 2;
                    const scrapTopYPx = centerPos.y - scrapSizePx / 2; // Y increases downward, top=0

                    // Use AVERAGED velocity over last 5 frames for stable, accurate collision response
                    const velocityWu = getAveragedVelocity(scrap.id);
                    if (!velocityWu) continue;
                    
                    // Convert velocity from world units per second to pixels per second
                    // IMPORTANT: Physics system uses vy positive UP, but screen coordinates use Y positive DOWN
                    // So we must negate vy when converting to screen pixels
                    const velocityPx = {
                        vx: velocityWu.vx * zoom,
                        vy: -velocityWu.vy * zoom  // Negate because physics Y-up vs screen Y-down
                    };

                    // Get previous position for swept collision detection (in pixels, top Y)
                    const airborneState = getAirborneState(scrap.id);
                    let prevScrapTopYPx: number | undefined = undefined;
                    if (airborneState?.prevYWu !== undefined) {
                        // Convert world unit prevY to screen pixels
                        const prevWorldYFromBottomWu = SCRAP_BASELINE_BOTTOM_WU + airborneState.prevYWu;
                        const prevCenterYWu = WORLD_HEIGHT - prevWorldYFromBottomWu;
                        const prevCenterXPx = scrap.x + SCRAP_SIZE_WU / 2;
                        const prevScreenPos = worldToScreenPx(prevCenterXPx, prevCenterYWu);
                        prevScrapTopYPx = prevScreenPos.y - scrapSizePx / 2;
                    }

                    const collision = checkBarrierCollision(
                        scrapLeftXPx,
                        scrapTopYPx,
                        scrapSizePx,
                        scrapSizePx,
                        velocityPx,
                        barrier,
                        viewport.width,
                        viewport.height,
                        prevScrapTopYPx
                    );

                    if (collision.collided) {
                        // If swept collision provided a corrected position, use it directly
                        if (collision.correctedPositionPx !== undefined) {
                            // Swept collision: place scrap at the collision point
                            // Convert from pixels back to world units for adjustPosition
                            const correctedCenterXPx = collision.correctedPositionPx.x + scrapSizePx / 2;
                            const correctedCenterYPx = collision.correctedPositionPx.y + scrapSizePx / 2;
                            
                            // Convert corrected position back to world units
                            const correctedWorld = screenToWorld(correctedCenterXPx, correctedCenterYPx, viewport.width, viewport.height);
                            
                            // Update X position
                            const correctedXWu = correctedWorld.x - SCRAP_SIZE_WU / 2;
                            newState = {
                                ...newState,
                                activeScrap: newState.activeScrap.map(s =>
                                    s.id === scrap.id ? { ...s, x: correctedXWu } : s
                                )
                            };
                            
                            // Update Y position (convert world Y to offset from baseline)
                            const worldYFromBottomWu = WORLD_HEIGHT - correctedWorld.y;
                            const correctedYWu = worldYFromBottomWu - SCRAP_BASELINE_BOTTOM_WU;
                            adjustPosition(scrap.id, correctedYWu - (airborneState?.yWu || 0));
                        } else {
                            // Standard collision: push scrap out along normal (in pixels)
                            const correctionXPx = collision.normal.x * collision.penetration;
                            const correctionYPx = collision.normal.y * collision.penetration;

                            // Convert correction from pixels to world units
                            const correctionXWu = correctionXPx / zoom;
                            // IMPORTANT: Screen Y-down to physics Y-up conversion
                            // Positive correctionYPx = move down in screen = negative delta in physics (less height above baseline)
                            const correctionYWu = -correctionYPx / zoom;

                            // Update X position
                            const newX = scrap.x + correctionXWu;
                            newState = {
                                ...newState,
                                activeScrap: newState.activeScrap.map(s =>
                                    s.id === scrap.id ? { ...s, x: newX } : s
                                )
                            };

                            // Update Y position (vertical in world units for airborne system)
                            adjustPosition(scrap.id, correctionYWu);
                        }

                        // Apply reflected velocity (convert from pixels/s back to world units/s)
                        // IMPORTANT: Negate vy again when converting back (screen Y-down to physics Y-up)
                        const reflectedVelocityWu = {
                            vx: collision.newVelocity.vx / zoom,
                            vy: -collision.newVelocity.vy / zoom  // Negate because screen Y-down to physics Y-up
                        };
                        setVelocity(scrap.id, reflectedVelocityWu.vx, reflectedVelocityWu.vy);

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

