/**
 * GameOptionsGear Component
 * 
 * Displays a clickable gear icon in the top-left corner for accessing game options.
 * Positioned above the DataReadout component.
 */

import React from 'react';
import { useUIStore } from '../../../stores';
import './GameOptionsGear.css';

const GameOptionsGear: React.FC = () => {
  const showOptionsMenu = useUIStore(state => state.showOptionsMenu);
  return (
    <div className="game-options-gear" onClick={showOptionsMenu}>
      <div className="gear-icon">⚙</div>
    </div>
  );
};

export default GameOptionsGear;
