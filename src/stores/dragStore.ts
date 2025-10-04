/**
 * Drag State Store (Zustand)
 * 
 * Centralized drag-and-drop state management using Zustand.
 * Consolidates all drag state from useUnifiedDrag hook:
 * - App list drag (reordering/deletion)
 * - Window drag (positioning/deletion)
 * - Collision detection state
 * - Pending deletion state
 * - Global mouse position tracking
 * 
 * This replaces multiple useState hooks and event listeners with a single source of truth.
 */

import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';

// ===== TYPES =====

interface DragState {
  isDragging: boolean;
  draggedAppId: string | null;
  draggedAppType: string | null;
  draggedWindowTitle: string | null;
}

interface MouseTrackingState {
  globalMousePosition: { x: number; y: number } | null;
  isTrackingMouse: boolean;
  trackingSubscribers: Set<string>; // Track which components are using mouse tracking
}

interface PendingDeleteState {
  appId: string | null;
  prevOrder: string[];
}

interface DragStoreState {
  // Core drag state
  dragState: DragState;
  
  // Global mouse tracking
  mouseTracking: MouseTrackingState;
  
  // Collision detection state
  overId_cursor: UniqueIdentifier | null;
  overId_item: UniqueIdentifier | null;
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
   * End drag operation and reset state
   */
  endDrag: () => void;
  
  // ===== GLOBAL MOUSE TRACKING =====
  /**
   * Subscribe to global mouse tracking
   * @param subscriberId - Unique identifier for the subscriber
   */
  subscribeToMouse: (subscriberId: string) => void;
  
  /**
   * Unsubscribe from global mouse tracking
   * @param subscriberId - Unique identifier for the subscriber
   */
  unsubscribeFromMouse: (subscriberId: string) => void;
  
  /**
   * Update global mouse position (called by global listener)
   * @param position - Current mouse coordinates
   */
  updateGlobalMousePosition: (position: { x: number; y: number }) => void;
  
  // ===== COLLISION DETECTION =====
  /**
   * Update collision detection state for cursor-based drags
   * @param overId - ID of element being dragged over
   * @param isOverTerminal - Whether dragging over terminal dock
   */
  updateCollision: (overId: UniqueIdentifier | null, isOverTerminal: boolean) => void;
  
  /**
   * Update collision detection state for item-based drags
   * @param overId - ID of element being dragged over
   */
  updateItemCollision: (overId: UniqueIdentifier | null) => void;
  
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
  draggedWindowTitle: null
};

const initialMouseTracking: MouseTrackingState = {
  globalMousePosition: null,
  isTrackingMouse: false,
  trackingSubscribers: new Set<string>()
};

const initialPendingDelete: PendingDeleteState = {
  appId: null,
  prevOrder: []
};

const initialState: DragStoreState = {
  dragState: initialDragState,
  mouseTracking: initialMouseTracking,
  overId_cursor: null,
  overId_item: null,
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
 * const overId_cursor = useDragStore(state => state.overId_cursor);
 * const overId_item = useDragStore(state => state.overId_item);
 * 
 * // Subscribe to global mouse tracking
 * const mousePosition = useDragStore(state => state.mouseTracking.globalMousePosition);
 * const subscribeToMouse = useDragStore(state => state.subscribeToMouse);
 * const unsubscribeFromMouse = useDragStore(state => state.unsubscribeFromMouse);
 * useEffect(() => {
 *   subscribeToMouse('my-component');
 *   return () => unsubscribeFromMouse('my-component');
 * }, []);
 * 
 * // Use drag actions
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
        draggedWindowTitle: dragType === 'window' ? payload.windowTitle || null : null
      }
    }));
  },
  
  endDrag: () => {
    set(state => ({
      dragState: initialDragState,
      overId_cursor: null,
      overId_item: null,
      isOverTerminalDropZone: false
    }));
  },
  
  subscribeToMouse: (subscriberId) => {
    set(state => {
      const newSubscribers = new Set(state.mouseTracking.trackingSubscribers);
      newSubscribers.add(subscriberId);
      return {
        mouseTracking: {
          ...state.mouseTracking,
          trackingSubscribers: newSubscribers,
          isTrackingMouse: true
        }
      };
    });
  },
  
  unsubscribeFromMouse: (subscriberId) => {
    set(state => {
      const newSubscribers = new Set(state.mouseTracking.trackingSubscribers);
      newSubscribers.delete(subscriberId);
      return {
        mouseTracking: {
          ...state.mouseTracking,
          trackingSubscribers: newSubscribers,
          isTrackingMouse: newSubscribers.size > 0,
          globalMousePosition: newSubscribers.size > 0 ? state.mouseTracking.globalMousePosition : null
        }
      };
    });
  },
  
  updateGlobalMousePosition: (position) => {
    set(state => ({
      mouseTracking: {
        ...state.mouseTracking,
        globalMousePosition: position
      }
    }));
  },
  
  updateCollision: (overId, isOverTerminal) => {
    set({
      overId_cursor: overId,
      isOverTerminalDropZone: isOverTerminal
    });
  },
  
  updateItemCollision: (overId) => {
    set({
      overId_item: overId
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
