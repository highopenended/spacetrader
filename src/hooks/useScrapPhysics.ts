/**
 * useScrapPhysics
 *
 * Physics-lite manager for scrap airborne behavior.
 * - Maintains per-scrap vertical state when airborne
 * - Integrates motion each frame using existing rAF tick from WorkScreen
 * - Signals when a scrap lands (to resume stream movement)
 * 
 * WORLD UNITS:
 * - All positions and velocities use world units (wu)
 * - World size: 20w × 10h
 * - Physics calculations are device-independent
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { GRAVITY_WU_PER_S2 } from '../constants/physicsConstants';

export interface AirborneState {
  isAirborne: boolean;
  yWu: number; // vertical offset above baseline (world units). 0 == baseline
  vyWuPerSec: number; // vertical velocity (world units per second)
  vxWuPerSec: number; // horizontal velocity (world units per second)
  prevYWu?: number; // Previous Y position (for swept collision detection)
  velocityHistory?: Array<{ vx: number; vy: number }>; // Last few frames of velocity for stable collision response
  gravityMultiplier?: number; // Custom gravity multiplier for this scrap
  momentumMultiplier?: number; // Custom momentum multiplier for this scrap
}

export interface UseScrapPhysicsApi {
  // Query
  getAirborneState: (scrapId: string) => AirborneState | undefined;
  isAirborne: (scrapId: string) => boolean;
  getHorizontalVelocity: (scrapId: string) => number;
  getVelocity: (scrapId: string) => { vx: number; vy: number } | null;
  getAveragedVelocity: (scrapId: string) => { vx: number; vy: number } | null;

  // Commands
  launchAirborneFromRelease: (
    scrapId: string,
    releaseVelocityWuPerSec: { vx: number; vy: number },
    initialYAboveBaselineWu: number,
    customGravityMultiplier?: number,
    customMomentumMultiplier?: number
  ) => void;
  setVelocity: (scrapId: string, vxWuPerSec: number, vyWuPerSec: number) => void;
  adjustPosition: (scrapId: string, deltaYWu: number) => void;
  landScrap: (scrapId: string) => void;

  // Integration step (call from rAF): returns true if any state changed
  stepAirborne: (dtSeconds: number) => boolean;
  // Horizontal integration output: deltas (world units) to apply per id since last step
  consumeHorizontalDeltas: () => Map<string, number>;
}

export const useScrapPhysics = (): UseScrapPhysicsApi => {
  const statesRef = useRef<Map<string, AirborneState>>(new Map());
  const [version, setVersion] = useState(0); // trigger re-render when states change
  // Accumulated horizontal deltas per id since last consume
  const horizontalDeltaRef = useRef<Map<string, number>>(new Map());

  const getAirborneState = useCallback((scrapId: string) => statesRef.current.get(scrapId), []);
  const isAirborne = useCallback((scrapId: string) => !!statesRef.current.get(scrapId)?.isAirborne, []);
  const getHorizontalVelocity = useCallback((scrapId: string) => statesRef.current.get(scrapId)?.vxWuPerSec || 0, []);
  
  const getVelocity = useCallback((scrapId: string) => {
    const state = statesRef.current.get(scrapId);
    if (!state) return null;
    return { vx: state.vxWuPerSec, vy: state.vyWuPerSec };
  }, []);

  const getAveragedVelocity = useCallback((scrapId: string) => {
    const state = statesRef.current.get(scrapId);
    if (!state) return null;
    
    // If we have velocity history, average it for more stable collision response
    if (state.velocityHistory && state.velocityHistory.length > 0) {
      const history = state.velocityHistory;
      const avgVx = history.reduce((sum, v) => sum + v.vx, 0) / history.length;
      const avgVy = history.reduce((sum, v) => sum + v.vy, 0) / history.length;
      return { vx: avgVx, vy: avgVy };
    }
    
    // Fallback to current velocity
    return { vx: state.vxWuPerSec, vy: state.vyWuPerSec };
  }, []);

  const launchAirborneFromRelease = useCallback(
    (
      scrapId: string,
      releaseVelocityWuPerSec: { vx: number; vy: number },
      initialYAboveBaselineWu: number,
      customGravityMultiplier: number = 1.0,
      customMomentumMultiplier: number = 1.0
    ) => {
      // Velocity is in world units from drag system
      // World/screen coordinates: +Y is DOWN (top=0)
      // Physics coordinates: +Y is UP (height above baseline)
      // Negate vy to convert coordinate systems
      const vyWuPerSec = -releaseVelocityWuPerSec.vy;
      const vxWuPerSec = releaseVelocityWuPerSec.vx;
      
      statesRef.current.set(scrapId, {
        isAirborne: true,
        yWu: Math.max(0, initialYAboveBaselineWu),
        vyWuPerSec: vyWuPerSec,
        vxWuPerSec: vxWuPerSec,
        gravityMultiplier: customGravityMultiplier,
        momentumMultiplier: customMomentumMultiplier
      });
      setVersion(v => v + 1);
    },
    []
  );

  const setVelocity = useCallback((scrapId: string, vxWuPerSec: number, vyWuPerSec: number) => {
    const state = statesRef.current.get(scrapId);
    if (!state || !state.isAirborne) return;
    
    statesRef.current.set(scrapId, {
      ...state,
      vxWuPerSec: vxWuPerSec,
      vyWuPerSec: vyWuPerSec
    });
    setVersion(v => v + 1);
  }, []);

  const adjustPosition = useCallback((scrapId: string, deltaYWu: number) => {
    const state = statesRef.current.get(scrapId);
    if (!state || !state.isAirborne) return;
    
    const newY = Math.max(0, state.yWu + deltaYWu);
    
    statesRef.current.set(scrapId, {
      ...state,
      yWu: newY
    });
    setVersion(v => v + 1);
  }, []);

  const landScrap = useCallback((scrapId: string) => {
    const s = statesRef.current.get(scrapId);
    if (!s) return;
    statesRef.current.set(scrapId, { 
      isAirborne: false, 
      yWu: 0, 
      vyWuPerSec: 0, 
      vxWuPerSec: 0,
      gravityMultiplier: s.gravityMultiplier,
      momentumMultiplier: s.momentumMultiplier
    });
    setVersion(v => v + 1);
  }, []);

  const stepAirborne = useCallback((dtSeconds: number) => {
    if (dtSeconds <= 0) return false;
    let changed = false;

    statesRef.current.forEach((state, id) => {
      if (!state.isAirborne) return;

      // Apply custom gravity multiplier
      const gravityMultiplier = state.gravityMultiplier || 1.0;
      const effectiveGravity = GRAVITY_WU_PER_S2 * gravityMultiplier;

      // Store previous Y for swept collision detection
      const prevY = state.yWu;

      // Integrate velocity: v = v + a * dt
      const vy = state.vyWuPerSec + effectiveGravity * dtSeconds;
      
      // Integrate position: p = p + v * dt
      let y = state.yWu + vy * dtSeconds;
      
      // Horizontal delta in world units for this step
      const dx = state.vxWuPerSec * dtSeconds;
      if (dx !== 0) {
        const prev = horizontalDeltaRef.current.get(id) || 0;
        horizontalDeltaRef.current.set(id, prev + dx);
      }

      if (y <= 0) {
        // Land - scrap hit baseline
        statesRef.current.set(id, { 
          isAirborne: false, 
          yWu: 0, 
          vyWuPerSec: 0, 
          vxWuPerSec: 0,
          prevYWu: prevY,
          gravityMultiplier: state.gravityMultiplier,
          momentumMultiplier: state.momentumMultiplier
        });
        changed = true;
        return;
      }

      if (y !== state.yWu || vy !== state.vyWuPerSec) {
        // Update velocity history (keep last 5 frames for averaging)
        const newHistory = state.velocityHistory || [];
        newHistory.push({ vx: state.vxWuPerSec, vy: vy });
        if (newHistory.length > 5) newHistory.shift();
        
        statesRef.current.set(id, { 
          ...state, 
          yWu: y, 
          vyWuPerSec: vy, 
          prevYWu: prevY,
          velocityHistory: newHistory
        });
        changed = true;
      }
    });

    if (changed) setVersion(v => v + 1);
    return changed;
  }, []);

  const consumeHorizontalDeltas = useCallback(() => {
    // Return a copy and clear for next step
    const out = new Map(horizontalDeltaRef.current);
    horizontalDeltaRef.current.clear();
    return out;
  }, []);

  return useMemo(
    () => ({ 
      getAirborneState, 
      isAirborne, 
      getHorizontalVelocity, 
      getVelocity,
      getAveragedVelocity, 
      launchAirborneFromRelease, 
      setVelocity,
      adjustPosition, 
      landScrap, 
      stepAirborne, 
      consumeHorizontalDeltas 
    }),
    [consumeHorizontalDeltas, getAirborneState, getHorizontalVelocity, getVelocity, getAveragedVelocity, isAirborne, landScrap, launchAirborneFromRelease, setVelocity, adjustPosition, stepAirborne]
  );
};

export default useScrapPhysics;


