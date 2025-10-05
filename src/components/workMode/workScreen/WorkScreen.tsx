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
import { SCRAP_BASELINE_BOTTOM_VH, vhFromPx } from '../../../constants/physicsConstants';
import { MutatorRegistry } from '../../../constants/mutatorRegistry';
import { DOM_IDS } from '../../../constants/domIds';
import { ScrapRegistry } from '../../../constants/scrapRegistry';
import WorkModePurgeZone from '../workModePurgeZone/WorkModePurgeZone';
import { useGameStore, useUpgradesStore, useAnchorsStore } from '../../../stores';
import { Anchor } from '../../../stores/anchorsStore';

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
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Frame counting ref for cleanup timing (doesn't trigger re-renders)
  const frameCountRef = useRef<number>(0);
  
  // Scaled time tracking for spawn timing (respects pause and time scale)
  const scaledTimeRef = useRef<number>(0);
  
  // Scrap spawning state
  const [spawnState, setSpawnState] = useState<ScrapSpawnState>(initializeScrapSpawnState());
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [scrapSize, setScrapSize] = useState<{ widthVw: number; heightVh: number } | null>(null);

  // Centralized scrap drop targets (purge zone + bin)
  const { binRef: dropZoneRef, resolveScrapDropTarget } = useScrapDropTargets();

  // Physics-lite airborne handling
  const {
    isAirborne,
    getAirborneState,
    stepAirborne,
    launchAirborneFromRelease,
    getHorizontalVelocity
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
    onDrop: ({ scrapId, releasePositionPx, releaseVelocityPxPerSec, elementSizePx }) => {
			// Resolve drop target centrally
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
			// If released inside bin, collect and credit
			if (target === 'bin') {
        // Hide immediately to avoid any visual snap-back
        setBeingCollectedIds(prev => {
          const next = new Set(prev);
          next.add(scrapId);
          return next;
        });
        setSpawnState(prev => {
          const { spawnState: newState, collectedScrap } = collectScrap(scrapId, prev);
          if (collectedScrap && updateCredits) {
            const creditToAdd = calculateScrapValue(collectedScrap);
            updateCredits(creditToAdd);
          }
          return newState;
        });
        // Clear immediately after state update completes
        queueMicrotask(() => {
          setBeingCollectedIds(prev => {
            const next = new Set(prev);
            next.delete(scrapId);
            return next;
          });
        });
        setCollectedCount(prev => prev + 1);
        return;
      }

      // Else, launch airborne and keep visual position consistent with drag center
      // Keep exactly the same anchoring as drag (left+bottom without transforms)
      const vwPerPx = 1 / (window.innerWidth / 100);
      const leftPx = Math.max(0, releasePositionPx.x - (elementSizePx?.width || 0) / 2);
      const bottomPx = Math.max(0, window.innerHeight - (releasePositionPx.y + (elementSizePx?.height || 0) / 2));
      const newXvw = Math.max(0, Math.min(100, leftPx * vwPerPx));
      const yAboveBaselineVh = Math.max(0, vhFromPx(bottomPx) - SCRAP_BASELINE_BOTTOM_VH);

      setSpawnState(prev => ({
        ...prev,
        activeScrap: prev.activeScrap.map(s => (s.id === scrapId ? { ...s, x: newXvw } : s))
      }));

      // Apply custom physics modifiers for dense scrap
      const mutators = getScrapMutators(scrapId);
      const isDense = mutators.includes('dense');
      const gravityMultiplier = isDense ? 1.5 : 1.0;
      const momentumMultiplier = isDense ? 0.3 : 1.0;

      launchAirborneFromRelease(scrapId, releaseVelocityPxPerSec, yAboveBaselineVh, gravityMultiplier, momentumMultiplier);
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
            const x = leftPx + (window.innerWidth * 0.018); // approx half of 3.6vw square
            const y = window.innerHeight - bottomPx - (window.innerHeight * 0.018);
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
            // Freeze dragged scrap entirely (no conveyor movement or off-screen)
            const prevX = prevXMap.get(scrap.id) ?? scrap.x;
            return { ...scrap, x: prevX, isOffScreen: false };
          }
          if (isAirborne(scrap.id)) {
            const prevX = prevXMap.get(scrap.id) ?? scrap.x;
            const vx = getHorizontalVelocity(scrap.id);
            const nextX = Math.max(0, Math.min(100, prevX + vx * dtSeconds));
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

  // Measure scrap element size (dynamic) and cache in vw/vh units
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('.scrap-item') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const widthVw = rect.width * (100 / window.innerWidth);
        const heightVh = rect.height * (100 / window.innerHeight);
        setScrapSize(prev => {
          if (!prev || Math.abs(prev.widthVw - widthVw) > 0.01 || Math.abs(prev.heightVh - heightVh) > 0.01) {
            return { widthVw, heightVh };
          }
          return prev;
        });
      }
    };
    // Initial tries (immediate and next frame)
    measure();
    const raf = requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // If we haven't measured yet, try again when scraps appear
  useEffect(() => {
    if (scrapSize) return;
    if (spawnState.activeScrap.length === 0) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector('.scrap-item') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const widthVw = rect.width * (100 / window.innerWidth);
        const heightVh = rect.height * (100 / window.innerHeight);
        setScrapSize({ widthVw, heightVh });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [scrapSize, spawnState.activeScrap.length]);

  // Helper: compute actual on-screen position for a scrap id, including drag overrides
  const getRenderedPosition = useCallback((scrap: ActiveScrapObject) => {
    // Defaults from physics/baseline
    let xVw = scrap.x;
    const airborne = getAirborneState(scrap.id);
    const baseBottomVh = SCRAP_BASELINE_BOTTOM_VH;
    let bottomVh = airborne?.isAirborne ? baseBottomVh + Math.max(0, airborne.yVh) : baseBottomVh;

    // If dragging, override from drag style (may be px or vw/vh)
    const dragStyle = getDragStyle(scrap.id);
    if (dragStyle) {
      const vwPerPx = 100 / window.innerWidth;
      const vhPerPx = 100 / window.innerHeight;

      const left = dragStyle.left as unknown as string | number | undefined;
      const bottom = dragStyle.bottom as unknown as string | number | undefined;

      if (typeof left === 'string') {
        if (left.endsWith('vw')) xVw = parseFloat(left);
        else if (left.endsWith('px')) xVw = parseFloat(left) * vwPerPx;
      } else if (typeof left === 'number') {
        xVw = left * vwPerPx;
      }

      if (typeof bottom === 'string') {
        if (bottom.endsWith('vh')) bottomVh = parseFloat(bottom);
        else if (bottom.endsWith('px')) bottomVh = parseFloat(bottom) * vhPerPx;
      } else if (typeof bottom === 'number') {
        bottomVh = bottom * vhPerPx;
      }
    }

    return { xVw, bottomVh };
  }, [getAirborneState, getDragStyle]);

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
    const items: ScrapWithStyle[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
      const airborne = getAirborneState(scrap.id);
      const baseBottomVh = SCRAP_BASELINE_BOTTOM_VH;
      const bottomVh = airborne?.isAirborne ? baseBottomVh + Math.max(0, airborne.yVh) : baseBottomVh;
      const item: ScrapWithStyle = {
        ...scrap,
        style: {
          // Anchoring model: left (vw) + bottom (vh), transform: none
          left: `${scrap.x}vw`,
          transform: 'none',
          bottom: `${bottomVh}vh`
        }
      };
      const draggingStyle = getDragStyle(scrap.id);
      if (draggingStyle) {
        item.style = draggingStyle;
      }
      return item;
    });
    return items;
  }, [spawnState.activeScrap, beingCollectedIds, getAirborneState, getDragStyle]);

  // Publish anchors for overlays when Dumpster Vision is active
  useEffect(() => {
    const anchors: Anchor[] = spawnState.activeScrap
      .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
      .map((scrap) => {
        const { xVw, bottomVh } = getRenderedPosition(scrap);
        const typeEntry = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
        const typeLabel = `${typeEntry?.label ?? scrap.typeId}`;
        const mutatorLinesArr = scrap.mutators
          .map(id => {
            const m = MutatorRegistry[id as keyof typeof MutatorRegistry];
            return m ? `${m.appearance} ${m.label}` : id;
          });
        const label = [typeLabel, ...mutatorLinesArr].join('\n');
        // Compute scrap center for connectors
        const cxVw = xVw + (scrapSize?.widthVw ?? 0) / 2;
        const cyVh = bottomVh + (scrapSize?.heightVh ?? 0) / 2;
        return {
          id: scrap.id,
          xVw: xVw + (scrapSize?.widthVw ?? 0) + 0.5, // slight hud offset right
          bottomVh: bottomVh + (scrapSize?.heightVh ?? 0) + 0.4, // slight hud offset up
          label,
          cxVw,
          cyVh,
        } as Anchor;
      });
    setAnchors(anchors);
  }, [spawnState.activeScrap, beingCollectedIds, getRenderedPosition, scrapSize, setAnchors]);

  // While dragging, update anchors every frame using live drag style
  useEffect(() => {
    if (!draggedScrapId) return;
    let rafId: number | null = null;
    const tick = () => {
      const anchors: Anchor[] = spawnState.activeScrap
        .filter(scrap => !scrap.isCollected && !beingCollectedIds.has(scrap.id))
        .map((scrap) => {
          const { xVw, bottomVh } = getRenderedPosition(scrap);
          const typeEntry = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
          const typeLabel = `${typeEntry?.label ?? scrap.typeId}`;
          const mutatorLinesArr = scrap.mutators
            .map(id => {
              const m = MutatorRegistry[id as keyof typeof MutatorRegistry];
              return m ? `${m.appearance} ${m.label}` : id;
            });
          const label = [typeLabel, ...mutatorLinesArr].join('\n');
          const cxVw = xVw + (scrapSize?.widthVw ?? 0) / 2;
          const cyVh = bottomVh + (scrapSize?.heightVh ?? 0) / 2;
          return {
            id: scrap.id,
            xVw: xVw + (scrapSize?.widthVw ?? 0) + 0.5,
            bottomVh: bottomVh + (scrapSize?.heightVh ?? 0) + 0.4,
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
  }, [draggedScrapId, spawnState.activeScrap, beingCollectedIds, getRenderedPosition, scrapSize, setAnchors]);

  // Check if work mode purge zone should be shown (upgrade purchased AND purgeZone app installed)
  const isPurgeZoneInstalled = installedApps?.some(app => app.id === 'purgeZone') ?? false;
  const isUpgradePurchased_WorkMode = isUpgradePurchased('purgeZone.workModePurgeZone');
  const showWorkModePurgeZone = isPurgeZoneInstalled && isUpgradePurchased_WorkMode;

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} collectedCount={collectedCount} />
      <AssemblyLine />
      <ScrapBin ref={dropZoneRef} />
      
      {/* Conditional work mode purge zone */}
      {showWorkModePurgeZone && <WorkModePurgeZone />}
      
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