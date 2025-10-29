/**
 * GameBackground Component
 * 
 * Main background wrapper component that renders different background themes
 * based on the current game state. Also renders letterbox bars (black bars) when
 * the viewport aspect ratio doesn't match the game world aspect ratio.
 */

import React, { useState, useEffect } from 'react';
import { GameBackgroundRegistry, BackgroundId } from '../../constants/gameBackgroundRegistry';
import { calculateLetterbox } from '../../constants/cameraConstants';
import './GameBackground.css';

interface GameBackgroundProps {
  backgroundId: BackgroundId;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ backgroundId }) => {
  const [letterbox, setLetterbox] = useState(calculateLetterbox(window.innerWidth, window.innerHeight));
  const BackgroundComponent = GameBackgroundRegistry[backgroundId];
  
  // Update letterbox bars on window resize
  useEffect(() => {
    const handleResize = () => {
      setLetterbox(calculateLetterbox(window.innerWidth, window.innerHeight));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!BackgroundComponent) {
    // Fallback to default background if component not found
    return (
      <>
        <div className="game-background default-background" />
        {/* Render letterbox bars */}
        {letterbox.top > 0 && (
          <div className="letterbox-bar letterbox-bar--top" style={{ height: `${letterbox.top}px` }} />
        )}
        {letterbox.bottom > 0 && (
          <div className="letterbox-bar letterbox-bar--bottom" style={{ height: `${letterbox.bottom}px` }} />
        )}
        {letterbox.left > 0 && (
          <div className="letterbox-bar letterbox-bar--left" style={{ width: `${letterbox.left}px` }} />
        )}
        {letterbox.right > 0 && (
          <div className="letterbox-bar letterbox-bar--right" style={{ width: `${letterbox.right}px` }} />
        )}
      </>
    );
  }
  
  return (
    <>
      <div className="game-background">
        <BackgroundComponent />
      </div>
      {/* Render letterbox bars */}
      {letterbox.top > 0 && (
        <div className="letterbox-bar letterbox-bar--top" style={{ height: `${letterbox.top}px` }} />
      )}
      {letterbox.bottom > 0 && (
        <div className="letterbox-bar letterbox-bar--bottom" style={{ height: `${letterbox.bottom}px` }} />
      )}
      {letterbox.left > 0 && (
        <div className="letterbox-bar letterbox-bar--left" style={{ width: `${letterbox.left}px` }} />
      )}
      {letterbox.right > 0 && (
        <div className="letterbox-bar letterbox-bar--right" style={{ width: `${letterbox.right}px` }} />
      )}
    </>
  );
};

export default GameBackground; 