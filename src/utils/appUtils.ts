/**
 * App Utility Functions
 * 
 * This file contains pure utility functions for accessing and formatting
 * app-related data from the APP_REGISTRY. These are stateless helper functions
 * that provide consistent access patterns for app information.
 * 
 * Function Categories:
 * 
 * 1. App Name Functions:
 *    - getAppName_fromID(): Get app name from app ID
 *    - getAppDisplayName_fromID(): Get formatted app name for display
 * 
 * Key Logic:
 * - App names are static data from APP_REGISTRY
 * - Fallback to 'App' if app ID not found
 * - Display names are uppercase for consistency
 * 
 * Used by:
 * - Components that need to display app names
 * - Upgrade overlays and progress indicators
 * - App store listings and drag operations
 * 
 * Dependencies: appListConstants.ts (APP_REGISTRY)
 */

import { APP_REGISTRY } from '../constants/appListConstants';

export const getAppName_fromID = (appId: string): string => {
  return APP_REGISTRY[appId]?.name || 'App';
};

export const getAppDisplayName_fromID = (appId: string): string => {
  return getAppName_fromID(appId).toUpperCase();
};
