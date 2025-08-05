/**
 * Drag Handler Router Hook
 * 
 * Centralized router that coordinates all drag-and-drop functionality.
 * Manages collision detection, overId state, and coordinates between:
 * - App list drag (reordering/deletion)
 * - Window drag (positioning/deletion)
 * 
 * This eliminates scattered drag logic and provides a single source of truth
 * for all drag operations in the application.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { rectIntersection } from '@dnd-kit/core';
import { UniqueIdentifier } from '@dnd-kit/core';
import { useDragHandler_Apps } from './useDragHandler_Apps';
import { useUIContext } from './useUIContext';

// Interface for drag node state
interface DragNodeState {
  isDragNodeDragging: boolean;
  draggedWindowTitle: string | null;
  draggedAppType: string | null;
  mousePosition: { x: number; y: number } | null;
}

// Interface for pending deletion state
interface PendingDeleteState {
  appId: string | null;
  prevOrder: string[];
}

// Interface for router dependencies
interface DragHandlerRouterDependencies {
  installedApps: any[];
  onAppsReorder: (apps: any[]) => void;
  onAppUninstall: (appId: string) => void;
  closeWindowsByAppType: (appType: string) => void;
  installAppOrder: (order: string[]) => void;
}

/**
 * Centralized drag handler router
 */
