/**
 * Unified Drag Hook
 * 
 * Centralized drag-and-drop management that consolidates:
 * - App list drag (reordering/deletion)
 * - Window drag (positioning/deletion)
 * - Collision detection
 * - State management
 * 
 * This replaces the fragmented drag system with a single source of truth.
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { DOM_IDS } from '../constants/domIds';
import { useSensor, PointerSensor } from '@dnd-kit/core';
import { rectIntersection } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useUIStore, useDragStore } from '../stores';

// ===== TYPES =====

interface UnifiedDragDependencies {
  installedApps: any[];
  apps: any[];
  appOrder: string[];
  onAppsReorder: (apps: any[]) => void;
  onAppUninstall: (appId: string) => void;
  closeWindowsByAppType: (appType: string) => void;
  installAppOrder: (order: string[]) => void;
  openOrCloseWindow: (appType: string, title: string, content?: React.ReactNode, dropPosition?: { x: number; y: number }) => void;
}

// ===== MAIN HOOK =====

export const useUnifiedDrag = (dependencies: UnifiedDragDependencies) => {
  const {
    installedApps,
    apps,
    appOrder,
    onAppsReorder,
    onAppUninstall,
    closeWindowsByAppType,
    installAppOrder
  } = dependencies;

  const showPopup = useUIStore(state => state.showPopup);

  // ===== DRAG STORE =====
  const dragState = useDragStore(state => state.dragState);
  const overId_cursor = useDragStore(state => state.overId_cursor);
  const isOverTerminalDropZone = useDragStore(state => state.isOverTerminalDropZone);
  const pendingDelete = useDragStore(state => state.pendingDelete);
  
  // Drag store actions
  const startDrag = useDragStore(state => state.startDrag);
  const endDrag = useDragStore(state => state.endDrag);
  const updateCollision = useDragStore(state => state.updateCollision);
  const setPendingDelete = useDragStore(state => state.setPendingDelete);
  const clearPendingDelete = useDragStore(state => state.clearPendingDelete);

  const pendingDeleteRef = useRef<{ appId: string | null; prevOrder: string[] }>({ appId: null, prevOrder: [] });
  
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // ===== SENSORS =====
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  
  const sensors = useMemo(() => [pointerSensor], [pointerSensor]);

  // ===== COLLISION DETECTION =====
  const customCollisionDetection = useCallback((args: any) => {
    const collisions = rectIntersection(args);
    
    // Block PurgeZone window from detecting its own window purge zone (but allow work mode purge zone)
    if (args.active?.data?.current?.type === 'window-drag-node' && 
        args.active?.data?.current?.appType === 'purgeZone') {
      const filteredCollisions = collisions.filter(c => 
        c.id !== DOM_IDS.PURGE_ZONE_WINDOW
      );
      const terminalDock = filteredCollisions.find(c => c.id === DOM_IDS.TERMINAL_DOCK);
      if (terminalDock) return [terminalDock];
      return filteredCollisions;
    }
    
    // Window drag priority
    if (args.active?.data?.current?.type === 'window-drag-node') {
      const purgeZone = collisions.find(c => 
        c.id === DOM_IDS.PURGE_ZONE_WINDOW || c.id === DOM_IDS.PURGE_ZONE_WORKMODE
      );
      const terminalDock = collisions.find(c => c.id === DOM_IDS.TERMINAL_DOCK);
      
      if (purgeZone) return [purgeZone];
      if (terminalDock) return [terminalDock];
      return collisions;
    }
    
    // App list drag - allow all collisions
    return collisions;
  }, []);

  // ===== DRAG HANDLERS =====
  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    
    if (active.data?.current?.type === 'window-drag-node') {
      // Window drag
      const { windowTitle, appType } = active.data.current;
      startDrag('window', {
        appType,
        windowTitle
      });
    } else {
      // App drag
      startDrag('app', {
        appId: active.id
      });
    }
  }, [startDrag]);

  const handleDragOver = useCallback((event: any) => {
    const newOverId_cursor = event.over?.id ?? null;
    const isOverTerminal = (newOverId_cursor === DOM_IDS.TERMINAL_DOCK || 
                          (newOverId_cursor && event.active?.data?.current?.type === 'app-drag-node')) &&
                          newOverId_cursor !== DOM_IDS.PURGE_ZONE_WINDOW && 
                          newOverId_cursor !== DOM_IDS.PURGE_ZONE_WORKMODE;
    
    updateCollision(newOverId_cursor, isOverTerminal);
  }, [updateCollision]);

  // ===== MEMOIZED HELPER FUNCTIONS =====
  const handleAppReorder = useCallback((activeId: string, overId_cursor: string | null) => {
    if (!overId_cursor) return;
    
    const activeIndex = appOrder.indexOf(activeId);
    const overIndex = appOrder.indexOf(overId_cursor);
    
    if (activeIndex !== overIndex) {
      const reordered = arrayMove(installedApps, activeIndex, overIndex);
      const reorderedWithNewOrder = reordered.map((app, index) => ({
        ...app,
        order: index + 1
      }));
      onAppsReorder(reorderedWithNewOrder);
    }
  }, [appOrder, installedApps, onAppsReorder]);

  const handleConfirmPurge = useCallback(() => {
    const currentPendingDelete = pendingDeleteRef.current;
    if (currentPendingDelete.appId) {
      closeWindowsByAppType(currentPendingDelete.appId);
      onAppUninstall(currentPendingDelete.appId);
    }
    clearPendingDelete();
  }, [closeWindowsByAppType, onAppUninstall, clearPendingDelete]);

  const handleCancelPurge = useCallback(() => {
    const currentPendingDelete = pendingDeleteRef.current;
    if (currentPendingDelete.prevOrder.length) {
      installAppOrder(currentPendingDelete.prevOrder);
    }
    clearPendingDelete();
  }, [installAppOrder, clearPendingDelete]);

  const handlePurgeDrop = useCallback((active: any, over: any) => {
    if (active.data?.current?.type === 'window-drag-node') {
      const { appType, deletable, windowTitle } = active.data.current;
      
      if (deletable) {
        setPendingDelete(appType, appOrder);
        showPopup({
          title: 'PURGE APP?',
          message: `Are you sure you want to permanently purge ${windowTitle}?`,
          confirmText: 'PURGE',
          cancelText: 'ABORT',
          type: 'alert',
          onConfirm: handleConfirmPurge,
          onCancel: handleCancelPurge
        });
      }
    } else {
      
      // App list item deletion
      const appDefinition = apps.find((app: any) => app.id === active.id);
      if (appDefinition && appDefinition.deletable) {
        setPendingDelete(active.id, appOrder);
        showPopup({
          title: 'PURGE APP?',
          message: `Are you sure you want to permanently purge ${appDefinition.name}?`,
          confirmText: 'PURGE',
          cancelText: 'ABORT',
          type: 'alert',
          onConfirm: handleConfirmPurge,
          onCancel: handleCancelPurge
        });
      }
    }
  }, [apps, appOrder, showPopup, handleConfirmPurge, handleCancelPurge, setPendingDelete]);

  const handleTerminalDrop = useCallback((active: any) => {
    if (active.data?.current?.type === 'window-drag-node') {
      const { appType } = active.data.current;
      closeWindowsByAppType(appType);
    }
  }, [closeWindowsByAppType]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    // Reset state
    endDrag();
    
    if (!over) {
      // Handle reordering for app drags
      if (active.data?.current?.type === 'app-drag-node') {
        handleAppReorder(active.id, null);
      }
      return;
    }
    

    // Handle drop targets
    if (over.id === DOM_IDS.PURGE_ZONE_WINDOW || over.id === DOM_IDS.PURGE_ZONE_WORKMODE) {
      handlePurgeDrop(active, over);
    } else if (over.id === DOM_IDS.TERMINAL_DOCK) {
      handleTerminalDrop(active);

    } else if (active.data?.current?.type === 'app-drag-node') {
      handleAppReorder(active.id, over.id);
    }
  }, [handleAppReorder, handlePurgeDrop, handleTerminalDrop, endDrag]);

  // ===== RETURN VALUES =====
  return {
    // State
    dragState,
    overId_cursor,
    isOverTerminalDropZone,
    pendingDelete,
    
    // Configuration
    sensors,
    customCollisionDetection,
    
    // Handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleConfirmPurge,
    handleCancelPurge
  };
}; 