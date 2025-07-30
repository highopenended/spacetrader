import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { 
  initializeScrapSpawnState,
  spawnScrapIfReady,
  updateScrapPositions as updateScrapPositionsUtil,
  cleanupCollectedScrap,
  ActiveScrapObject,
  ScrapSpawnState
} from '../../../utils/scrapUtils';
import AssemblyLine from '../assemblyLine/AssemblyLine';
import ScrapBin from '../scrapBin/ScrapBin';
import WorkTimer from '../workTimer/WorkTimer';
import ScrapItem from '../scrapItem/ScrapItem';
import './WorkScreen.css';

const WorkScreen: React.FC = () => {
  
  // Timer management
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  
  // Scrap spawning state
  const [spawnState, setSpawnState] = useState<ScrapSpawnState>(initializeScrapSpawnState());

  // Scrap spawning logic
  const checkScrapSpawning = useCallback((currentTime: number) => {
    setSpawnState(prevState => spawnScrapIfReady(currentTime, prevState));
  }, []);

  // Scrap position updates
  const updateScrapPositions = useCallback((deltaTime: number) => {
    setSpawnState(prevState => updateScrapPositionsUtil(deltaTime, prevState));
  }, []);

  // Cleanup collected scrap periodically
  const cleanupScrap = useCallback(() => {
    setSpawnState(prevState => cleanupCollectedScrap(prevState));
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;

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
  }, [updateScrapPositions, checkScrapSpawning, cleanupScrap, frameCount]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Memoize scrap items with stable style objects to prevent unnecessary re-renders
  const scrapItems = useMemo(() => 
    spawnState.activeScrap.map((scrap) => ({
      ...scrap,
      style: {
        transform: `translateX(${scrap.x}vw) translateY(-50%)`
      }
    })), 
    [spawnState.activeScrap]
  );

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} frameCount={frameCount} />
      <AssemblyLine />
      <ScrapBin />
      
      {/* Render active scrap objects */}
      {scrapItems.map((scrap) => (
        <ScrapItem
          key={scrap.id}
          scrap={scrap}
          style={scrap.style}
        />
      ))}
    </div>
  );
};

export default WorkScreen; 