/**
 * SCR App List State Types
 * 
 * Type definitions for the drag-and-drop app list management system.
 * Used with dnd-kit for sortable app functionality.
 */

import React from 'react';
import { ToggleStates } from './toggleState';

export interface AppTier {
  tier: number;
  flatUpgradeCost: number;
  flatDowngradeCost: number;
  monthlyCost: number;
  information: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  deletable: boolean;
  description: string;
  unlockRequirements?: string[]; // Future: requirements to unlock this app
  tiers: AppTier[]; // Array of upgrade tiers with costs
  defaultToggles?: Record<string, boolean>; // Default toggle states when app is installed
  // Quick key metadata (optional)
  shortcutKey?: string; // Display letter for quick keycap
  showInQuickBar?: boolean; // Whether to render in the bottom quick keys bar
  quickKeyLabel?: string; // Optional label under the keycap; falls back to name
  quickToggleStateKey?: keyof ToggleStates; // Toggle state key to control enable/disable from quick bar and keyboard
}

export interface InstalledApp {
  id: string;
  order: number;
  purchased: boolean;
  installedAt: number; // timestamp
  currentTier: number; // NEW: Current upgrade tier (1-4)
}

export interface DragState {
  isDragging: boolean;
  draggedAppId: string | null;
}

export interface AppListState {
  installedApps: InstalledApp[];
  dragState: DragState;
}

export type AppType = 'credits' | 'jobTitle' | 'purgeZone' | 'scrAppStore' | 'scanner' | 'navMap' | 'chronoTrack' | 'cacheSync' | 'dumpsterVision';

export interface AppOrderUpdateData {
  appId: string;
  oldOrder: number;
  newOrder: number;
  timestamp: number;
} 