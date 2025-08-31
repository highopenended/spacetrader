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

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DOM_IDS } from '../constants/domIds';
import { useSensor, PointerSensor } from '@dnd-kit/core';
import { rectIntersection } from '@dnd-kit/core';
import { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useUIContext } from './useUIContext';

// ===== TYPES =====

interface DragState {
  isDragging: boolean;
  draggedAppId: string | null;
  draggedAppType: string | null;
  draggedWindowTitle: string | null;
  mousePosition: { x: number; y: number } | null;
}

interface PendingDeleteState {
  appId: string | null;
  prevOrder: string[];
}

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

  const { actions: uiActions } = useUIContext();

  // ===== STATE =====
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppId: null,
    draggedAppType: null,
    draggedWindowTitle: null,
    mousePosition: null
  });

  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [isOverTerminalDropZone, setIsOverTerminalDropZone] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState>({ 
    appId: null, 
    prevOrder: [] 
  });

  const pendingDeleteRef = useRef<PendingDeleteState>({ appId: null, prevOrder: [] });
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
      setDragState(prev => ({
        ...prev,
        mousePosition: { x: e.clientX, y: e.clientY }
      }));
    }, 16); // ~60fps throttling
  }, []);

  // ===== DRAG HANDLERS =====
  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    
    if (active.data?.current?.type === 'window-drag-node') {
      // Window drag
      const { windowTitle, appType } = active.data.current;
      setDragState({
        isDragging: true,
        draggedAppId: null,
        draggedAppType: appType,
        draggedWindowTitle: windowTitle,
        mousePosition: null
      });
      
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
      setDragState({
        isDragging: true,
        draggedAppId: active.id,
        draggedAppType: null,
        draggedWindowTitle: null,
        mousePosition: null
      });
      
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
  }, [createMouseMoveHandler]);

  const handleDragOver = useCallback((event: any) => {
    const newOverId = event.over?.id ?? null;
    const isOverTerminal = (newOverId === DOM_IDS.TERMINAL_DOCK || 
                          (newOverId && event.active?.data?.current?.type === 'app-drag-node')) &&
                          newOverId !== DOM_IDS.PURGE_ZONE_WINDOW && 
                          newOverId !== DOM_IDS.PURGE_ZONE_WORKMODE;
    
    setOverId(newOverId);
    setIsOverTerminalDropZone(isOverTerminal);
  }, []);

  // ===== MEMOIZED HELPER FUNCTIONS =====
  const handleAppReorder = useCallback((activeId: string, overId: string | null) => {
    if (!overId) return;
    
    const activeIndex = appOrder.indexOf(activeId);
    const overIndex = appOrder.indexOf(overId);
    
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
    setPendingDelete({ appId: null, prevOrder: [] });
  }, [closeWindowsByAppType, onAppUninstall]);

  const handleCancelPurge = useCallback(() => {
    const currentPendingDelete = pendingDeleteRef.current;
    if (currentPendingDelete.prevOrder.length) {
      installAppOrder(currentPendingDelete.prevOrder);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
  }, [installAppOrder]);

  const handlePurgeDrop = useCallback((active: any, over: any) => {
    if (active.data?.current?.type === 'window-drag-node') {
      const { appType, deletable, windowTitle } = active.data.current;
      
      if (over?.id === DOM_IDS.PURGE_ZONE_WINDOW) return; // Prevent dropping into window purge zone
      
      if (deletable) {
        setPendingDelete({ appId: appType, prevOrder: appOrder });
        uiActions.showPopup({
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
        setPendingDelete({ appId: active.id, prevOrder: appOrder });
        uiActions.showPopup({
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
  }, [apps, appOrder, uiActions, handleConfirmPurge, handleCancelPurge]);

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
    setDragState({
      isDragging: false,
      draggedAppId: null,
      draggedAppType: null,
      draggedWindowTitle: null,
      mousePosition: null
    });
    setOverId(null);
    setIsOverTerminalDropZone(false);
    
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
  }, [handleAppReorder, handlePurgeDrop, handleTerminalDrop]);

  // ===== RETURN VALUES =====
  return {
    // State
    dragState,
    overId,
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