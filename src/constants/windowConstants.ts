/**
 * Window Management Constants
 * 
 * Default values and configuration for the window management system.
 * Used by window manager hook and components.
 */

export const WINDOW_DEFAULTS = {
  SIZE: { width: 250, height: 120 },
  MIN_SIZE: { width: 200, height: 100 },
  POSITION: { x: 100, y: 100 },
  POSITION_OFFSET: 30,
};

// App-specific default window sizes
export const APP_WINDOW_DEFAULTS: Record<string, { width: number; height: number }> = {
  scrAppStore: { width: 600, height: 400 },
  purgeZone: { width: 300, height: 200 },
  jobTitle: { width: 300, height: 150 },
  credits: { width: 300, height: 150 },
  cacheSync: { width: 400, height: 400 },
  age: WINDOW_DEFAULTS.SIZE, // Use global default
  chronoTrack: WINDOW_DEFAULTS.SIZE, // Use global default
}; 