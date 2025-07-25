/**
 * App List Drag Handler Hook
 * 
 * Handles drag-and-drop interactions for app list items in the terminal.
 * Manages app reordering and deletion via PurgeZone.
 * Separates UI interaction logic from game state logic.
 */

import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { APP_REGISTRY } from '../constants/scrAppListConstants';
import { InstalledApp, DragState } from '../types/scrAppListState';

interface UseAppDragHandlerProps {
  installedApps: InstalledApp[];
  dragState: DragState;
  onDragStateChange: (dragState: DragState) => void;
  onAppsReorder: (apps: InstalledApp[]) => void;
  onAppUninstall: (appId: string) => void;
}

export const useDragHandler_Apps = ({
  installedApps,
  dragState,
  onDragStateChange,
  onAppsReorder,
  onAppUninstall
}: UseAppDragHandlerProps) => {
  
  const handleDragStart = useCallback((event: any) => {
    onDragStateChange({
      isDragging: true,
      draggedAppId: event.active.id
    });
  }, [onDragStateChange]);

  const handleDragOver = useCallback((event: any) => {
    // Only track purge zone window for deletion effects
    // No global delete zone tracking needed
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    // Reset drag state
    onDragStateChange({
      isDragging: false,
      draggedAppId: null
    });

    if (!over) return;

    // Handle deletion
    if (over.id === 'purge-zone-window') {
      const appDefinition = APP_REGISTRY[active.id];
      if (appDefinition && appDefinition.deletable) {
        onAppUninstall(active.id);
        return;
      }
    }

    // Handle reordering
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
  }, [installedApps, onDragStateChange, onAppUninstall, onAppsReorder]);

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
}; 