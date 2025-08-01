/**
 * Toggle State Type Definitions
 * 
 * Contains types for UI toggle state management.
 * Separate from game state as toggles are UI concerns.
 */

export interface ToggleStates {
  dateReadoutEnabled: boolean;
  jobTitleReadoutEnabled: boolean;
  workButtonReadoutEnabled: boolean;
  creditsReadoutEnabled: boolean;
  // Future toggles can be added here
} 