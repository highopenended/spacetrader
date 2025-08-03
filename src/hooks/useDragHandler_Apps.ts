/**
 * App List Drag Handler Hook
 * 
 * Handles drag-and-drop interactions for app list items in the terminal.
 * Manages app reordering and deletion via PurgeZone.
 * Separates UI interaction logic from game state logic.
 */

import { useCallback, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { InstalledApp, DragState } from '../types/scrAppListState';

interface UseDragHandler_AppsProps {
  installedApps: InstalledApp[];
  onAppsReorder: (apps: InstalledApp[]) => void;
  onAppUninstall: (appId: string) => void;
}

export const useDragHandler_Apps = ({
  installedApps,
  onAppsReorder,
  onAppUninstall
}: UseDragHandler_AppsProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppId: null
  });
  
  const handleDragStart = useCallback((event: any) => {
    setDragState({
      isDragging: true,
      draggedAppId: event.active.id
    });
  }, []);

  const handleDragOver = useCallback((event: any) => {
    // Only track purge zone window for deletion effects
    // No global delete zone tracking needed
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedAppId: null
    });

    if (!over) return;

    // Handle reordering only - deletion is handled by the router
    const appOrder = installedApps
      .sort((a, b) => a.order - b.order)
      .map(app => app.id);
    
    const activeIndex = appOrder.indexOf(active.id);
    const overIndex = appOrder.indexOf(over.id);

    if (activeIndex !== overIndex) {
      const reordered = arrayMove(installedApps, activeIndex, overIndex);
      const reorderedWithNewOrder = reordered.map((app, index) => ({
        ...app,
        order: index + 1
      }));
      onAppsReorder(reorderedWithNewOrder);
    }
  }, [installedApps, onAppsReorder]);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
}; 