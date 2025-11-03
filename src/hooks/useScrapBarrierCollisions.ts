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

                // Get scrap position in screen pixels (center point)
                const centerPos = getRenderedPosition(scrap);

                // Use AVERAGED velocity over last 5 frames for stable, accurate collision response
                const velocityWu = getAveragedVelocity(scrap.id);
                if (!velocityWu) return;
                
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

                // Collect ALL collisions first (don't break after first)
                const collisions: Array<{ barrier: typeof enabledBarriers[0]; collision: ReturnType<typeof checkBarrierCollision> }> = [];
                
                for (const barrier of enabledBarriers) {
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
                        collisions.push({ barrier, collision });
                    }
                }

                // Process collisions
                if (collisions.length === 0) {
                    return; // No collisions
                } else if (collisions.length === 1) {
                    // Single collision - handle as before
                    const { collision } = collisions[0];
                    
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
                    const reflectedVelocityWu = {
                        vx: collision.newVelocity.vx / zoom,
                        vy: -collision.newVelocity.vy / zoom  // Negate because screen Y-down to physics Y-up
                    };
                    setVelocity(scrap.id, reflectedVelocityWu.vx, reflectedVelocityWu.vy);
                } else {
                    // Multiple collisions - resolve together (e.g., V-shape where two barriers meet)
                    // Average corrected positions to find intersection point
                    let avgCorrectedX = 0;
                    let avgCorrectedY = 0;
                    let hasCorrectedPosition = false;
                    
                    for (const { collision } of collisions) {
                        if (collision.correctedPositionPx !== undefined) {
                            avgCorrectedX += collision.correctedPositionPx.x;
                            avgCorrectedY += collision.correctedPositionPx.y;
                            hasCorrectedPosition = true;
                        }
                    }
                    
                    if (hasCorrectedPosition) {
                        avgCorrectedX /= collisions.length;
                        avgCorrectedY /= collisions.length;
                        
                        // Convert averaged corrected position back to world units
                        const correctedWorld = screenToWorld(
                            avgCorrectedX,
                            avgCorrectedY,
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

                    // For velocity: constrain to valid space that doesn't violate any collision normal
                    // In a V-shape, this means velocity along the crease (perpendicular to average normal)
                    // Or zero if velocity into any surface is too high
                    
                    // Average the normals
                    let avgNormalX = 0;
                    let avgNormalY = 0;
                    for (const { collision } of collisions) {
                        avgNormalX += collision.normal.x;
                        avgNormalY += collision.normal.y;
                    }
                    avgNormalX /= collisions.length;
                    avgNormalY /= collisions.length;
                    
                    // Normalize average normal
                    const avgNormalLen = Math.sqrt(avgNormalX * avgNormalX + avgNormalY * avgNormalY);
                    if (avgNormalLen > 0.0001) {
                        avgNormalX /= avgNormalLen;
                        avgNormalY /= avgNormalLen;
                    }
                    
                    // Check if velocity into any surface is low (resting contact)
                    let maxVelocityIntoSurface = 0;
                    for (const { collision } of collisions) {
                        const velocityDotNormal = velocityPx.vx * collision.normal.x + velocityPx.vy * collision.normal.y;
                        maxVelocityIntoSurface = Math.max(maxVelocityIntoSurface, Math.abs(velocityDotNormal));
                    }
                    
                    const RESTING_THRESHOLD = 5; // pixels/s
                    const isResting = maxVelocityIntoSurface < RESTING_THRESHOLD;
                    
                    let finalVelocityPx = { vx: 0, vy: 0 };
                    
                    if (isResting) {
                        // Resting contact with multiple barriers: velocity should be zero
                        // (can't slide along crease if fully constrained by two barriers)
                        finalVelocityPx = { vx: 0, vy: 0 };
                    } else {
                        // Moving contact: project velocity onto crease (tangent to average normal)
                        // Tangent is perpendicular to average normal
                        const tangentX = -avgNormalY;
                        const tangentY = avgNormalX;
                        
                        // Project velocity onto tangent (along the crease)
                        const velocityDotTangent = velocityPx.vx * tangentX + velocityPx.vy * tangentY;
                        finalVelocityPx = {
                            vx: tangentX * velocityDotTangent,
                            vy: tangentY * velocityDotTangent
                        };
                        
                        // Apply friction from the most restrictive barrier
                        let minFriction = 1.0;
                        for (const { barrier } of collisions) {
                            minFriction = Math.min(minFriction, barrier.friction);
                        }
                        const frictionDamping = 1 - minFriction * 0.5;
                        finalVelocityPx.vx *= frictionDamping;
                        finalVelocityPx.vy *= frictionDamping;
                    }
                    
                    // Convert final velocity back to world units
                    const finalVelocityWu = {
                        vx: finalVelocityPx.vx / zoom,
                        vy: -finalVelocityPx.vy / zoom  // Negate because screen Y-down to physics Y-up
                    };
                    setVelocity(scrap.id, finalVelocityWu.vx, finalVelocityWu.vy);
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

