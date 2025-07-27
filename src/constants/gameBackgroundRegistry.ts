/**
 * Game Background Registry
 * 
 * Central registry of all background components available in the game.
 * Each background defines a visual theme for different game states or locations.
 */

import React from 'react';
import SpaceDock from '../components/gameBackgrounds/spaceDock/SpaceDock';

export type BackgroundComponent = React.FC;

export const GameBackgroundRegistry: Record<string, BackgroundComponent> = {
  spaceDock: SpaceDock,
} as const;

export type BackgroundId = keyof typeof GameBackgroundRegistry; 