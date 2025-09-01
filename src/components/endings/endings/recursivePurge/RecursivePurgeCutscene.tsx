/**
 * Recursive Purge Cutscene
 * 
 * Dramatic ending sequence for when the purge zone is dropped into itself.
 * Features screen shake, UI corruption, reality breach messages, and blackout.
 */

import React, { useEffect, useState } from 'react';
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
  const [phase, setPhase] = useState<'shake' | 'corruption' | 'breach' | 'blackout' | 'complete'>('shake');
  const [messageIndex, setMessageIndex] = useState(0);

  // Sequence of corruption messages
  const corruptionMessages = [
    "SYSTEM ERROR: INFINITE VOID DETECTED",
    "WARNING: PARADOX RESOLUTION FAILED", 
    "CRITICAL: REALITY BREACH IN SECTOR 7",
    "EMERGENCY: PHYSICS ENGINE OVERLOAD",
    "FATAL: UNIVERSE INTEGRITY COMPROMISED"
  ];

  const breachMessages = [
    "PURGE ZONE RECURSION DETECTED",
    "VOID COLLISION IMMINENT", 
    "PHYSICAL LAWS VIOLATED",
    "REALITY MATRIX UNSTABLE",
    "UNIVERSE COLLAPSE PROTOCOL INITIATED"
  ];

  // Handle the cutscene sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (phase) {
      case 'shake':
        // Screen shake phase - 2 seconds
        timer = setTimeout(() => setPhase('corruption'), 2000);
        break;
        
      case 'corruption':
        // UI corruption with cycling messages - 3 seconds
        const messageTimer = setInterval(() => {
          setMessageIndex(prev => (prev + 1) % corruptionMessages.length);
        }, 400);
        
        timer = setTimeout(() => {
          clearInterval(messageTimer);
          setMessageIndex(0);
          setPhase('breach');
        }, 3000);
        break;
        
      case 'breach':
        // Reality breach messages - 3 seconds
        const breachTimer = setInterval(() => {
          setMessageIndex(prev => (prev + 1) % breachMessages.length);
        }, 500);
        
        timer = setTimeout(() => {
          clearInterval(breachTimer);
          setPhase('blackout');
        }, 3000);
        break;
        
      case 'blackout':
        // Brief blackout before ending screen - 1 second
        timer = setTimeout(() => setPhase('complete'), 1000);
        break;
        
      case 'complete':
        // Stay on ending screen until click
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, corruptionMessages.length, breachMessages.length]);

  // Handle click to skip/continue
  const handleClick = () => {
    if (phase === 'complete') {
      onComplete();
    } else {
      // Allow skipping to end
      setPhase('complete');
    }
  };

  return (
    <div className={`recursive-purge-overlay ${phase}`} onClick={handleClick}>
      
      {/* Shake phase - game content visible with shake effect */}
      {phase === 'shake' && (
        <div className="shake-content">
          <div className="shake-warning">SYSTEM INSTABILITY DETECTED</div>
        </div>
      )}
      
      {/* Corruption phase - rapidly changing error messages */}
      {phase === 'corruption' && (
        <div className="corruption-content">
          <div className="corruption-message">
            {corruptionMessages[messageIndex]}
          </div>
          <div className="corruption-static"></div>
        </div>
      )}
      
      {/* Breach phase - reality breach warnings */}
      {phase === 'breach' && (
        <div className="breach-content">
          <div className="breach-message">
            {breachMessages[messageIndex]}
          </div>
          <div className="breach-warning">REALITY BREACH DETECTED</div>
        </div>
      )}
      
      {/* Blackout phase - pure black */}
      {phase === 'blackout' && (
        <div className="blackout-content"></div>
      )}
      
      {/* Complete phase - ending information */}
      {phase === 'complete' && (
        <div className="complete-content">
          <div className="complete-title">{endingName}</div>
          {endingDescription && (
            <div className="complete-description">{endingDescription}</div>
          )}
          <div className="complete-continue">Click to continue</div>
        </div>
      )}
    </div>
  );
};

export default RecursivePurgeCutscene;
