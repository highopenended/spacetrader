/**
 * Recursive Purge Cutscene
 * 
 * Dramatic ending sequence for when the purge zone is dropped into itself.
 * Clean slate - ready for step-by-step implementation.
 */

import React, { useState, useEffect } from 'react';
import PanicMessageOverlay from './effects/PanicMessageOverlay';
import './RecursivePurgeCutscene.css';

interface RecursivePurgeCutsceneProps {
  /** Called when the cutscene completes */
  onComplete: () => void;
  /** The ending that triggered this cutscene */
  endingName: string;
  /** Ending description */
  endingDescription?: string;
}

const RecursivePurgeCutscene: React.FC<RecursivePurgeCutsceneProps> = ({ 
  onComplete, 
  endingName, 
  endingDescription
}) => {
  const [panicActive, setPanicActive] = useState(false);
  const [panicIntensity, setPanicIntensity] = useState<'low' | 'medium' | 'high' | 'extreme'>('low');
  const [showEndingScreen, setShowEndingScreen] = useState(false);

  // Start panic messages and gradually increase intensity
  useEffect(() => {
    // Start with panic messages immediately
    setPanicActive(true);
    
    // Gradually escalate intensity
    const escalationTimers = [
      setTimeout(() => setPanicIntensity('medium'), 2800),   // 2.8s
      setTimeout(() => setPanicIntensity('high'), 5600),     // 5.6s  
      setTimeout(() => setPanicIntensity('extreme'), 8400),  // 8.4s
      setTimeout(() => {
        setPanicActive(false);
        setShowEndingScreen(true);
      }, 11200) // 11.2s - end panic and show ending
    ];

    return () => {
      escalationTimers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Handle click to continue (only when ending screen is showing)
  const handleClick = () => {
    if (showEndingScreen) {
      onComplete();
    }
  };

  return (
    <>
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
            <p>Current: Panic messages completed</p>
            <p>Click to continue</p>
          </div>
        </div>
      )}
    </>
  );
};

export default RecursivePurgeCutscene;