/**
 * useScrapPhysics
 *
 * Physics-lite manager for scrap airborne behavior.
 * - Maintains per-scrap vertical state when airborne
 * - Integrates motion each frame using existing rAF tick from WorkScreen
 * - Signals when a scrap lands (to resume stream movement)
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { GRAVITY_VH_PER_S2, MAX_DOWNWARD_SPEED_VH_PER_S, MAX_UPWARD_SPEED_VH_PER_S, MAX_HORIZONTAL_SPEED_VW_PER_S, MOMENTUM_SCALE, vhFromPx } from '../constants/physicsConstants';

export interface AirborneState {
  isAirborne: boolean;
  yVh: number; // vertical offset above baseline (vh). 0 == baseline
  vyVhPerSec: number;
  vxVwPerSec: number;
}

export interface UseScrapPhysicsApi {
  // Query
  getAirborneState: (scrapId: string) => AirborneState | undefined;
  isAirborne: (scrapId: string) => boolean;
  getHorizontalVelocity: (scrapId: string) => number;

  // Commands
  launchAirborneFromRelease: (
    scrapId: string,
    releaseVelocityPxPerSec: { vx: number; vy: number },
    initialYAboveBaselineVh: number
  ) => void;
  landScrap: (scrapId: string) => void;

  // Integration step (call from rAF): returns true if any state changed
  stepAirborne: (dtSeconds: number) => boolean;
}

export const useScrapPhysics = (): UseScrapPhysicsApi => {
  const statesRef = useRef<Map<string, AirborneState>>(new Map());
  const [version, setVersion] = useState(0); // trigger re-render when states change

  const getAirborneState = useCallback((scrapId: string) => statesRef.current.get(scrapId), []);
  const isAirborne = useCallback((scrapId: string) => !!statesRef.current.get(scrapId)?.isAirborne, []);
  const getHorizontalVelocity = useCallback((scrapId: string) => statesRef.current.get(scrapId)?.vxVwPerSec || 0, []);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const launchAirborneFromRelease = useCallback(
    (
      scrapId: string,
      releaseVelocityPxPerSec: { vx: number; vy: number },
      initialYAboveBaselineVh: number
    ) => {
      const vyVhPerSec = -vhFromPx(releaseVelocityPxPerSec.vy); // screen Y down -> physics Y up
      const vwPerPx = 1 / (typeof window !== 'undefined' ? (window.innerWidth / 100) : 10);
      let vxVwPerSec = releaseVelocityPxPerSec.vx * vwPerPx;
      // Apply momentum scaling (~20% reduction) and clamp
      vxVwPerSec = Math.max(-MAX_HORIZONTAL_SPEED_VW_PER_S, Math.min(MAX_HORIZONTAL_SPEED_VW_PER_S, vxVwPerSec * MOMENTUM_SCALE));
      statesRef.current.set(scrapId, {
        isAirborne: true,
        yVh: Math.max(0, initialYAboveBaselineVh),
        vyVhPerSec: clamp(vyVhPerSec * MOMENTUM_SCALE, MAX_DOWNWARD_SPEED_VH_PER_S, MAX_UPWARD_SPEED_VH_PER_S),
        vxVwPerSec
      });
      setVersion(v => v + 1);
    },
    []
  );

  const landScrap = useCallback((scrapId: string) => {
    const s = statesRef.current.get(scrapId);
    if (!s) return;
    statesRef.current.set(scrapId, { isAirborne: false, yVh: 0, vyVhPerSec: 0, vxVwPerSec: 0 });
    setVersion(v => v + 1);
  }, []);

  const stepAirborne = useCallback((dtSeconds: number) => {
    if (dtSeconds <= 0) return false;
    let changed = false;

    statesRef.current.forEach((state, id) => {
      if (!state.isAirborne) return;

      // Integrate
      let vy = state.vyVhPerSec + GRAVITY_VH_PER_S2 * dtSeconds;
      vy = clamp(vy, MAX_DOWNWARD_SPEED_VH_PER_S, MAX_UPWARD_SPEED_VH_PER_S);
      let y = state.yVh + vy * dtSeconds;

      if (y <= 0) {
        // Land
        statesRef.current.set(id, { isAirborne: false, yVh: 0, vyVhPerSec: 0, vxVwPerSec: 0 });
        changed = true;
        return;
      }

      if (y !== state.yVh || vy !== state.vyVhPerSec) {
        statesRef.current.set(id, { ...state, yVh: y, vyVhPerSec: vy });
        changed = true;
      }
    });

    if (changed) setVersion(v => v + 1);
    return changed;
  }, []);

  return useMemo(
    () => ({ getAirborneState, isAirborne, getHorizontalVelocity, launchAirborneFromRelease, landScrap, stepAirborne }),
    [getAirborneState, isAirborne, getHorizontalVelocity, launchAirborneFromRelease, landScrap, stepAirborne, version]
  );
};

export default useScrapPhysics;


