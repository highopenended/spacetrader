import React, { useRef, useCallback, useEffect, useState } from 'react';
import { getAssemblyLineConfig } from '../../utils/scrapUtils';
import AssemblyLine from './AssemblyLine';
import ScrapBin from './ScrapBin';
import WorkTimer from './WorkTimer';

const WorkScreen: React.FC = () => {
  const config = getAssemblyLineConfig();
  
  // Timer management
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  
  // Timer display state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  
  const workScreenStyle = {
    '--assembly-line-bottom': `${config.layout.bottom}px`,
    '--assembly-line-height': `${config.layout.height}px`,
    '--assembly-line-z-index': config.visuals.zIndex,
    '--assembly-line-track-height': `${config.layout.trackHeight}px`
  } as React.CSSProperties;

  // Placeholder functions for now
  const updateScrapPositions = useCallback((deltaTime: number) => {
    // TODO: Implement scrap position updates
  }, []);

  const checkScrapSpawning = useCallback((currentTime: number) => {
    // TODO: Implement scrap spawning logic
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;

    updateScrapPositions(deltaTime);
    checkScrapSpawning(currentTime);

    // Update timer display
    const elapsed = (currentTime - startTimeRef.current) / 1000;
    setElapsedSeconds(elapsed);
    setFrameCount(prev => prev + 1);

    lastFrameTimeRef.current = currentTime;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateScrapPositions, checkScrapSpawning]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="work-screen" style={workScreenStyle}>
      <WorkTimer elapsedSeconds={elapsedSeconds} frameCount={frameCount} />
      <AssemblyLine />
      <ScrapBin />
    </div>
  );
};

export default WorkScreen; 