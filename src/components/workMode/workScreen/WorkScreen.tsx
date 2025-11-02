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
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU, SCRAP_BIN_SIZE_WU, SCRAP_BIN_POSITION_WU } from '../../../constants/physicsConstants';
import { worldToScreen, WORLD_HEIGHT, WORLD_WIDTH, calculateZoom } from '../../../constants/cameraConstants';
import { worldRectToScreenStylesFromViewport } from '../../../utils/cameraUtils';
import { DOM_IDS } from '../../../constants/domIds';
import { computeAnchorFromScrap } from '../../../utils/anchorUtils';
import WorkModePurgeZone from '../workModePurgeZone/WorkModePurgeZone';
import { useGameStore, useUpgradesStore, useAnchorsStore, useBarrierStore, useDragStore, useScrapStore } from '../../../stores';
import { Anchor } from '../../../stores/anchorsStore';
import { checkBarrierCollision } from '../../../utils/barrierCollisionUtils';
import Barrier from '../barrier/Barrier';

interface WorkScreenProps {
  updateCredits?: (amount: number) => void;
  installedApps?: any[];
}

const WorkScreen: React.FC<WorkScreenProps> = ({ updateCredits, installedApps }) => {
  // Get upgrade checker from upgradesStore
  const isUpgradePurchased = useUpgradesStore(state => state.isPurchased);
  
  // Get anchors store actions for DumpsterVision overlay
  const setAnchors = useAnchorsStore(state => state.setAnchors);
  const clearAnchors = useAnchorsStore(state => state.clearAnchors);
  
  // Get barrier store actions (use version for reactive updates, not getAllBarriers)
  const barriersVersion = useBarrierStore(state => state.version);
  
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
  
  // Camera utilities (viewport for other components)
  const { viewport } = useCameraUtils();
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Frame counting ref for cleanup timing (doesn't trigger re-renders)
  const frameCountRef = useRef<number>(0);
  
  // Scaled time tracking for spawn timing (respects pause and time scale)
  const scaledTimeRef = useRef<number>(0);
  
  // Reset local refs when work session begins (gameMode changes to 'workMode')
  useEffect(() => {
    if (gameMode === 'workMode') {
      scaledTimeRef.current = 0;
      frameCountRef.current = 0;
      setElapsedSeconds(0);
    }
  }, [gameMode]);

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
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			const releasePositionPx = worldToScreen(releasePositionWu.x, releasePositionWu.y, viewportWidth, viewportHeight);
			
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

  // Bin collision detection
  const { checkBinCollisions: checkBinCollisionsHook } = useScrapBinCollisions({
    binRef: dropZoneRef,
    getRenderedPosition,
    onCreditsEarned: updateCredits,
    onScrapCollected: incrementCollectedCount
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
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
            // Calculate center of scrap element
            const x = leftPx + scrapSizePx / 2;
            const y = viewportHeight - bottomPx - scrapSizePx / 2;
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
  }, [draggedScrapId, getDragStyle, resolveScrapDropTarget]);

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
      // Batch all barrier checks into a single state update for efficiency
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
      const scrapWidthVw = (scrapSizePx / viewportWidth) * 100;
      const scrapHeightVh = (scrapSizePx / viewportHeight) * 100;
      
      const activeBarriers = useBarrierStore.getState().getAllBarriers();
      const enabledBarriers = activeBarriers.filter(b => b.enabled);
      if (enabledBarriers.length > 0) {
        updateSpawnState(prevState => {
          let newState = prevState;
          
          // Check all barriers against all airborne scrap in one pass
          prevState.activeScrap.forEach(scrap => {
            if (!isAirborne(scrap.id)) return; // Only check airborne scrap
            
            // Check collision against all enabled barriers
            for (const barrier of enabledBarriers) {
              // Get position in screen pixels, convert to vw/vh for barrier collision (barrier system still uses vw/vh)
              const centerPos = getRenderedPosition(scrap);
              const scrapLeftXPx = centerPos.x - scrapSizePx / 2;
              const scrapBottomYPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
              const xVw = (scrapLeftXPx / viewportWidth) * 100;
              const bottomVh = (scrapBottomYPx / viewportHeight) * 100;
              
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
                const prevScreenPos = worldToScreen(prevCenterXPx, prevCenterYWu, viewportWidth, viewportHeight);
                const prevBottomYPx = viewportHeight - (prevScreenPos.y + scrapSizePx / 2);
                prevBottomVh = (prevBottomYPx / viewportHeight) * 100;
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
                    const viewportHeight = window.innerHeight;
                    const minDimension = Math.min(window.innerWidth, window.innerHeight);
                    const baselineBottomVh = (SCRAP_BASELINE_BOTTOM_WU * minDimension / 10) * (100 / viewportHeight);
                    const correctedYOffsetVh = collision.correctedPositionVh - baselineBottomVh;
                    const correctedYWu = (correctedYOffsetVh / 100) * viewportHeight / (minDimension / 10);
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
        });
      }

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

  // Initialize test barrier on mount
  // useEffect(() => {
  //   setBarriers([
  //     {
  //       id: 'test-barrier-1',
  //       position: {
  //         xVw: 30,        // Left side of screen
  //         bottomVh: 25    // Lower on screen for easier testing
  //       },
  //       width: 20,        // 20vw wide
  //       height: 0.5,      // 0.5vw thick
  //       rotation: 15,      // Flat horizontal barrier
  //       restitution: 0.7, // 70% bounce
  //       friction: 0.2,    // Low friction
  //       enabled: true
  //     },
  //     {
  //       id: 'test-barrier-2',
  //       position: {
  //         xVw: 60,        // Left side of screen
  //         bottomVh: 45    // Lower on screen for easier testing
  //       },
  //       width: 20,        // 20vw wide
  //       height: 0.5,      // 0.5vw thick
  //       rotation: -15,     // Slight upward angle
  //       restitution: 0.9, // Very high bounce
  //       friction: 0.1,    // Low friction
  //       enabled: true
  //     },
  //   ]);
  // }, [setBarriers]);

  // Clear anchors when component unmounts
  useEffect(() => {
    return () => {
      clearAnchors();
    };
  }, [clearAnchors]);

  // Memoize scrap items with stable style objects to prevent unnecessary re-renders
  const scrapItems = useMemo(() => {
    type ScrapWithStyle = ActiveScrapObject & { style: React.CSSProperties };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
    const beingCollectedIds = getBeingCollectedIds();
    
    const items: ScrapWithStyle[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        // Get position in screen pixels using worldToScreen
        const centerPos = getRenderedPosition(scrap);
        const leftPx = centerPos.x - scrapSizePx / 2;
        const bottomPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
        
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
  }, [spawnState.activeScrap, getRenderedPosition, getDragStyle, getBeingCollectedIds]);

  // Publish anchors for overlays when Dumpster Vision is active
  useEffect(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const beingCollectedIds = getBeingCollectedIds();
    
    const anchors: Anchor[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        // Get position in screen pixels (center) - already derived from world units via camera system
        const centerPos = getRenderedPosition(scrap);
        // Compute anchor from scrap using shared utility
        return computeAnchorFromScrap(scrap, centerPos, viewportWidth, viewportHeight);
      });
    setAnchors(anchors);
  }, [spawnState.activeScrap, getRenderedPosition, setAnchors, getBeingCollectedIds]);

  // While dragging, update anchors every frame using live drag style
  useEffect(() => {
    if (!draggedScrapId) return;
    let rafId: number | null = null;
    const tick = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const beingCollectedIds = getBeingCollectedIds();
      const currentState = useScrapStore.getState().getSpawnState();
      
      const anchors: Anchor[] = currentState.activeScrap
        .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
        .map((scrap) => {
          // Get position in screen pixels (center) - already derived from world units via camera system
          const centerPos = getRenderedPosition(scrap);
          // Compute anchor from scrap using shared utility
          return computeAnchorFromScrap(scrap, centerPos, viewportWidth, viewportHeight);
        });
      setAnchors(anchors);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [draggedScrapId, getRenderedPosition, setAnchors, getBeingCollectedIds]);

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