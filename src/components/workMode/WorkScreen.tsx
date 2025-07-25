import React, { useRef, useCallback, useEffect, useState } from 'react';
import { 
  getAssemblyLineConfig, 
  initializeScrapSpawnState,
  spawnScrapIfReady,
  updateScrapPositions as updateScrapPositionsUtil,
  cleanupCollectedScrap,
  ActiveScrapObject,
  ScrapSpawnState
} from '../../utils/scrapUtils';
import AssemblyLine from './AssemblyLine';
import ScrapBin from './ScrapBin';
import WorkTimer from './WorkTimer';
import ScrapItem from './ScrapItem';
import './WorkScreen.css';

const WorkScreen: React.FC = () => {
  const config = getAssemblyLineConfig();
  
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

  return (
    <div className="work-screen">
      <WorkTimer elapsedSeconds={elapsedSeconds} frameCount={frameCount} />
      <AssemblyLine />
      <ScrapBin />
      
      {/* Render active scrap objects */}
      {spawnState.activeScrap.map((scrap) => (
        <ScrapItem
          key={scrap.id}
          scrap={scrap}
          style={{
            transform: `translateX(${scrap.x}vw) translateY(-50%)`
          }}
        />
      ))}
    </div>
  );
};

export default WorkScreen; 