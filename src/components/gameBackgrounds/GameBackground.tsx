/**
 * GameBackground Component
 * 
 * Main background wrapper component that renders different background themes
 * based on the current game state. Also renders letterbox bars (black bars) when
 * the viewport aspect ratio doesn't match the game world aspect ratio.
 */

import React, { useMemo } from 'react';
import { GameBackgroundRegistry, BackgroundId } from '../../constants/gameBackgroundRegistry';
import { calculateLetterbox } from '../../constants/cameraConstants';
import { useViewportStore } from '../../stores';
import './GameBackground.css';

interface GameBackgroundProps {
  backgroundId: BackgroundId;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ backgroundId }) => {
  const viewport = useViewportStore(state => state.viewport);
  const BackgroundComponent = GameBackgroundRegistry[backgroundId];
  
  // Calculate letterbox bars from centralized viewport store
  const letterbox = useMemo(() => {
    return calculateLetterbox(viewport.width, viewport.height);
  }, [viewport.width, viewport.height]);
  
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