/**
 * Purge Zone Drag Hook
 * 
 * Manages purge node drag state and functionality for the dual drag system.
 * Handles window deletion via drag-to-purge functionality.
 * Provides unified state management for purge node drag operations.
 */

import { useState, useCallback } from 'react';
import { UniqueIdentifier } from '@dnd-kit/core';

// Interface for purge node drag state
interface PurgeNodeDragState {
  isPurgeNodeDragging: boolean;
  draggedWindowTitle: string | null;
  draggedAppType: string | null;
  mousePosition: { x: number; y: number } | null;
}

// Interface for pending deletion state
interface PendingDeleteState {
  appId: string | null;
  prevOrder: string[];
}

/**
 * Hook for managing purge zone drag functionality
 */
export const usePurgeZoneDrag = () => {
  // PURGE NODE DRAG SYSTEM: Track purge node drag state separately from app list drag state
  const [purgeNodeDragState, setPurgeNodeDragState] = useState<PurgeNodeDragState>({
    isPurgeNodeDragging: false,
    draggedWindowTitle: null,
    draggedAppType: null,
    mousePosition: null
  });

  // Pending deletion state
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState>({ 
    appId: null, 
    prevOrder: [] 
  });

  // Clean dnd-kit: track current droppable id
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  /**
   * UNIFIED DRAG START HANDLER - Manages Both Drag Systems
   * 
   * This handler coordinates between two different drag systems:
   * 1. Standard app list drag (for reordering apps in terminal)
   * 2. Purge node drag (for deleting windows by dragging into PurgeZone)
   * 
   * The handler detects which system is being used based on the drag data type:
   * - 'window-purge-node': Window deletion drag → Update purgeNodeDragState
   * - Standard app IDs: App reordering drag → Use existing handleDragStart
   * 
   * This enables consistent drag behavior while maintaining separate state tracking
   * for each system's specific needs.
   */
  const handleUnifiedDragStart = useCallback((event: any, handleDragStart: (event: any) => void) => {
    const { active } = event;
    
    // PURGE NODE DRAG SYSTEM: Handle window deletion drag start
    if (active.data?.current?.type === 'window-purge-node') {
      const { windowTitle, appType } = active.data.current;
      setPurgeNodeDragState({
        isPurgeNodeDragging: true,
        draggedWindowTitle: windowTitle,
        draggedAppType: appType,
        mousePosition: null // Will be updated by mouse move handler
      });
      
      // Add mouse move listener to track cursor position for purge indicator
      const handlePurgeNodeMouseMove = (e: MouseEvent) => {
        setPurgeNodeDragState(prev => ({
          ...prev,
          mousePosition: { x: e.clientX, y: e.clientY }
        }));
      };
      
      document.addEventListener('mousemove', handlePurgeNodeMouseMove);
      
      // Store cleanup function for drag end
      (window as any).__purgeNodeMouseMoveCleanup = () => {
        document.removeEventListener('mousemove', handlePurgeNodeMouseMove);
      };
    } else {
      // STANDARD DRAG SYSTEM: Handle app list reordering drag start
      handleDragStart(event);
    }
  }, []);

  /**
   * UNIFIED DRAG END HANDLER - Coordinates Drag Completion for Both Systems
   * 
   * This handler manages the completion of drag operations for both drag systems:
   * 1. Resets purge node drag state (always, regardless of drop target)
   * 2. Handles deletion if dropped on PurgeZone (for both systems)
   * 3. Delegates to standard drag handler for app reordering (when appropriate)
   * 
   * DELETION LOGIC:
   * - Window purge nodes: Use appType from drag data for deletion
   * - App list items: Use app ID to find definition and check deletability
   * - Both trigger the same deletion confirmation popup
   * 
   * DELEGATION LOGIC:
   * - Purge node drags: Handle entirely here, don't delegate
   * - Standard drags: Delegate to useGameState_AppList handleDragEnd for reordering
   */
  const handleUnifiedDragEnd = useCallback((
    event: any, 
    apps: any[], 
    appOrder: string[], 
    handleDragEnd: (event: any) => void,
    closeWindowsByAppType: (appType: string) => void,
    uninstallApp: (appId: string) => void
  ) => {
    const { active, over } = event;
    
    // PURGE NODE DRAG SYSTEM: Always reset purge drag state when drag ends
    setPurgeNodeDragState({
      isPurgeNodeDragging: false,
      draggedWindowTitle: null,
      draggedAppType: null,
      mousePosition: null
    });
    
    // Clean up mouse move listener for purge node tracking
    if ((window as any).__purgeNodeMouseMoveCleanup) {
      (window as any).__purgeNodeMouseMoveCleanup();
      delete (window as any).__purgeNodeMouseMoveCleanup;
    }
    
    if (!over) return;
    
    // DELETION HANDLING: Check if dropped on PurgeZone (handles both systems)
    if (over.id === 'purge-zone-window') {
      // PURGE NODE DRAG SYSTEM: Handle window deletion via purge node
      if (active.data?.current?.type === 'window-purge-node') {
        const { appType, deletable, windowTitle } = active.data.current;
        
        // PREVENTION: PurgeZone window cannot purge itself
        // This maintains the intended behavior while still allowing PurgeZone to be deletable from other sources
        if (appType === 'purgeZone' && over.id === 'purge-zone-window') {
          return; // Silently ignore self-targeting
        }
        
        if (deletable) {
          setPendingDelete({ appId: appType, prevOrder: appOrder });
          return;
        }
      }
      
      // STANDARD DRAG SYSTEM: Handle app list item deletion (existing logic)
      const appDefinition = apps.find((app: any) => app.id === active.id);
      if (appDefinition && appDefinition.deletable) {
        setPendingDelete({ appId: active.id, prevOrder: appOrder });
        return;
      }
    }
    
    // WINDOW DOCKING SYSTEM: Check if dropped on Terminal for docking (minimize)
    if (over.id === 'terminal-dock-zone') {
      // PURGE NODE DRAG SYSTEM: Handle window docking via purge node
      if (active.data?.current?.type === 'window-purge-node') {
        const { appType } = active.data.current;
        closeWindowsByAppType(appType); // Same behavior as minimize button
        setOverId(null); // Reset overId to hide dock message
        return;
      }
      // APP LIST DRAG SYSTEM: If app list drag hits terminal-dock-zone, ignore it
      // This prevents app reordering from being treated as window docking
      return;
    }
    
    // STANDARD DRAG SYSTEM: Delegate to unified game state handler for reordering
    // Only call for non-purge-node drags to avoid interfering with window positioning
    if (active.data?.current?.type !== 'window-purge-node') {
      handleDragEnd(event);
    }
  }, []);

  /**
   * Handle confirmation of purge deletion
   */
  const handleConfirmPurge = useCallback((
    closeWindowsByAppType: (appType: string) => void,
    uninstallApp: (appId: string) => void
  ) => {
    if (pendingDelete.appId) {
      closeWindowsByAppType(pendingDelete.appId);
      uninstallApp(pendingDelete.appId);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
  }, [pendingDelete]);

  /**
   * Handle cancellation of purge deletion
   */
  const handleCancelPurge = useCallback((installAppOrder: (order: string[]) => void) => {
    if (pendingDelete.prevOrder.length) {
      installAppOrder(pendingDelete.prevOrder);
    }
    setPendingDelete({ appId: null, prevOrder: [] });
    setOverId(null);
  }, [pendingDelete]);

  return {
    // State
    purgeNodeDragState,
    pendingDelete,
    overId,
    
    // Handlers
    handleUnifiedDragStart,
    handleUnifiedDragEnd,
    handleConfirmPurge,
    handleCancelPurge,
    setOverId
  };
}; 