export const useDragHandler_Router = (dependencies: DragHandlerRouterDependencies) => {
  const {
    installedApps,
    onAppsReorder,
    onAppUninstall,
    closeWindowsByAppType,
    installAppOrder
  } = dependencies;

  // Get UI context directly
  const { actions: uiActions } = useUIContext();

  // ROUTER STATE: Centralized state management
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [isOverTerminalDropZone, setIsOverTerminalDropZone] = useState<boolean>(false);
  const [appDragMousePosition, setAppDragMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState>({ 
    appId: null, 
    prevOrder: [] 
  });

    // Use ref to track current pendingDelete state for callbacks
  const pendingDeleteRef = useRef<PendingDeleteState>({ appId: null, prevOrder: [] });
  
  // Update ref whenever state changes
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);
  const [dragNodeState, setDragNodeState] = useState<DragNodeState>({
    isDragNodeDragging: false,
    draggedWindowTitle: null,
    draggedAppType: null,
    mousePosition: null
  });

  // COORDINATE: App list drag handler
  const { dragState, handleDragStart: appDragStart, handleDragOver: appDragOver, handleDragEnd: appDragEnd, resetDragState: resetAppDragState } = useDragHandler_Apps({
    installedApps,
    onAppsReorder,
    onAppUninstall
  });

  /**
   * COLLISION DETECTION: Centralized collision detection logic
   * 
   * Handles complex collision detection for the dual drag system.
   * Supports multiple drop zones: purge zone, terminal dock, and sortable list.
   * Provides priority-based collision detection for different drag types.
   */
  const customCollisionDetection = useCallback((args: any) => {
    const collisions = rectIntersection(args);
    
    // PREVENTION: Block PurgeZone window from detecting itself as a valid drop target
    // This prevents visual feedback (red effects, "PURGE RISK") from showing during self-targeting
    if (args.active?.data?.current?.type === 'window-drag-node' && 
        args.active?.data?.current?.appType === 'purgeZone') {
      // Remove purge-zone-window from collisions for PurgeZone window drag
      const filteredCollisions = collisions.filter(c => c.id !== 'purge-zone-window');
      
      // Still allow terminal dock detection for PurgeZone window
      const terminalDock = filteredCollisions.find(c => c.id === 'terminal-dock-zone');
      if (terminalDock) return [terminalDock];
      
      return filteredCollisions;
    }
    
    // WINDOW DRAG NODE SYSTEM: Apply priority only for window drag operations
    if (args.active?.data?.current?.type === 'window-drag-node') {
      const purgeZone = collisions.find(c => c.id === 'purge-zone-window');
      const terminalDock = collisions.find(c => c.id === 'terminal-dock-zone');
      
      if (purgeZone) return [purgeZone];
      if (terminalDock) return [terminalDock];
      
      return collisions;
    }
    
    // APP LIST DRAG SYSTEM: Use normal sortable behavior for app reordering
    // Allow terminal-dock-zone detection for visual feedback, but don't trigger docking behavior
    if (args.active?.data?.current?.type === 'app-drag-node') {
      // Don't filter out terminal-dock-zone - let it be detected for visual feedback
      return collisions;
    }
    
    // Default fallback for any other drag types
    return collisions;
  }, []);

  /**
   * UNIFIED DRAG START HANDLER - Coordinates Both Drag Systems
   * 
   * This handler coordinates between two different drag systems:
   * 1. Standard app list drag (for reordering apps in terminal)
   * 2. Window drag (for positioning and deletion via PurgeZone)
   * 
   * The handler detects which system is being used based on the drag data type:
   * - 'window-drag-node': Window drag → Update purgeNodeDragState
   * - Standard app IDs: App reordering drag → Use existing handleDragStart
   */
  const handleUnifiedDragStart = useCallback((event: any) => {
    const { active } = event;
    
    // WINDOW DRAG SYSTEM: Handle window drag start
    if (active.data?.current?.type === 'window-drag-node') {
      const { windowTitle, appType } = active.data.current;
      setDragNodeState({
        isDragNodeDragging: true,
        draggedWindowTitle: windowTitle,
        draggedAppType: appType,
        mousePosition: null // Will be updated by mouse move handler
      });
      
      // Add mouse move listener to track cursor position for window drag indicator
      const handleWindowDragMouseMove = (e: MouseEvent) => {
        setDragNodeState((prev: DragNodeState) => ({
          ...prev,
          mousePosition: { x: e.clientX, y: e.clientY }
        }));
      };
      
      document.addEventListener('mousemove', handleWindowDragMouseMove);
      
      // Store cleanup function for drag end
      (window as any).__windowDragMouseMoveCleanup = () => {
        document.removeEventListener('mousemove', handleWindowDragMouseMove);
      };
    } else if (active.data?.current?.type === 'app-drag-node') {
      // APP DRAG SYSTEM: Handle app list reordering drag start
      appDragStart(event);
      
      // Track mouse position for app drags
      const handleAppDragMouseMove = (e: MouseEvent) => {
        setAppDragMousePosition({ x: e.clientX, y: e.clientY });
      };
      
      document.addEventListener('mousemove', handleAppDragMouseMove);
      
      // Store cleanup function for drag end
      (window as any).__appDragMouseMoveCleanup = () => {
        document.removeEventListener('mousemove', handleAppDragMouseMove);
      };
    } else {
      // Fallback for any other drag types
      appDragStart(event);
    }
  }, [appDragStart]);

  /**
   * UNIFIED DRAG OVER HANDLER - Tracks Drop Targets
   * 
   * This handler tracks which drop target is currently being hovered over.
   * Updates overId and terminal drop zone state for visual feedback.
   */
  const handleUnifiedDragOver = useCallback((event: any) => {
    const newOverId = event.over?.id ?? null;
    
    // Check if we're over the TerminalScreen (either terminal-dock-zone or any app in the terminal)
    // Only count as over terminal if it's actually a terminal-related drop zone, not purge zone
    const isOverTerminal = (newOverId === 'terminal-dock-zone' || 
                          (newOverId && event.active?.data?.current?.type === 'app-drag-node')) &&
                          newOverId !== 'purge-zone-window';
    
    // Update the router's state
    setOverId(newOverId);
    setIsOverTerminalDropZone(isOverTerminal);
  }, []);

  /**
   * UNIFIED DRAG END HANDLER - Coordinates Drag Completion for Both Systems
   * 
   * This handler manages the completion of drag operations for both drag systems:
   * 1. Resets purge node drag state (always, regardless of drop target)
   * 2. Handles deletion if dropped on PurgeZone (for both systems)
   * 3. Delegates to standard drag handler for app reordering (when appropriate)
   */
  const handleUnifiedDragEnd = useCallback((event: any, apps: any[], appOrder: string[]) => {
    const { active, over } = event;
    
    // WINDOW DRAG SYSTEM: Always reset window drag state when drag ends
    setDragNodeState({
      isDragNodeDragging: false,
      draggedWindowTitle: null,
      draggedAppType: null,
      mousePosition: null
    });
    
    // Clean up mouse move listener for window drag tracking
    if ((window as any).__windowDragMouseMoveCleanup) {
      (window as any).__windowDragMouseMoveCleanup();
      delete (window as any).__windowDragMouseMoveCleanup;
    }
    
    // Clean up app drag mouse tracking
    if ((window as any).__appDragMouseMoveCleanup) {
      (window as any).__appDragMouseMoveCleanup();
      delete (window as any).__appDragMouseMoveCleanup;
    }
    
    // Reset app drag mouse position
    setAppDragMousePosition(null);
    
    // ALWAYS reset overId and terminal state when drag ends
    setOverId(null);
    setIsOverTerminalDropZone(false);
    
    // Don't reset pendingDelete here - it should persist until popup is handled
    
    if (!over) {
      // No drop target - handle reordering only
      appDragEnd(event);
      // Reset router state for no-drop case
      setAppDragMousePosition(null);
      return;
    }
    
    // DELETION HANDLING: Check if dropped on PurgeZone (handles both systems)
    if (over.id === 'purge-zone-window') {

      console.log('dropped on purge zone');

      // WINDOW DRAG SYSTEM: Handle window deletion via drag node
      if (active.data?.current?.type === 'window-drag-node') {
        const { appType, deletable, windowTitle } = active.data.current;
        
        // PREVENTION: PurgeZone window cannot purge itself
        if (appType === 'purgeZone' && over.id === 'purge-zone-window') {
          return; // Silently ignore self-targeting
        }
        
        if (deletable) {
          setPendingDelete({ appId: appType, prevOrder: appOrder });
          uiActions.showPopup({
            title: 'PURGE APP?',
            message: `Are you sure you want to permanently purge ${windowTitle}?`,
            confirmText: 'PURGE',
            cancelText: 'ABORT',
            type: 'alert',
            onConfirm: () => handleConfirmPurge(),
            onCancel: () => handleCancelPurge()
          });
          return;
        }
      }
      
      // STANDARD DRAG SYSTEM: Handle app list item deletion (existing logic)
      const appDefinition = apps.find((app: any) => app.id === active.id);
              if (appDefinition && appDefinition.deletable) {
          setPendingDelete({ appId: active.id, prevOrder: appOrder });
          uiActions.showPopup({
            title: 'PURGE APP?',
            message: `Are you sure you want to permanently purge ${appDefinition.name}?`,
            confirmText: 'PURGE',
            cancelText: 'ABORT',
            type: 'alert',
            onConfirm: () => handleConfirmPurge(),
            onCancel: () => handleCancelPurge()
          });
          return;
        }
    }
    
    // WINDOW DOCKING SYSTEM: Check if dropped on Terminal for docking (minimize)
    if (over.id === 'terminal-dock-zone') {
      // WINDOW DRAG SYSTEM: Handle window docking via drag node
      if (active.data?.current?.type === 'window-drag-node') {
        const { appType } = active.data.current;
        closeWindowsByAppType(appType); // Same behavior as minimize button
        setOverId(null); // Reset overId to hide dock message
        return;
      }
      // APP LIST DRAG SYSTEM: If app list drag hits terminal-dock-zone, ignore it
      // Reset app drag state for this case
      if (active.data?.current?.type === 'app-drag-node') {
        appDragEnd(event);
        setAppDragMousePosition(null);
      }
      return;
    }
    
    // APP DRAG SYSTEM: Handle reordering when dropped on other apps
    if (active.data?.current?.type === 'app-drag-node') {
      appDragEnd(event);
      // Reset router state for app reordering
      setAppDragMousePosition(null);
      return;
    }
  }, [appDragEnd, closeWindowsByAppType]);

  /**
   * Handle confirmation of purge deletion
   */
  const handleConfirmPurge = useCallback(() => {
    const currentPendingDelete = pendingDeleteRef.current;
    if (currentPendingDelete.appId) {
      closeWindowsByAppType(currentPendingDelete.appId);
      onAppUninstall(currentPendingDelete.appId);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
    setIsOverTerminalDropZone(false);
    setAppDragMousePosition(null);
    resetAppDragState();
  }, [closeWindowsByAppType, onAppUninstall, resetAppDragState]);

  /**
   * Handle cancellation of purge deletion
   */
  const handleCancelPurge = useCallback(() => {
    const currentPendingDelete = pendingDeleteRef.current;
    if (currentPendingDelete.prevOrder.length) {
      installAppOrder(currentPendingDelete.prevOrder);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
    setIsOverTerminalDropZone(false);
    setAppDragMousePosition(null);
    resetAppDragState();
  }, [installAppOrder, resetAppDragState]);

      return {
      // State
      overId,
      setOverId,
      isOverTerminalDropZone,
      setIsOverTerminalDropZone,
      appDragMousePosition,
      pendingDelete,
      dragNodeState,
      dragState,
      
      // Collision detection
      customCollisionDetection,
      
      // Unified handlers
      handleUnifiedDragStart,
      handleUnifiedDragOver,
      handleUnifiedDragEnd,
      handleConfirmPurge,
      handleCancelPurge
    };
}; 