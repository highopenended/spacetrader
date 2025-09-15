/**
 * Recursive Purge Cutscene
 * 
 * Dramatic ending sequence for when the purge zone is dropped into itself.
 * Clean slate - ready for step-by-step implementation.
 */

import React, { useState, useEffect } from 'react';
import PanicMessageOverlay from './effects/PanicMessageOverlay';
import CRTEffects from './effects/CRTEffects';
import { useClockStore } from '../../../../stores';
import './RecursivePurgeCutscene.css';

interface RecursivePurgeCutsceneProps {
  /** Called when the cutscene completes */
  onComplete: () => void;
  /** The ending that triggered this cutscene */
  endingName: string;
  /** Ending description */
  endingDescription?: string;
  /** Function to reset the game */
  resetGame?: () => void;
}

const RecursivePurgeCutscene: React.FC<RecursivePurgeCutsceneProps> = ({ 
  onComplete, 
  endingName, 
  endingDescription,
  resetGame
}) => {
  const [panicActive, setPanicActive] = useState(false);
  const [panicIntensity, setPanicIntensity] = useState<'low' | 'medium' | 'high' | 'extreme'>('low');
  const [crtActive, setCrtActive] = useState(false);
  const [crtIntensity, setCrtIntensity] = useState<'subtle' | 'moderate' | 'heavy' | 'extreme'>('subtle');
  const [showEndingScreen, setShowEndingScreen] = useState(false);

  // Clock store actions for gradual slowdown
  const setTimeScale = useClockStore((state: any) => state.setTimeScale);
  const pauseClock = useClockStore((state: any) => state.pauseClock);

  // Gradual slowdown effect - reduce time scale from 1.0 to 0 over 2 seconds
  // Creates dramatic effect where game world slows down while panic messages continue at normal speed
  useEffect(() => {
    let currentTimeScale = 1.0;
    const slowdownInterval = 200; // Change every 200ms
    const totalSteps = 2000 / slowdownInterval; // 10 steps over 2 seconds
    const scaleDecrement = 1.0 / totalSteps; // 0.1 per step
    
    const slowdownTimer = setInterval(() => {
      currentTimeScale -= scaleDecrement;
      
      if (currentTimeScale <= 0) {
        currentTimeScale = 0;
        setTimeScale(0);
        pauseClock();
        clearInterval(slowdownTimer);
      } else {
        setTimeScale(currentTimeScale);
      }
    }, slowdownInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(slowdownTimer);
    };
  }, []); // Run once when cutscene starts

  // Start effects and gradually increase intensity
  useEffect(() => {
    // Start with both effects immediately
    setPanicActive(true);
    setCrtActive(true);
    
    // Gradually escalate intensity for both effects
    const escalationTimers = [
      setTimeout(() => {
        setPanicIntensity('medium');
        setCrtIntensity('moderate');
      }, 2800),   // 2.8s
      setTimeout(() => {
        setPanicIntensity('high');
        setCrtIntensity('heavy');
      }, 5600),     // 5.6s  
      setTimeout(() => {
        setPanicIntensity('extreme');
        setCrtIntensity('extreme');
      }, 8400),  // 8.4s
      setTimeout(() => {
        setPanicActive(false);
        setCrtActive(false);
        setShowEndingScreen(true);
      }, 11200) // 11.2s - end effects and show ending
    ];

    return () => {
      escalationTimers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Handle click to continue (only when ending screen is showing)
  const handleClick = () => {
    if (showEndingScreen) {
      // Reset the game if resetGame function is provided
      if (resetGame) {
        resetGame();
      }
      onComplete();
    }
  };

  return (
    <>
      {/* CRT Effects - runs in background */}
      <CRTEffects 
        isActive={crtActive}
        intensity={crtIntensity}
      />
      
      {/* Panic Message Effect */}
      <PanicMessageOverlay 
        isActive={panicActive}
        intensity={panicIntensity}
      />
      
      {/* Ending Screen */}
      {showEndingScreen && (
        <div className="recursive-purge-overlay" onClick={handleClick}>
          <div className="temp-content">
            <h1>{endingName}</h1>
            {endingDescription && <p>{endingDescription}</p>}
            <p>Current: Panic messages + CRT effects completed</p>
            <p>Click to continue</p>
          </div>
        </div>
      )}
    </>
  );
};

export default RecursivePurgeCutscene;