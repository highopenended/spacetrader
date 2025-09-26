/**
 * Game Background Registry
 * 
 * Central registry of all background components available in the game.
 * Each background defines a visual theme for different game states or locations.
 */

import React from 'react';

export type BackgroundComponent = React.FC;

export const GameBackgroundRegistry: Record<string, BackgroundComponent> = {
  // No backgrounds currently registered
} as const;

export type BackgroundId = keyof typeof GameBackgroundRegistry; 