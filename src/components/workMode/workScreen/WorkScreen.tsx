import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { 
  spawnScrapIfReady,
  updateScrapPositions as updateScrapPositionsUtil,
  cleanupCollectedScrap,
  ActiveScrapObject,
  collectScrap
} from '../../../utils/scrapUtils';
import AssemblyLine from '../assemblyLine/AssemblyLine';
import ScrapBin from '../scrapBin/ScrapBin';
import WorkTimer from '../workTimer/WorkTimer';
import ScrapItem from '../scrapItem/ScrapItem';
import './WorkScreen.css';
import { useScrapDropTargets } from '../../../hooks/useScrapDropTargets';
import { useScrapPhysics } from '../../../hooks/useScrapPhysics';
import { useScrapDrag } from '../../../hooks/useScrapDrag';
import { useClockSubscription } from '../../../hooks/useClockSubscription';
import { useCameraUtils } from '../../../hooks/useCameraUtils';
import { useScrapRendering } from '../../../hooks/useScrapRendering';
import { useScrapBinCollisions } from '../../../hooks/useScrapBinCollisions';
import { useScrapAnchors } from '../../../hooks/useScrapAnchors';
import { useScrapBarrierCollisions } from '../../../hooks/useScrapBarrierCollisions';
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU, SCRAP_BIN_SIZE_WU, SCRAP_BIN_POSITION_WU } from '../../../constants/physicsConstants';
import { WORLD_HEIGHT } from '../../../constants/cameraConstants';
import { worldRectToScreenStylesFromViewport } from '../../../utils/cameraUtils';
import { DOM_IDS } from '../../../constants/domIds';
import WorkModePurgeZone from '../workModePurgeZone/WorkModePurgeZone';
import { useGameStore, useUpgradesStore, useAnchorsStore, useBarrierStore, useDragStore, useScrapStore } from '../../../stores';
import Barrier from '../barrier/Barrier';

interface WorkScreenProps {
  updateCredits?: (amount: number) => void;
  installedApps?: any[];
}

