/**
 * Ending State Types
 * 
 * Defines the structure for the game endings system.
 * Currently supports the recursive purge ending.
 */

/**
 * Ending definition interface
 * Defines metadata and behavior for each possible ending
 */
export interface EndingDefinition {
  /** Unique identifier for the ending */
  id: string;
  /** Display name of the ending */
  name: string;
  /** Detailed description of the ending */
  description: string;
  /** Custom trigger function that determines if this ending should activate */
  checkTrigger: (triggerData: EndingTriggerData) => boolean;
  /** Component name for the cutscene */
  cutsceneComponent: string;
}

/**
 * Active ending state
 * Represents an ending that is currently being displayed
 */
export interface ActiveEnding {
  /** The ending that is active */
  ending: EndingDefinition;
  /** Timestamp when the ending was triggered */
  triggeredAt: number;
}

/**
 * Ending state interface
 * Manages the current state of the endings system
 */
export interface EndingState {
  /** Currently active ending (null if none) */
  activeEnding: ActiveEnding | null;
}

/**
 * Data passed when checking for ending triggers
 * Currently only supports app purge events for recursive purge ending
 */
export interface EndingTriggerData {
  /** The event type that triggered the check */
  event: 'app-purged';
  /** The app that was purged */
  appId: string;
  /** Whether the purge happened in work mode purge zone */
  isWorkModePurge: boolean;
  /** Function to check if an upgrade is purchased */
  isUpgradePurchased: (upgradeId: string) => boolean;
  /** List of currently installed apps */
  installedApps: string[];
}
