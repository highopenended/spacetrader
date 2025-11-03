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
import { checkBarrierCollision, clearBarrierOverlapState, DEBUG_BARRIER_BOUNDS, checkAndUpdateBarrierOverlap } from "../utils/barrierCollisionUtils";
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
    const { viewport, worldToScreenPx } = useCameraUtils();

    const checkBarrierCollisions = useCallback(
        (prevState: ScrapSpawnState) => {
            // Get active barriers from store
            const activeBarriers = useBarrierStore.getState().getAllBarriers();
            const enabledBarriers = activeBarriers.filter(b => b.enabled);
            
            if (enabledBarriers.length === 0) {
                return prevState;
            }

            // Calculate zoom factor for velocity conversion (world units/s -> pixels/s)
            const zoomX = viewport.width / 20; // WORLD_WIDTH = 20
            const zoomY = viewport.height / 10; // WORLD_HEIGHT = 10
            const zoom = Math.min(zoomX, zoomY);

            // Clear overlap state at start of frame (for debug visualization)
            if (DEBUG_BARRIER_BOUNDS) {
                clearBarrierOverlapState();
                
                // Update overlap state for all scrap (for debug visualization)
                // Check all active scrap against all barriers for bounding box overlap
                prevState.activeScrap.forEach(scrap => {
                    const centerPos = getRenderedPosition(scrap);
                    
                    for (const barrier of enabledBarriers) {
                        checkAndUpdateBarrierOverlap(
                            centerPos.x,
                            centerPos.y,
                            barrier,
                            viewport.width,
                            viewport.height
                        );
                    }
                });
            }

            let newState = prevState;

            // Check all barriers against all airborne scrap in one pass
            prevState.activeScrap.forEach(scrap => {
                if (!isAirborne(scrap.id)) return; // Only check airborne scrap

                // Check collision against all enabled barriers
                for (const barrier of enabledBarriers) {
                    // Get scrap position in screen pixels (center point)
                    const centerPos = getRenderedPosition(scrap);

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

                    // Get previous position for swept collision detection (in pixels, center Y)
                    const airborneState = getAirborneState(scrap.id);
                    let prevScrapCenterYPx: number | undefined = undefined;
                    if (airborneState?.prevYWu !== undefined) {
                        // Convert world unit prevY to screen pixels
                        const prevWorldYFromBottomWu = SCRAP_BASELINE_BOTTOM_WU + airborneState.prevYWu;
                        const prevCenterYWu = WORLD_HEIGHT - prevWorldYFromBottomWu;
                        const prevCenterXPx = scrap.x + SCRAP_SIZE_WU / 2;
                        const prevScreenPos = worldToScreenPx(prevCenterXPx, prevCenterYWu);
                        prevScrapCenterYPx = prevScreenPos.y;
                    }

                    const collision = checkBarrierCollision(
                        centerPos.x,
                        centerPos.y,
                        velocityPx,
                        barrier,
                        viewport.width,
                        viewport.height,
                        prevScrapCenterYPx
                    );

                    if (collision.collided) {
                        // Collision response always provides corrected position (center coordinates in pixels)
                        if (collision.correctedPositionPx !== undefined) {
                            // Convert corrected center position back to world units
                            const correctedWorld = screenToWorld(
                                collision.correctedPositionPx.x, 
                                collision.correctedPositionPx.y, 
                                viewport.width, 
                                viewport.height
                            );
                            
                            // Update X position (convert center to left edge)
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
            worldToScreenPx
        ]
    );

    return { checkBarrierCollisions };
};

