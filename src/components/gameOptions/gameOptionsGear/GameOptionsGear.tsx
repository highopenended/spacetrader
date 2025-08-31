/**
 * GameOptionsGear Component
 * 
 * Displays a clickable gear icon in the top-left corner for accessing game options.
 * Positioned above the DataReadout component.
 */

import React from 'react';
import './GameOptionsGear.css';

interface GameOptionsGearProps {
  onClick: () => void;
}

const GameOptionsGear: React.FC<GameOptionsGearProps> = ({ onClick }) => {
  return (
    <div className="game-options-gear" onClick={onClick}>
      <div className="gear-icon">⚙</div>
    </div>
  );
};

export default GameOptionsGear;
