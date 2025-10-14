/**
 * useScrapPhysics
 *
 * Physics-lite manager for scrap airborne behavior.
 * - Maintains per-scrap vertical state when airborne
 * - Integrates motion each frame using existing rAF tick from WorkScreen
 * - Signals when a scrap lands (to resume stream movement)
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { GRAVITY_VP_PER_S2, MAX_DOWNWARD_SPEED_VP_PER_S, MAX_UPWARD_SPEED_VP_PER_S, MAX_HORIZONTAL_SPEED_VP_PER_S, MOMENTUM_SCALE, vpFromPx } from '../constants/physicsConstants';

export interface AirborneState {
  isAirborne: boolean;
  yVp: number; // vertical offset above baseline (vp). 0 == baseline
  vyVpPerSec: number;
  vxVpPerSec: number;
  prevYVp?: number; // Previous Y position (for swept collision detection)
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
    releaseVelocityPxPerSec: { vx: number; vy: number },
    initialYAboveBaselineVh: number,
    customGravityMultiplier?: number,
    customMomentumMultiplier?: number
  ) => void;
  setVelocity: (scrapId: string, vxVpPerSec: number, vyVpPerSec: number) => void;
  adjustPosition: (scrapId: string, deltaYVp: number) => void;
  landScrap: (scrapId: string) => void;

  // Integration step (call from rAF): returns true if any state changed
  stepAirborne: (dtSeconds: number) => boolean;
  // Horizontal integration output: deltas (vw) to apply per id since last step
  consumeHorizontalDeltas: () => Map<string, number>;
}

export const useScrapPhysics = (): UseScrapPhysicsApi => {
  const statesRef = useRef<Map<string, AirborneState>>(new Map());
  const [version, setVersion] = useState(0); // trigger re-render when states change
  // Accumulated horizontal deltas per id since last consume
  const horizontalDeltaRef = useRef<Map<string, number>>(new Map());

  const getAirborneState = useCallback((scrapId: string) => statesRef.current.get(scrapId), []);
  const isAirborne = useCallback((scrapId: string) => !!statesRef.current.get(scrapId)?.isAirborne, []);
  const getHorizontalVelocity = useCallback((scrapId: string) => statesRef.current.get(scrapId)?.vxVpPerSec || 0, []);
  
  const getVelocity = useCallback((scrapId: string) => {
    const state = statesRef.current.get(scrapId);
    if (!state) return null;
    return { vx: state.vxVpPerSec, vy: state.vyVpPerSec };
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
    return { vx: state.vxVpPerSec, vy: state.vyVpPerSec };
  }, []);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const launchAirborneFromRelease = useCallback(
    (
      scrapId: string,
      releaseVelocityPxPerSec: { vx: number; vy: number },
      initialYAboveBaselineVp: number,
      customGravityMultiplier: number = 1.0,
      customMomentumMultiplier: number = 1.0
    ) => {
      // Unified conversion: both axes use vp (viewport-min) units
      const vyVpPerSec = -vpFromPx(releaseVelocityPxPerSec.vy); // screen Y down -> physics Y up
      const vxVpPerSec = vpFromPx(releaseVelocityPxPerSec.vx);
      
      // Apply custom momentum scaling and clamp
      const effectiveMomentumScale = MOMENTUM_SCALE * customMomentumMultiplier;
      const clampedVxVpPerSec = Math.max(-MAX_HORIZONTAL_SPEED_VP_PER_S, Math.min(MAX_HORIZONTAL_SPEED_VP_PER_S, vxVpPerSec * effectiveMomentumScale));
      
      statesRef.current.set(scrapId, {
        isAirborne: true,
        yVp: Math.max(0, initialYAboveBaselineVp),
        vyVpPerSec: clamp(vyVpPerSec * effectiveMomentumScale, MAX_DOWNWARD_SPEED_VP_PER_S, MAX_UPWARD_SPEED_VP_PER_S),
        vxVpPerSec: clampedVxVpPerSec,
        gravityMultiplier: customGravityMultiplier,
        momentumMultiplier: customMomentumMultiplier
      });
      setVersion(v => v + 1);
    },
    []
  );

  const setVelocity = useCallback((scrapId: string, vxVpPerSec: number, vyVpPerSec: number) => {
    const state = statesRef.current.get(scrapId);
    if (!state || !state.isAirborne) return;
    
    // Apply velocity clamping
    const clampedVx = clamp(vxVpPerSec, -MAX_HORIZONTAL_SPEED_VP_PER_S, MAX_HORIZONTAL_SPEED_VP_PER_S);
    const clampedVy = clamp(vyVpPerSec, MAX_DOWNWARD_SPEED_VP_PER_S, MAX_UPWARD_SPEED_VP_PER_S);
    
    statesRef.current.set(scrapId, {
      ...state,
      vxVpPerSec: clampedVx,
      vyVpPerSec: clampedVy
    });
    setVersion(v => v + 1);
  }, []);

  const adjustPosition = useCallback((scrapId: string, deltaYVp: number) => {
    const state = statesRef.current.get(scrapId);
    if (!state || !state.isAirborne) return;
    
    const newY = Math.max(0, state.yVp + deltaYVp);
    
    statesRef.current.set(scrapId, {
      ...state,
      yVp: newY
    });
    setVersion(v => v + 1);
  }, []);

  const landScrap = useCallback((scrapId: string) => {
    const s = statesRef.current.get(scrapId);
    if (!s) return;
    statesRef.current.set(scrapId, { 
      isAirborne: false, 
      yVp: 0, 
      vyVpPerSec: 0, 
      vxVpPerSec: 0,
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
      const effectiveGravity = GRAVITY_VP_PER_S2 * gravityMultiplier;

      // Store previous Y for swept collision detection
      const prevY = state.yVp;

      // Integrate
      let vy = state.vyVpPerSec + effectiveGravity * dtSeconds;
      vy = clamp(vy, MAX_DOWNWARD_SPEED_VP_PER_S, MAX_UPWARD_SPEED_VP_PER_S);
      let y = state.yVp + vy * dtSeconds;
      // Horizontal delta in vp for this step
      const dx = state.vxVpPerSec * dtSeconds;
      if (dx !== 0) {
        const prev = horizontalDeltaRef.current.get(id) || 0;
        horizontalDeltaRef.current.set(id, prev + dx);
      }

      if (y <= 0) {
        // Land
        statesRef.current.set(id, { 
          isAirborne: false, 
          yVp: 0, 
          vyVpPerSec: 0, 
          vxVpPerSec: 0,
          prevYVp: prevY,
          gravityMultiplier: state.gravityMultiplier,
          momentumMultiplier: state.momentumMultiplier
        });
        changed = true;
        return;
      }

      if (y !== state.yVp || vy !== state.vyVpPerSec) {
        // Update velocity history (keep last 5 frames for averaging)
        const newHistory = state.velocityHistory || [];
        newHistory.push({ vx: state.vxVpPerSec, vy: vy });
        if (newHistory.length > 5) newHistory.shift();
        
        statesRef.current.set(id, { 
          ...state, 
          yVp: y, 
          vyVpPerSec: vy, 
          prevYVp: prevY,
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


