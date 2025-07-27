/**
 * Game Background Registry
 * 
 * Central registry of all background components available in the game.
 * Each background defines a visual theme for different game states or locations.
 */

import React from 'react';

export type BackgroundComponent = React.FC;

export const GameBackgroundRegistry: Record<string, BackgroundComponent> = {
  // Placeholder for now - will be populated when background components are created
  // spaceDock: SpaceDockBackground,
  // nebulaStorm: NebulaStormBackground,
} as const;

export type BackgroundId = keyof typeof GameBackgroundRegistry; 