const WorkScreen: React.FC<WorkScreenProps> = ({ updateCredits, installedApps }) => {
  // Get upgrade checker from upgradesStore
  const isUpgradePurchased = useUpgradesStore(state => state.isPurchased);
  
  // Get anchors store actions for cleanup
  const clearAnchors = useAnchorsStore(state => state.clearAnchors);
  
  // Get barrier store actions (use version for reactive updates, not getAllBarriers)
  const barriersVersion = useBarrierStore(state => state.version);
  const setBarriers = useBarrierStore(state => state.setBarriers);
  const clearBarriers = useBarrierStore(state => state.clearBarriers);
  
  // Get barriers for rendering (memoized, only updates when version changes)
  const barriers = useMemo(() => {
    return useBarrierStore.getState().getAllBarriers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barriersVersion]);
  
  // Get scrap store (use version for reactive updates, use getState for game loop)
  const scrapVersion = useScrapStore(state => state.version);
  const collectedCount = useScrapStore(state => state.collectedCount);
  
  // Get scrap state for rendering (memoized, only updates when version changes)
  const spawnState = useMemo(() => {
    return useScrapStore.getState().getSpawnState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrapVersion]);
  
  // Get game mode to detect work session start/end
  const gameMode = useGameStore(state => state.gameMode);
  
  // Camera utilities (viewport and conversion functions)
  const { viewport, worldSizeToPx, worldToScreenPx } = useCameraUtils();
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Frame counting ref for cleanup timing (doesn't trigger re-renders)
  const frameCountRef = useRef<number>(0);
  
  // Scaled time tracking for spawn timing (respects pause and time scale)
  const scaledTimeRef = useRef<number>(0);
  
  // Reset local refs and initialize barriers when work session begins (gameMode changes to 'workMode')
  useEffect(() => {
    if (gameMode === 'workMode') {
      scaledTimeRef.current = 0;
      frameCountRef.current = 0;
      setElapsedSeconds(0);
      
      // Initialize barriers for work mode
      // Uncomment and modify these to add barriers:
      // setBarriers([
      //   {
      //     id: 'test-barrier-1',
      //     position: {
      //       xVw: 30,        // Center X position (viewport width units)
      //       bottomVh: 25    // Bottom position (viewport height units)
      //     },
      //     width: 20,        // Width in vw
      //     height: 0.5,      // Height (thickness) in vw
      //     rotation: 15,     // Rotation in degrees (0 = horizontal)
      //     restitution: 0.7, // Bounciness (0 = no bounce, 1 = perfect bounce)
      //     friction: 0.2,    // Friction (0 = ice, 1 = sticky)
      //     enabled: true
      //   }
      // ]);
    } else {
      // Clear barriers when work mode ends
      clearBarriers();
    }
  }, [gameMode, setBarriers, clearBarriers]);

  // Centralized scrap drop targets (purge zone + bin)
  const { binRef: dropZoneRef, resolveScrapDropTarget } = useScrapDropTargets();

  // Physics-lite airborne handling
  const {
    isAirborne,
    getAirborneState,
    stepAirborne,
    launchAirborneFromRelease,
    getHorizontalVelocity,
    getAveragedVelocity,
    setVelocity,
    adjustPosition
  } = useScrapPhysics();

  // Get scrap store actions
  const getScrap = useScrapStore(state => state.getScrap);
  const getScrapMutators = useScrapStore(state => state.getScrapMutators);
  const updateSpawnState = useScrapStore(state => state.updateSpawnState);
  const incrementCollectedCount = useScrapStore(state => state.incrementCollectedCount);
  const addBeingCollectedId = useScrapStore(state => state.addBeingCollectedId);
  const removeBeingCollectedId = useScrapStore(state => state.removeBeingCollectedId);
  const getBeingCollectedIds = useScrapStore(state => state.getBeingCollectedIds);

  // Drag handling for scrap items
  const { getDraggableProps, getDragStyle, draggedScrapId } = useScrapDrag({
    getScrap,
    onDrop: ({ scrapId, releasePositionWu, releaseVelocityWuPerSec, elementSizePx }) => {
			// Convert world position to screen pixels for purge zone detection only
			const releasePositionPx = worldToScreenPx(releasePositionWu.x, releasePositionWu.y);
			
			// Resolve drop target (only purge zone now - bin uses continuous collision)
			const target = resolveScrapDropTarget(releasePositionPx);
			if (target === 'purgeZone') {
				// Hide immediately to avoid any visual snap-back
				addBeingCollectedId(scrapId);
				updateSpawnState(prev => {
					const { spawnState: newState } = collectScrap(scrapId, prev);
					return newState;
				});
				queueMicrotask(() => {
					removeBeingCollectedId(scrapId);
				});
				return;
			}

      // Launch airborne with physics (bin collection handled by continuous collision)
      // Don't update X position - it should stay where it visually is from the drag
      // The X position will be updated by horizontal velocity integration during airborne
      
      // Calculate Y offset above baseline in world units
      // World coordinates have +Y DOWN (top=0), but physics needs +Y UP (height above ground)
      // Convert: worldPos.y=0 (top) → WORLD_HEIGHT from bottom, worldPos.y=WORLD_HEIGHT (bottom) → 0 from bottom
      const worldYFromBottom = WORLD_HEIGHT - releasePositionWu.y;
      const yAboveBaselineWu = Math.max(0, worldYFromBottom - SCRAP_BASELINE_BOTTOM_WU);

      // Apply custom physics modifiers for dense scrap
      const mutators = getScrapMutators(scrapId);
      const isDense = mutators.includes('dense');
      const gravityMultiplier = isDense ? 1.5 : 1.0;
      const momentumMultiplier = isDense ? 0.3 : 1.0;

      launchAirborneFromRelease(scrapId, releaseVelocityWuPerSec, yAboveBaselineWu, gravityMultiplier, momentumMultiplier);
    }
  });

  // Scrap rendering utilities (position calculations)
  const { getRenderedPosition } = useScrapRendering({
    getAirborneState,
    getDragStyle
  });

  // Anchor computation and publishing for AR overlays
  useScrapAnchors({
    getRenderedPosition,
    draggedScrapId
  });

  // Bin collision detection
  const { checkBinCollisions: checkBinCollisionsHook } = useScrapBinCollisions({
    binRef: dropZoneRef,
    getRenderedPosition,
    onCreditsEarned: updateCredits,
    onScrapCollected: incrementCollectedCount
  });

  // Barrier collision detection for airborne scrap
  const { checkBarrierCollisions: checkBarrierCollisionsHook } = useScrapBarrierCollisions({
    getRenderedPosition,
    isAirborne,
    getAirborneState,
    getAveragedVelocity,
    setVelocity,
    adjustPosition
  });

  // Drive purge-zone visual effects during scrap drag using the same resolver
  useEffect(() => {
    if (!draggedScrapId) {
      // Clear active state from both purge zones
      const windowEl = document.getElementById(DOM_IDS.PURGE_ZONE_WINDOW);
      const workmodeEl = document.getElementById(DOM_IDS.PURGE_ZONE_WORKMODE);
      if (windowEl) windowEl.classList.remove('active');
      if (workmodeEl) workmodeEl.classList.remove('active');
      return;
    }
    let rafId: number | null = null;
    const tick = () => {
      const windowEl = document.getElementById(DOM_IDS.PURGE_ZONE_WINDOW);
      const workmodeEl = document.getElementById(DOM_IDS.PURGE_ZONE_WORKMODE);
      
      // Update both purge zones if they exist
      [windowEl, workmodeEl].forEach(el => {
        if (el) {
          const dragStyle = getDragStyle(draggedScrapId);
          // Compute current cursor center from style; fallback to no effect
          if (dragStyle && typeof dragStyle.left === 'string' && typeof dragStyle.bottom === 'string') {
            const leftPx = parseFloat(dragStyle.left);
            const bottomPx = parseFloat(dragStyle.bottom);
            const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
            // Calculate center of scrap element
            const x = leftPx + scrapSizePx / 2;
            const y = viewport.height - bottomPx - scrapSizePx / 2;
            const target = resolveScrapDropTarget({ x, y });
            if (target === 'purgeZone') el.classList.add('active');
            else el.classList.remove('active');
          }
        }
      });
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      const windowEl = document.getElementById(DOM_IDS.PURGE_ZONE_WINDOW);
      const workmodeEl = document.getElementById(DOM_IDS.PURGE_ZONE_WORKMODE);
      if (windowEl) windowEl.classList.remove('active');
      if (workmodeEl) workmodeEl.classList.remove('active');
    };
  }, [draggedScrapId, getDragStyle, resolveScrapDropTarget, viewport, worldSizeToPx]);

  // Scrap spawning logic
  const checkScrapSpawning = useCallback((currentTime: number) => {
    updateSpawnState(prevState => spawnScrapIfReady(currentTime, prevState));
  }, [updateSpawnState]);

  // Scrap position updates
  const updateScrapPositions = useCallback((deltaTime: number) => {
    updateSpawnState(prevState => {
      const updated = updateScrapPositionsUtil(deltaTime, prevState);
      // Prevent stream movement for airborne scraps by restoring their previous X
      if (prevState.activeScrap.length === 0) return updated;
      const prevXMap = new Map(prevState.activeScrap.map(s => [s.id, s.x] as const));
      const dtSeconds = Math.max(0, deltaTime / 1000);
      const adjusted = {
        ...updated,
        activeScrap: updated.activeScrap.map(scrap => {
          if (scrap.id === draggedScrapId) {
            // Update dragged scrap X position to match visual drag position (in world units)
            const grabbedObj = useDragStore.getState().grabbedObject;
            if (grabbedObj.scrapId === scrap.id && grabbedObj.position) {
              // Position is already in world units (center), convert to left edge
              const centerXWu = grabbedObj.position.x;
              const leftEdgeWu = centerXWu - (SCRAP_SIZE_WU / 2);
              return { ...scrap, x: leftEdgeWu, isOffScreen: false };
            }
            // Fallback: freeze in place
            const prevX = prevXMap.get(scrap.id) ?? scrap.x;
            return { ...scrap, x: prevX, isOffScreen: false };
          }
          if (isAirborne(scrap.id)) {
            const prevX = prevXMap.get(scrap.id) ?? scrap.x;
            const vxWu = getHorizontalVelocity(scrap.id); // World units per second
            const nextX = prevX + vxWu * dtSeconds; // Stay in world units
            return { ...scrap, x: nextX };
          }
          return scrap;
        })
      };
      return adjusted;
    });
  }, [draggedScrapId, isAirborne, getHorizontalVelocity, updateSpawnState]);

  // Cleanup collected scrap periodically
  const cleanupScrap = useCallback(() => {
    updateSpawnState(prevState => cleanupCollectedScrap(prevState));
  }, [updateSpawnState]);

  // Subscribe to global clock for game loop
  useClockSubscription(
    'workscreen-gameloop',
    (deltaTime, scaledDeltaTime, tickCount) => {
      const dtSeconds = Math.max(0, scaledDeltaTime / 1000);

      // Update scaled time accumulator (respects pause and time scale)
      scaledTimeRef.current += scaledDeltaTime;

      // Update work session timer (check if work session should end)
      const { updateWorkSessionTime } = useGameStore.getState();
      updateWorkSessionTime(scaledTimeRef.current);

      // Physics step first so horizontal deltas are available this frame
      stepAirborne(dtSeconds);
      updateScrapPositions(scaledDeltaTime);
      checkScrapSpawning(scaledTimeRef.current); // Use scaled time for spawn timing

      // Check barrier collisions for airborne scrap (after physics, before bin)
      updateSpawnState(checkBarrierCollisionsHook);

      // Check bin collisions every frame (continuous collision detection)
      updateSpawnState(checkBinCollisionsHook);

      // Cleanup collected scrap every 6 frames (≈100ms at 60fps)
      if (frameCountRef.current % 6 === 0) {
        cleanupScrap();
      }

      // Update timer display (use scaled time for work session timing)
      const elapsed = scaledTimeRef.current / 1000;
      setElapsedSeconds(elapsed);
      
      // Increment frame counter (for internal timing only)
      frameCountRef.current++;
    },
    {
      priority: 1, // High priority - core gameplay system
      name: 'WorkScreen Game Loop'
    }
  );


  // Clear anchors when component unmounts
  useEffect(() => {
    return () => {
      clearAnchors();
    };
  }, [clearAnchors]);

  // Memoize scrap items with stable style objects to prevent unnecessary re-renders
  const scrapItems = useMemo(() => {
    type ScrapWithStyle = ActiveScrapObject & { style: React.CSSProperties };
    const scrapSizePx = worldSizeToPx(SCRAP_SIZE_WU);
    const beingCollectedIds = getBeingCollectedIds();
    
    const items: ScrapWithStyle[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        // Get position in screen pixels using worldToScreen
        const centerPos = getRenderedPosition(scrap);
        const leftPx = centerPos.x - scrapSizePx / 2;
        const bottomPx = viewport.height - (centerPos.y + scrapSizePx / 2);
        
        const item: ScrapWithStyle = {
          ...scrap,
          style: {
            // Use pixel-based positioning (drag style already uses pixels)
            position: 'fixed',
            left: `${leftPx}px`,
            bottom: `${bottomPx}px`,
            transform: 'none',
            zIndex: 100 // Default z-index, drag style will override when dragging
          }
        };
        
        // If dragging, override with drag style (already in pixels)
        const draggingStyle = getDragStyle(scrap.id);
        if (draggingStyle) {
          item.style = draggingStyle;
        }
        return item;
      });
    return items;
  }, [spawnState.activeScrap, getRenderedPosition, getDragStyle, getBeingCollectedIds, viewport, worldSizeToPx]);


  // Check if work mode purge zone should be shown (upgrade purchased AND purgeZone app installed)
  const isPurgeZoneInstalled = installedApps?.some(app => app.id === 'purgeZone') ?? false;
  const isUpgradePurchased_WorkMode = isUpgradePurchased('purgeZone.workModePurgeZone');
  const showWorkModePurgeZone = isPurgeZoneInstalled && isUpgradePurchased_WorkMode;

  // Calculate scrap bin screen position from world units (respects letterboxing)
  // Uses centralized viewport store - updates reactively when viewport changes
  const binScreenPosition = useMemo(() => {
    return worldRectToScreenStylesFromViewport(
      {
        x: SCRAP_BIN_POSITION_WU.x,
        y: SCRAP_BIN_POSITION_WU.y,
        width: SCRAP_BIN_SIZE_WU,
        height: SCRAP_BIN_SIZE_WU,
        anchor: 'center'
      },
      viewport
    );
  }, [viewport]);

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} collectedCount={collectedCount} />
      <AssemblyLine />
      <ScrapBin
        ref={dropZoneRef}
        style={binScreenPosition}
      />
      
      {/* Conditional work mode purge zone */}
      {showWorkModePurgeZone && <WorkModePurgeZone />}
      
      {/* Render barriers */}
      {barriers.map((barrier) => (
        <Barrier key={barrier.id} barrier={barrier} />
      ))}
      
      {/* Render active scrap objects */}
      {scrapItems.map((item) => (
        <ScrapItem
          key={item.id}
          scrap={item}
          style={item.style}
          draggableProps={getDraggableProps(item.id)}
        />
      ))}
    </div>
  );
};

export default WorkScreen; 