import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { 
  initializeScrapSpawnState,
  spawnScrapIfReady,
  updateScrapPositions as updateScrapPositionsUtil,
  cleanupCollectedScrap,
  ActiveScrapObject,
  ScrapSpawnState,
  collectScrap,
  calculateScrapValue
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
import { SCRAP_BASELINE_BOTTOM_WU, SCRAP_SIZE_WU, SCRAP_BIN_SIZE_WU, SCRAP_BIN_POSITION_WU } from '../../../constants/physicsConstants';
import { worldToScreen, WORLD_HEIGHT, WORLD_WIDTH, calculateZoom } from '../../../constants/cameraConstants';
import { MutatorRegistry } from '../../../constants/mutatorRegistry';
import { DOM_IDS } from '../../../constants/domIds';
import { ScrapRegistry } from '../../../constants/scrapRegistry';
import WorkModePurgeZone from '../workModePurgeZone/WorkModePurgeZone';
import { useGameStore, useUpgradesStore, useAnchorsStore, useBarrierStore, useDragStore, useViewportStore } from '../../../stores';
import { Anchor } from '../../../stores/anchorsStore';
import { checkRectOverlap, domRectToRect, Rect } from '../../../utils/collisionUtils';
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
  const setBarriers = useBarrierStore(state => state.setBarriers);
  
  // Get barriers for rendering (memoized, only updates when version changes)
  const barriers = useMemo(() => {
    return useBarrierStore.getState().getAllBarriers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barriersVersion]);
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Frame counting ref for cleanup timing (doesn't trigger re-renders)
  const frameCountRef = useRef<number>(0);
  
  // Scaled time tracking for spawn timing (respects pause and time scale)
  const scaledTimeRef = useRef<number>(0);
  
  // Scrap spawning state
  const [spawnState, setSpawnState] = useState<ScrapSpawnState>(initializeScrapSpawnState());
  const [collectedCount, setCollectedCount] = useState<number>(0);
  // Scrap size is now a constant in world units - no need for dynamic measurement

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

  // Helper function to get scrap object
  const getScrap = useCallback((scrapId: string) => {
    return spawnState.activeScrap.find(s => s.id === scrapId);
  }, [spawnState.activeScrap]);

  // Helper function to get mutators for a scrap
  const getScrapMutators = useCallback((scrapId: string): string[] => {
    const scrap = spawnState.activeScrap.find(s => s.id === scrapId);
    return scrap?.mutators || [];
  }, [spawnState.activeScrap]);

  // Drag handling for scrap items
  const [beingCollectedIds, setBeingCollectedIds] = useState<Set<string>>(new Set());
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
				setBeingCollectedIds(prev => {
					const next = new Set(prev);
					next.add(scrapId);
					return next;
				});
				setSpawnState(prev => {
					const { spawnState: newState } = collectScrap(scrapId, prev);
					return newState;
				});
				queueMicrotask(() => {
					setBeingCollectedIds(prev => {
						const next = new Set(prev);
						next.delete(scrapId);
						return next;
					});
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
    setSpawnState(prevState => spawnScrapIfReady(currentTime, prevState));
  }, []);

  // Scrap position updates
  const updateScrapPositions = useCallback((deltaTime: number) => {
    setSpawnState(prevState => {
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
  }, [draggedScrapId, isAirborne, getHorizontalVelocity]);

  // Cleanup collected scrap periodically
  const cleanupScrap = useCallback(() => {
    setSpawnState(prevState => cleanupCollectedScrap(prevState));
  }, []);

  // Scrap size is constant in world units (SCRAP_SIZE_WU)

  // Helper: compute actual on-screen position for a scrap id in screen pixels, including drag overrides
  const getRenderedPosition = useCallback((scrap: ActiveScrapObject) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate world position (center of scrap)
    const airborne = getAirborneState(scrap.id);
    const centerXWu = scrap.x + (SCRAP_SIZE_WU / 2); // scrap.x is left edge, convert to center
    
    // Calculate Y position in world units (Y=0 is top, increases downward)
    // World Y from bottom = SCRAP_BASELINE_BOTTOM_WU + airborne offset
    const worldYFromBottomWu = SCRAP_BASELINE_BOTTOM_WU + (airborne?.isAirborne ? airborne.yWu : 0);
    // Convert to world Y coordinate (Y=0 is top, WORLD_HEIGHT is bottom)
    const centerYWu = WORLD_HEIGHT - worldYFromBottomWu;
    
    // Convert world position to screen pixels using camera system
    let screenPos = worldToScreen(centerXWu, centerYWu, viewportWidth, viewportHeight);
    
    // If dragging, override from drag style (dragStyle returns pixels)
    const dragStyle = getDragStyle(scrap.id);
    if (dragStyle) {
      const left = dragStyle.left as unknown as string | number | undefined;
      const bottom = dragStyle.bottom as unknown as string | number | undefined;

      if (typeof left === 'string' && left.endsWith('px')) {
        // dragStyle.left is left edge in pixels, convert to center
        const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
        screenPos.x = parseFloat(left) + scrapSizePx / 2;
      } else if (typeof left === 'number') {
        const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
        screenPos.x = left + scrapSizePx / 2;
      }

      if (typeof bottom === 'string' && bottom.endsWith('px')) {
        // bottom is distance from bottom of viewport, convert to screen Y (top=0)
        const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
        screenPos.y = viewportHeight - parseFloat(bottom) - scrapSizePx / 2;
      } else if (typeof bottom === 'number') {
        const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
        screenPos.y = viewportHeight - bottom - scrapSizePx / 2;
      }
    }

    return screenPos;
  }, [getAirborneState, getDragStyle]);

  // Check scrap-bin collisions and collect any overlapping scrap
  const checkBinCollisions = useCallback(() => {
    if (!dropZoneRef.current) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
    
    const binRect = domRectToRect(dropZoneRef.current.getBoundingClientRect());
    
    setSpawnState(prevState => {
      let newState = prevState;
      let creditsToAdd = 0;
      
      // Check each active scrap for collision with bin
      for (const scrap of prevState.activeScrap) {
        if (scrap.isCollected) continue;
        
        // Get current rendered position in screen pixels (center)
        const centerPos = getRenderedPosition(scrap);
        
        // Convert center position + size to rect (top-left corner)
        const scrapRect: Rect = {
          left: centerPos.x - scrapSizePx / 2,
          top: centerPos.y - scrapSizePx / 2,
          right: centerPos.x + scrapSizePx / 2,
          bottom: centerPos.y + scrapSizePx / 2
        };
        
        // Check collision
        if (checkRectOverlap(scrapRect, binRect)) {
          // Collect this scrap
          const result = collectScrap(scrap.id, newState);
          newState = result.spawnState;
          
          if (result.collectedScrap && updateCredits) {
            creditsToAdd += calculateScrapValue(result.collectedScrap);
          }
          
          setCollectedCount(prev => prev + 1);
        }
      }
      
      // Apply credits once after all collections
      if (creditsToAdd > 0 && updateCredits) {
        updateCredits(creditsToAdd);
      }
      
      return newState;
    });
  }, [dropZoneRef, getRenderedPosition, updateCredits]);

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
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
      const scrapWidthVw = (scrapSizePx / viewportWidth) * 100;
      const scrapHeightVh = (scrapSizePx / viewportHeight) * 100;
      
      const activeBarriers = useBarrierStore.getState().getAllBarriers();
      for (const barrier of activeBarriers) {
        if (!barrier.enabled) continue;
        
        setSpawnState(prevState => {
          let newState = prevState;
          
          prevState.activeScrap.forEach(scrap => {
            if (!isAirborne(scrap.id)) return; // Only check airborne scrap
            
            // Get position in screen pixels, convert to vw/vh for barrier collision (barrier system still uses vw/vh)
            const centerPos = getRenderedPosition(scrap);
            const scrapLeftXPx = centerPos.x - scrapSizePx / 2;
            const scrapBottomYPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
            const xVw = (scrapLeftXPx / viewportWidth) * 100;
            const bottomVh = (scrapBottomYPx / viewportHeight) * 100;
            
            // Use AVERAGED velocity over last 5 frames for stable, accurate collision response
            const velocity = getAveragedVelocity(scrap.id);
            if (!velocity) return;
            
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
              }
            });
            
            return newState;
          });
      }

      // Check bin collisions every frame (continuous collision detection)
      checkBinCollisions();

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
  }, [spawnState.activeScrap, beingCollectedIds, getRenderedPosition, getDragStyle]);

  // Publish anchors for overlays when Dumpster Vision is active
  useEffect(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
    
    const anchors: Anchor[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        // Get position in screen pixels (center)
        const centerPos = getRenderedPosition(scrap);
        
        // Convert to vw/vh for anchors (anchor system expects vw/vh)
        const leftPx = centerPos.x - scrapSizePx / 2;
        const bottomPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
        const xVw = (leftPx / viewportWidth) * 100;
        const bottomVh = (bottomPx / viewportHeight) * 100;
        const scrapWidthVw = (scrapSizePx / viewportWidth) * 100;
        const scrapHeightVh = (scrapSizePx / viewportHeight) * 100;
        
        const typeEntry = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
        const typeLabel = `${typeEntry?.label ?? scrap.typeId}`;
        const mutatorLinesArr = scrap.mutators
          .map(id => {
            const m = MutatorRegistry[id as keyof typeof MutatorRegistry];
            return m ? `${m.appearance} ${m.label}` : id;
          });
        const label = [typeLabel, ...mutatorLinesArr].join('\n');
        
        // Compute scrap center for connectors
        const cxVw = xVw + scrapWidthVw / 2;
        const cyVh = bottomVh + scrapHeightVh / 2;
        
        return {
          id: scrap.id,
          xVw: xVw + scrapWidthVw + 0.5, // slight hud offset right
          bottomVh: bottomVh + scrapHeightVh + 0.4, // slight hud offset up
          label,
          cxVw,
          cyVh,
        } as Anchor;
      });
    setAnchors(anchors);
  }, [spawnState.activeScrap, beingCollectedIds, getRenderedPosition, setAnchors]);

  // While dragging, update anchors every frame using live drag style
  useEffect(() => {
    if (!draggedScrapId) return;
    let rafId: number | null = null;
    const tick = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrapSizePx = SCRAP_SIZE_WU * calculateZoom(viewportWidth, viewportHeight);
      
      const anchors: Anchor[] = spawnState.activeScrap
        .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
        .map((scrap) => {
          // Get position in screen pixels (center)
          const centerPos = getRenderedPosition(scrap);
          
          // Convert to vw/vh for anchors
          const leftPx = centerPos.x - scrapSizePx / 2;
          const bottomPx = viewportHeight - (centerPos.y + scrapSizePx / 2);
          const xVw = (leftPx / viewportWidth) * 100;
          const bottomVh = (bottomPx / viewportHeight) * 100;
          const scrapWidthVw = (scrapSizePx / viewportWidth) * 100;
          const scrapHeightVh = (scrapSizePx / viewportHeight) * 100;
          
          const typeEntry = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
          const typeLabel = `${typeEntry?.label ?? scrap.typeId}`;
          const mutatorLinesArr = scrap.mutators
            .map(id => {
              const m = MutatorRegistry[id as keyof typeof MutatorRegistry];
              return m ? `${m.appearance} ${m.label}` : id;
            });
          const label = [typeLabel, ...mutatorLinesArr].join('\n');
          
          const cxVw = xVw + scrapWidthVw / 2;
          const cyVh = bottomVh + scrapHeightVh / 2;
          
          return {
            id: scrap.id,
            xVw: xVw + scrapWidthVw + 0.5,
            bottomVh: bottomVh + scrapHeightVh + 0.4,
            label,
            cxVw,
            cyVh
          } as Anchor;
        });
      setAnchors(anchors);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [draggedScrapId, spawnState.activeScrap, beingCollectedIds, getRenderedPosition, setAnchors]);

  // Check if work mode purge zone should be shown (upgrade purchased AND purgeZone app installed)
  const isPurgeZoneInstalled = installedApps?.some(app => app.id === 'purgeZone') ?? false;
  const isUpgradePurchased_WorkMode = isUpgradePurchased('purgeZone.workModePurgeZone');
  const showWorkModePurgeZone = isPurgeZoneInstalled && isUpgradePurchased_WorkMode;

  // Get viewport dimensions from centralized viewport store
  const viewport = useViewportStore(state => state.viewport);
  
  // Calculate scrap bin screen position from world units (respects letterboxing)
  // Uses centralized viewport store - updates reactively when viewport changes
  const centerScreenPos = worldToScreen(SCRAP_BIN_POSITION_WU.x, SCRAP_BIN_POSITION_WU.y, viewport.width, viewport.height);
  const zoom = calculateZoom(viewport.width, viewport.height);
  const binSizePx = SCRAP_BIN_SIZE_WU * zoom;
  
  const binScreenPosition = {
    left: centerScreenPos.x - binSizePx / 2,
    top: centerScreenPos.y - binSizePx / 2,
    width: binSizePx,
    height: binSizePx
  };

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} collectedCount={collectedCount} />
      <AssemblyLine />
      <ScrapBin 
        ref={dropZoneRef} 
        style={{
          left: `${binScreenPosition.left}px`,
          top: `${binScreenPosition.top}px`,
          width: `${binScreenPosition.width}px`,
          height: `${binScreenPosition.height}px`
        }}
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