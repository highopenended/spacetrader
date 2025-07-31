/**
 * App Props Builder Utility
 * 
 * Centralized utility for building props for app components.
 * Eliminates duplicate prop building logic across App.tsx and TerminalScreen.tsx.
 */

import { GamePhase, GameTime } from '../types/gameState';

interface AppPropsBuilderOptions {
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
}

/**
 * Build props for an app component based on its ID
 * @param appId - The app identifier
 * @param gameState - Current game state values
 * @returns Props object for the app component
 */
export const getAppProps = (appId: string, gameState: AppPropsBuilderOptions) => {
  const { credits, gameTime, gamePhase } = gameState;

  switch (appId) {
    case 'credits':
      return { credits };
    case 'jobTitle':
      return { gamePhase };
    case 'age':
      return { gameTime };
    case 'date':
      return { gameTime, gamePhase };
    case 'scrAppStore':
      return { hasNewApps: true }; // TODO: Make this dynamic when implementing app store
    case 'purgeZone':
      return {}; // Purge zone doesn't need any props
    case 'chronoTrack':
      return { gameTime, gamePhase }; // Tier 1 needs date and age info
    case 'cacheSync':
      return {}; // Cache sync doesn't need any props for now
    default:
      return {};
  }
};

/**
 * Build props map for all apps
 * @param apps - Array of app configurations
 * @param gameState - Current game state values
 * @returns Map of app IDs to their props objects
 */
export const getAppPropsMap = (apps: any[], gameState: AppPropsBuilderOptions) => {
  return apps.reduce((map, app) => {
    map[app.id] = getAppProps(app.id, gameState);
    return map;
  }, {} as Record<string, any>);
}; 