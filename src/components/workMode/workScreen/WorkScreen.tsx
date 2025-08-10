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
  const { getDraggableProps, getDragStyle } = useScrapDrag({
    onDrop: ({ scrapId, releasePositionPx, releaseVelocityPxPerSec, elementSizePx }) => {
      // If released inside bin, collect and credit
      if (isPointInside(releasePositionPx.x, releasePositionPx.y)) {
        setSpawnState(prev => {
          const { spawnState: newState, collectedScrap } = collectScrap(scrapId, prev);
          if (collectedScrap && updateCredits) {
            const creditToAdd = calculateScrapValue(collectedScrap);
            updateCredits(creditToAdd);
          }
          return newState;
        });
        setCollectedCount(prev => prev + 1);
        return;
      }

      // Else, launch airborne and keep X where released
      const bottomPx = Math.max(0, window.innerHeight - releasePositionPx.y);
      const yAboveBaselineVh = Math.max(0, vhFromPx(bottomPx) - SCRAP_BASELINE_BOTTOM_VH);
      // Use the element center under cursor for X
      const newXvw = Math.max(0, Math.min(100, (releasePositionPx.x / (window.innerWidth / 100))));

      setSpawnState(prev => ({
        ...prev,
        activeScrap: prev.activeScrap.map(s => (s.id === scrapId ? { ...s, x: newXvw } : s))
      }));

      // Include horizontal momentum by slightly adjusting x over the first physics step
      // Convert horizontal velocity px/s to vw/s and nudge X immediately for throw feel (scaled)
      const vwPerPx = 1 / (window.innerWidth / 100);
      const vxVwPerSec = releaseVelocityPxPerSec.vx * vwPerPx * 0.8;
      const initialNudgeVw = vxVwPerSec * 0.016; // ~one frame worth
      setSpawnState(prev => ({
        ...prev,
        activeScrap: prev.activeScrap.map(s => (s.id === scrapId ? { ...s, x: Math.max(0, Math.min(100, s.x + initialNudgeVw)) } : s))
      }));

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
      const adjusted = {
        ...updated,
        activeScrap: updated.activeScrap.map(scrap => {
          if (isAirborne(scrap.id)) {
            // Apply horizontal momentum while airborne
            const prevX = prevXMap.get(scrap.id) ?? scrap.x;
            const vx = getHorizontalVelocity(scrap.id);
            const dtSeconds = Math.max(0, deltaTime / 1000);
            const nextX = Math.max(0, Math.min(100, prevX + vx * dtSeconds));
            return { ...scrap, x: nextX };
          }
          return scrap;
        })
      };
      return adjusted;
    });
  }, [isAirborne, getHorizontalVelocity]);

  // Cleanup collected scrap periodically
  const cleanupScrap = useCallback(() => {
    setSpawnState(prevState => cleanupCollectedScrap(prevState));
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;
    const dtSeconds = Math.max(0, deltaTime / 1000);

    updateScrapPositions(deltaTime);
    // Physics step for airborne scraps
    stepAirborne(dtSeconds);
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
      .filter(scrap => !scrap.isCollected)
      .map((scrap) => {
      const airborne = getAirborneState(scrap.id);
      const bottomVh = airborne?.isAirborne ? 24 + Math.max(0, airborne.yVh) : 24;
      const item: ScrapWithStyle = {
        ...scrap,
        style: {
          transform: `translateX(${scrap.x}vw) translateY(-50%)`,
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