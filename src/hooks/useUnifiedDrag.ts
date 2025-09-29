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

// ===== UTILITY FUNCTIONS =====

// Throttle function for mouse tracking
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

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
  const updateMousePosition = useDragStore(state => state.updateMousePosition);
  const endDrag = useDragStore(state => state.endDrag);
  const updateCollision = useDragStore(state => state.updateCollision);
  const setPendingDelete = useDragStore(state => state.setPendingDelete);
  const clearPendingDelete = useDragStore(state => state.clearPendingDelete);

  const pendingDeleteRef = useRef<{ appId: string | null; prevOrder: string[] }>({ appId: null, prevOrder: [] });
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  
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

  // ===== OPTIMIZED MOUSE TRACKING =====
  const createMouseMoveHandler = useCallback((type: 'window' | 'app') => {
    return throttle((e: MouseEvent) => {
      // Track mouse position for both window and app drags
      updateMousePosition({ x: e.clientX, y: e.clientY });
    }, 16); // ~60fps throttling
  }, [updateMousePosition]);

  // ===== DRAG HANDLERS =====
  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    
    // CRITICAL: Get initial mouse position from the drag start event
    // This MUST be set immediately for collision detection to work correctly.
    // DO NOT remove this or collision detection will break for window drags!
    // The red drag node positioning relies on having accurate coordinates from drag start.
    const initialMousePosition = { 
      x: event.activatorEvent?.clientX || 0, 
      y: event.activatorEvent?.clientY || 0 
    };
    
    if (active.data?.current?.type === 'window-drag-node') {
      // Window drag
      const { windowTitle, appType } = active.data.current;
      startDrag('window', {
        appType,
        windowTitle
      });
      
      // Set initial mouse position immediately - REQUIRED for collision detection!
      updateMousePosition(initialMousePosition);
      
      // Create and store throttled mouse move handler
      const mouseMoveHandler = createMouseMoveHandler('window');
      mouseMoveHandlerRef.current = mouseMoveHandler;
      document.addEventListener('mousemove', mouseMoveHandler);
      
      // Store cleanup function
      (window as any).__windowDragMouseMoveCleanup = () => {
        if (mouseMoveHandlerRef.current) {
          document.removeEventListener('mousemove', mouseMoveHandlerRef.current);
          mouseMoveHandlerRef.current = null;
        }
      };
    } else {
      // App drag
      startDrag('app', {
        appId: active.id
      });
      
      // Set initial mouse position immediately for app drags too
      updateMousePosition(initialMousePosition);
      
      // Create and store throttled mouse move handler for app drags
      const mouseMoveHandler = createMouseMoveHandler('app');
      mouseMoveHandlerRef.current = mouseMoveHandler;
      document.addEventListener('mousemove', mouseMoveHandler);
      
      // Store cleanup function
      (window as any).__appDragMouseMoveCleanup = () => {
        if (mouseMoveHandlerRef.current) {
          document.removeEventListener('mousemove', mouseMoveHandlerRef.current);
          mouseMoveHandlerRef.current = null;
        }
      };
    }
  }, [createMouseMoveHandler, startDrag, updateMousePosition]);

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
    
    // Clean up mouse tracking for both window and app drags
    if ((window as any).__windowDragMouseMoveCleanup) {
      (window as any).__windowDragMouseMoveCleanup();
      delete (window as any).__windowDragMouseMoveCleanup;
    }
    if ((window as any).__appDragMouseMoveCleanup) {
      (window as any).__appDragMouseMoveCleanup();
      delete (window as any).__appDragMouseMoveCleanup;
    }
    
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