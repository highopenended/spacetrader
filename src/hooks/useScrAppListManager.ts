/**
 * SCR App List Manager Hook
 * 
 * Custom hook that manages app ordering, drag state, and reordering logic.
 * Integrates with dnd-kit for drag-and-drop functionality.
 */

import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULT_INSTALLED_APPS, APP_REGISTRY } from '../constants/scrAppListConstants';
import { AppDefinition, InstalledApp, DragState, AppType } from '../types/scrAppListState';

export const useScrAppListManager = () => {
  // Initialize with default installed apps
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(
    DEFAULT_INSTALLED_APPS.map((appId, index) => ({
      id: appId,
      order: index + 1,
      purchased: true, // Default apps are "purchased"
      installedAt: Date.now()
    }))
  );
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppId: null
  });

  // Get app order for dnd-kit
  const appOrder = installedApps
    .sort((a, b) => a.order - b.order)
    .map(app => app.id);

  // Convert installed apps to full app definitions
  const apps: (AppDefinition & InstalledApp)[] = installedApps
    .sort((a, b) => a.order - b.order)
    .map(installedApp => ({
      ...APP_REGISTRY[installedApp.id],
      ...installedApp
    }));

  // Handle drag start
  const handleDragStart = useCallback((event: any) => {
    setDragState({
      isDragging: true,
      draggedAppId: event.active.id
    });
  }, []);

  // Handle drag over (for deletion zone detection)
  const handleDragOver = useCallback((event: any) => {
    // Only track purge zone window for deletion effects
    // No global delete zone tracking needed
  }, []);

  // Handle drag end - reorder or delete
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedAppId: null
    });

    if (!over) return;

    // Handle deletion
    if (over.id === 'purge-zone-window') {
      const appDefinition = APP_REGISTRY[active.id];
      if (appDefinition && appDefinition.deletable) {
        setInstalledApps(prev => {
          const filtered = prev.filter(app => app.id !== active.id);
          // Reorder remaining apps
          return filtered.map((app, index) => ({
            ...app,
            order: index + 1
          }));
        });
        return;
      }
    }

    // Handle reordering
    const activeIndex = appOrder.indexOf(active.id);
    const overIndex = appOrder.indexOf(over.id);

    if (activeIndex !== overIndex) {
      setInstalledApps(prev => {
        const reordered = arrayMove(prev, activeIndex, overIndex);
        // Update order numbers
        return reordered.map((app, index) => ({
          ...app,
          order: index + 1
        }));
      });
    }
  }, [appOrder]);

  // Install app (future: will check if purchased)
  const installApp = useCallback((appId: string, position?: number) => {
    if (installedApps.some(app => app.id === appId)) return; // Already installed
    if (!APP_REGISTRY[appId]) return; // App doesn't exist

    const newApp: InstalledApp = {
      id: appId,
      order: position ?? installedApps.length + 1,
      purchased: true, // For now, assume all apps are purchased
      installedAt: Date.now()
    };

    setInstalledApps(prev => {
      if (position !== undefined) {
        // Insert at specific position and reorder
        const newList = [...prev, newApp].sort((a, b) => a.order - b.order);
        return newList.map((app, index) => ({
          ...app,
          order: index + 1
        }));
      } else {
        return [...prev, newApp];
      }
    });
  }, [installedApps]);

  // Uninstall app
  const uninstallApp = useCallback((appId: string) => {
    const appDefinition = APP_REGISTRY[appId];
    if (!appDefinition || !appDefinition.deletable) return;
    
    setInstalledApps(prev => {
      const filtered = prev.filter(app => app.id !== appId);
      // Reorder remaining apps
      return filtered.map((app, index) => ({
        ...app,
        order: index + 1
      }));
    });
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setInstalledApps(
      DEFAULT_INSTALLED_APPS.map((appId, index) => ({
        id: appId,
        order: index + 1,
        purchased: true,
        installedAt: Date.now()
      }))
    );
  }, []);

  // Get apps available for installation (purchased but not installed)
  const getAvailableApps = useCallback((): AppDefinition[] => {
    const installedIds = installedApps.map(app => app.id);
    return Object.values(APP_REGISTRY).filter(
      app => !installedIds.includes(app.id)
    );
  }, [installedApps]);

  return {
    apps,
    appOrder,
    installedApps,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    installApp,
    uninstallApp,
    resetToDefaults,
    getAvailableApps
  };
}; 