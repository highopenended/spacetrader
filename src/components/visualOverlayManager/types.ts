/**
 * Visual Overlay Manager Types
 * 
 * Shared type definitions for visual overlay components.
 * Centralizes common types to avoid duplication across files.
 */

export type AnimationState = 'idle' | 'booting' | 'shutting-down';

export interface VisualOverlayProps {
  isExiting?: boolean;
  animationState: AnimationState;
}

// Animation timing constants
export const ANIMATION_DURATIONS = {
  BOOT_SEQUENCE: 2600,
  SHUTDOWN_SEQUENCE: 800,
  LABEL_INTRO: 800,
} as const;
