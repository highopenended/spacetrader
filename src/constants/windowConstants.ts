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
  purgeZone: { width: 150, height: 150   },
  jobTitle: { width: 300, height: 180 },
  credits: { width: 300, height: 150 },
  cacheSync: { width: 350, height: 350 },
  chronoTrack: { width: 350, height: 200 },
  dumpsterVision: { width: 250, height: 300 }
};

// App-specific minimum window sizes
export const APP_WINDOW_MIN_SIZES: Record<string, { width: number; height: number }> = {
  scrAppStore: { width: 600, height: 400 },
  purgeZone: { width: 150, height: 150 },
  jobTitle: { width: 250, height: 180 },
  credits: { width: 300, height: 150 },
  cacheSync: { width: 350, height: 350 },
  chronoTrack: { width: 350, height: 200 },
  dumpsterVision: { width: 200, height: 200 }
}; 