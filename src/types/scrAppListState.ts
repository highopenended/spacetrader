/**
 * SCR App List State Types
 * 
 * Type definitions for the drag-and-drop app list management system.
 * Used with dnd-kit for sortable app functionality.
 */

import React from 'react';

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

export type AppType = 'credits' | 'jobTitle' | 'age' | 'date' | 'purgeZone' | 'scrAppStore' | 'scanner' | 'navMap' | 'chronoTrack';

export interface AppOrderUpdateData {
  appId: string;
  oldOrder: number;
  newOrder: number;
  timestamp: number;
} 