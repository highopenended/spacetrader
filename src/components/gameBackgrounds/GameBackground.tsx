/**
 * GameBackground Component
 * 
 * Main background wrapper component that renders different background themes
 * based on the current game state. This component is purely visual and has no interactivity.
 */

import React from 'react';
import { GameBackgroundRegistry, BackgroundId } from '../../constants/gameBackgroundRegistry';
import './GameBackground.css';

interface GameBackgroundProps {
  backgroundId: BackgroundId;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ backgroundId }) => {
  const BackgroundComponent = GameBackgroundRegistry[backgroundId];
  
  if (!BackgroundComponent) {
    // Fallback to default background if component not found
    return <div className="game-background default-background" />;
  }
  
  return (
    <div className="game-background">
      <BackgroundComponent />
    </div>
  );
};

export default GameBackground; 