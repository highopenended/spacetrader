/**
 * Toggle State Type Definitions
 * 
 * Contains types for UI toggle state management.
 * Separate from game state as toggles are UI concerns.
 */

export interface ToggleStates {
  readoutEnabled_Date: boolean;
  readoutEnabled_JobTitle: boolean;
  readoutEnabled_WorkButton: boolean;
  readoutEnabled_Credits: boolean;
  keyEnabled_DumpsterVision: boolean;
  // Future toggles can be added here
} 