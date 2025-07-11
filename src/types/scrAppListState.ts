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
  title: string;
  component: React.ComponentType<any>;
  category: 'core' | 'utility' | 'trading' | 'navigation' | 'security' | 'entertainment';
  cost: number;
  deletable: boolean;
  description: string;
  unlockRequirements?: string[]; // Future: requirements to unlock this app
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

export type AppType = 'credits' | 'jobTitle' | 'age' | 'date' | 'purgeZone' | 'scrAppStore';

export interface AppOrderUpdateData {
  appId: string;
  oldOrder: number;
  newOrder: number;
  timestamp: number;
} 