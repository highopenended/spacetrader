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
      return {}; // Barebones version doesn't need props yet
    default:
      return {};
  }
}; 