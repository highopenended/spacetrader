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
import { setAnchors, clear as clearAnchors } from '../../visualOverlayManager/anchors/AnchorsStore';
import { Anchor } from '../../visualOverlayManager/anchors/types';
import { useDropZoneBounds } from '../../../hooks/useDropZoneBounds';
import { useScrapDropTargets } from '../../../hooks/useScrapDropTargets';
import { useScrapPhysics } from '../../../hooks/useScrapPhysics';
import { useScrapDrag } from '../../../hooks/useScrapDrag';
import { SCRAP_BASELINE_BOTTOM_VH, vhFromPx } from '../../../constants/physicsConstants';
import { MutatorRegistry } from '../../../constants/mutatorRegistry';
import { DOM_IDS } from '../../../constants/domIds';
import { ScrapRegistry } from '../../../constants/scrapRegistry';

interface WorkScreenProps {
  updateCredits?: (amount: number) => void;
}

const WorkScreen: React.FC<WorkScreenProps> = ({ updateCredits }) => {
  
  // Timer management
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  
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

  // Drag handling for scrap items
  const [beingCollectedIds, setBeingCollectedIds] = useState<Set<string>>(new Set());
  const { getDraggableProps, getDragStyle, draggedScrapId } = useScrapDrag({
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

      // Momentum is handled in physics; no extra nudge to avoid double application

      launchAirborneFromRelease(scrapId, releaseVelocityPxPerSec, yAboveBaselineVh);
    }
  });

  // Drive purge-zone visual effects during scrap drag using the same resolver
  useEffect(() => {
    if (!draggedScrapId) {
      const el = document.getElementById(DOM_IDS.PURGE_ZONE);
      if (el) el.classList.remove('active');
      return;
    }
    let rafId: number | null = null;
    const tick = () => {
      const el = document.getElementById(DOM_IDS.PURGE_ZONE);
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
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      const el = document.getElementById(DOM_IDS.PURGE_ZONE);
      if (el) el.classList.remove('active');
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

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;
    const dtSeconds = Math.max(0, deltaTime / 1000);

    // Physics step first so horizontal deltas are available this frame
    stepAirborne(dtSeconds);
    updateScrapPositions(deltaTime);
    checkScrapSpawning(currentTime);

    // Cleanup collected scrap every 100ms
    if (frameCount % 6 === 0) {
      cleanupScrap();
    }

    // Update timer display
    const elapsed = (currentTime - startTimeRef.current) / 1000;
    setElapsedSeconds(elapsed);
    setFrameCount(prev => prev + 1);

    lastFrameTimeRef.current = currentTime;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateScrapPositions, stepAirborne, checkScrapSpawning, cleanupScrap, frameCount]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clear anchors when leaving work screen
      clearAnchors();
    };
  }, [gameLoop]);

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
  }, [spawnState.activeScrap, getAirborneState, getDragStyle]);

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
  }, [spawnState.activeScrap, beingCollectedIds, getRenderedPosition, scrapSize]);

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
  }, [draggedScrapId, spawnState.activeScrap, beingCollectedIds, getRenderedPosition, scrapSize]);

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} frameCount={frameCount} collectedCount={collectedCount} />
      <AssemblyLine />
      <ScrapBin ref={dropZoneRef} />
      
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