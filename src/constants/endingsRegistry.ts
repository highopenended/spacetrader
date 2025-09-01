/**
 * Endings Registry
 * 
 * Master registry of all possible game endings.
 * Currently only implements the default ending, with placeholders for others.
 */

import { EndingDefinition } from '../types/endingState';

/**
 * Master registry of all game endings
 * Add new endings here with their complete definitions
 */
export const ENDINGS_REGISTRY: Record<string, EndingDefinition> = {
  
  // Default ending - fallback for all placeholder endings
  defaultEnding: {
    id: 'defaultEnding',
    name: 'Game Over',
    description: 'The end of your journey in the scrap trade.',
    checkTrigger: () => true, // Always triggers when called
    cutsceneComponent: 'DefaultEnding'
  },

  // Placeholder endings - all use default cutscene for now
  recursivePurge: {
    id: 'recursivePurge',
    name: 'Recursive Purge',
    description: 'You dropped the Purge Zone into itself, creating an infinite void collision that violates the fundamental laws of physics.',
    checkTrigger: () => true, // Placeholder - always triggers when called
    cutsceneComponent: 'DefaultEnding'
  },

  economicSingularity: {
    id: 'economicSingularity',
    name: 'Economic Singularity', 
    description: 'Your credits have reached astronomical levels, causing a galactic economic collapse.',
    checkTrigger: () => true, // Placeholder - always triggers when called
    cutsceneComponent: 'DefaultEnding'
  },

  timeParadox: {
    id: 'timeParadox',
    name: 'Temporal Anomaly',
    description: 'Your manipulation of time tracking systems has created a temporal paradox.',
    checkTrigger: () => true, // Placeholder - always triggers when called
    cutsceneComponent: 'DefaultEnding'
  },

  perfectAscension: {
    id: 'perfectAscension',
    name: 'Perfect Ascension',
    description: 'You have achieved the highest rank possible and transcended mortal concerns.',
    checkTrigger: () => true, // Placeholder - always triggers when called
    cutsceneComponent: 'DefaultEnding'
  }
};

/**
 * Get ending by ID
 */
export const getEndingById = (id: string): EndingDefinition | undefined => {
  return ENDINGS_REGISTRY[id];
};
