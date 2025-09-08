/**
 * Drag State Store (Zustand)
 * 
 * Centralized drag-and-drop state management using Zustand.
 * Consolidates all drag state from useUnifiedDrag hook:
 * - App list drag (reordering/deletion)
 * - Window drag (positioning/deletion)
 * - Collision detection state
 * - Pending deletion state
 * 
 * This replaces multiple useState hooks with a single source of truth.
 */

import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';

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

interface DragStoreState {
  // Core drag state
  dragState: DragState;
  
  // Collision detection state
  overId: UniqueIdentifier | null;
  isOverTerminalDropZone: boolean;
  
  // Deletion management
  pendingDelete: PendingDeleteState;
}

interface DragActions {
  // ===== DRAG STATE MANAGEMENT =====
  /**
   * Start a drag operation
   * @param dragType - Type of drag ('app' | 'window')
   * @param payload - Drag-specific data
   */
  startDrag: (dragType: 'app' | 'window', payload: {
    appId?: string;
    appType?: string;
    windowTitle?: string;
  }) => void;
  
  /**
   * Update mouse position during drag
   * @param position - Current mouse coordinates
   */
  updateMousePosition: (position: { x: number; y: number }) => void;
  
  /**
   * End drag operation and reset state
   */
  endDrag: () => void;
  
  // ===== COLLISION DETECTION =====
  /**
   * Update collision detection state
   * @param overId - ID of element being dragged over
   * @param isOverTerminal - Whether dragging over terminal dock
   */
  updateCollision: (overId: UniqueIdentifier | null, isOverTerminal: boolean) => void;
  
  // ===== DELETION MANAGEMENT =====
  /**
   * Set pending deletion state
   * @param appId - App ID to be deleted
   * @param prevOrder - Previous order for restoration
   */
  setPendingDelete: (appId: string | null, prevOrder: string[]) => void;
  
  /**
   * Clear pending deletion state
   */
  clearPendingDelete: () => void;
  
  // ===== RESET =====
  /**
   * Reset all drag state to initial values
   */
  resetDragState: () => void;
}

type DragStore = DragStoreState & DragActions;

// Initial state
const initialDragState: DragState = {
  isDragging: false,
  draggedAppId: null,
  draggedAppType: null,
  draggedWindowTitle: null,
  mousePosition: null
};

const initialPendingDelete: PendingDeleteState = {
  appId: null,
  prevOrder: []
};

const initialState: DragStoreState = {
  dragState: initialDragState,
  overId: null,
  isOverTerminalDropZone: false,
  pendingDelete: initialPendingDelete
};

/**
 * Drag Store Hook
 * 
 * Provides centralized drag state management with selective subscriptions.
 * Components can subscribe to specific drag state slices for optimal performance.
 * 
 * @example
 * // Subscribe to specific state
 * const isDragging = useDragStore(state => state.dragState.isDragging);
 * const overId = useDragStore(state => state.overId);
 * 
 * // Use actions
 * const startDrag = useDragStore(state => state.startDrag);
 * startDrag('app', { appId: 'myApp' });
 */
export const useDragStore = create<DragStore>((set, get) => ({
  // ===== STATE =====
  ...initialState,
  
  // ===== ACTIONS =====
  startDrag: (dragType: 'app' | 'window', payload) => {
    set(state => ({
      dragState: {
        isDragging: true,
        draggedAppId: dragType === 'app' ? payload.appId || null : null,
        draggedAppType: dragType === 'window' ? payload.appType || null : null,
        draggedWindowTitle: dragType === 'window' ? payload.windowTitle || null : null,
        mousePosition: null
      }
    }));
  },
  
  updateMousePosition: (position) => {
    set(state => ({
      dragState: {
        ...state.dragState,
        mousePosition: position
      }
    }));
  },
  
  endDrag: () => {
    set(state => ({
      dragState: initialDragState,
      overId: null,
      isOverTerminalDropZone: false
    }));
  },
  
  updateCollision: (overId, isOverTerminal) => {
    set({
      overId,
      isOverTerminalDropZone: isOverTerminal
    });
  },
  
  setPendingDelete: (appId, prevOrder) => {
    set({
      pendingDelete: { appId, prevOrder }
    });
  },
  
  clearPendingDelete: () => {
    set({
      pendingDelete: initialPendingDelete
    });
  },
  
  resetDragState: () => {
    set(initialState);
  }
}));
