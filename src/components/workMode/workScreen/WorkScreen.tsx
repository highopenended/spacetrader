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
import { useDropZoneBounds } from '../../../hooks/useDropZoneBounds';
import { useScrapPhysics } from '../../../hooks/useScrapPhysics';
import { useScrapDrag } from '../../../hooks/useScrapDrag';
import { SCRAP_BASELINE_BOTTOM_VH, vhFromPx } from '../../../constants/physicsConstants';

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

  // Drop-zone (ScrapBin) bounds
  const { dropZoneRef, isPointInside } = useDropZoneBounds();

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
      // If released inside bin, collect and credit
      if (isPointInside(releasePositionPx.x, releasePositionPx.y)) {
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