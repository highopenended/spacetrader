/**
 * SCR App List State Types
 * 
 * Type definitions for the drag-and-drop app list management system.
 * Used with dnd-kit for sortable app functionality.
 */

import React from 'react';

export interface AppDefinition {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  deletable: boolean;
  description: string;
  unlockRequirements?: string[]; // Future: requirements to unlock this app
  purchaseCost: number; // One-time purchase cost
  maintenanceCost: number; // Recurring cost per ledger cycle
  defaultToggles?: Record<string, boolean>; // Default toggle states when app is installed
}

export interface InstalledApp {
  id: string;
  order: number;
  purchased: boolean;
  installedAt: number; // timestamp
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