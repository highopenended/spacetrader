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
 * - Scrap grab physics (grabbed object tracking with field-based physics)
 * 
 * This replaces multiple useState hooks and event listeners with a single source of truth.
 */

import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';
import { GlobalField, PointSourceField, EffectiveLoadResult } from '../types/physicsTypes';
import { ScrapObject } from '../types/scrapTypes';
import { DEFAULT_GRAVITY_FIELD } from '../constants/physicsConstants';

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

/**
 * Grabbed Object State - Tracks currently grabbed scrap with physics
 * 
 * Separates cursor position from object position to allow for realistic physics.
 * The object can lag behind or fail to follow the cursor based on physics calculations.
 */
interface GrabbedObjectState {
  scrapId: string | null;              // ID of grabbed scrap (null if nothing grabbed)
  scrap: ScrapObject | null;           // The actual scrap object
  position: { x: number; y: number };  // Current scrap position (px, separate from cursor)
  velocity: { vx: number; vy: number }; // Current velocity (px/s)
  mass: number;                        // Calculated mass (baseMass + modifiers)
  effectiveLoadResult: EffectiveLoadResult | null; // Latest physics calculation result
}

/**
 * Physics State - Active fields and manipulator properties
 * 
 * Contains all physics configuration needed for force calculations.
 * Fields can be added/removed dynamically (e.g., from mutators or upgrades).
 */
interface PhysicsState {
  globalFields: GlobalField[];         // Global fields like gravity
  pointSourceFields: PointSourceField[]; // Point source fields like magnets
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
  
  // Grabbed object physics (for scrap dragging)
  grabbedObject: GrabbedObjectState;
  
  // Physics fields
  physics: PhysicsState;
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
  
  // ===== GRABBED OBJECT PHYSICS =====
  /**
   * Grab a scrap object and start physics tracking
   * @param scrap - The scrap object being grabbed
   * @param initialPosition - Initial position of the scrap (px)
   * @param mass - Calculated mass of the scrap
   */
  grabObject: (scrap: ScrapObject, initialPosition: { x: number; y: number }, mass: number) => void;
  
  /**
   * Update grabbed object position and velocity based on physics
   * @param newPosition - New position after physics calculations (px)
   * @param velocity - Current velocity (px/s)
   * @param effectiveLoadResult - Latest physics calculation result
   */
  updateGrabbedObjectPosition: (
    newPosition: { x: number; y: number },
    velocity: { vx: number; vy: number },
    effectiveLoadResult: EffectiveLoadResult
  ) => void;
  
  /**
   * Release grabbed object
   * @returns Released scrap state (for physics handoff to airborne system)
   */
  releaseObject: () => GrabbedObjectState | null;
  
  // ===== PHYSICS FIELDS =====
  /**
   * Set active global fields
   * @param fields - Array of global fields to apply
   */
  setGlobalFields: (fields: GlobalField[]) => void;
  
  /**
   * Set active point source fields
   * @param fields - Array of point source fields to apply
   */
  setPointSourceFields: (fields: PointSourceField[]) => void;
  
  /**
   * Add a global field to the active set
   * @param field - Global field to add
   */
  addGlobalField: (field: GlobalField) => void;
  
  /**
   * Remove a global field by ID
   * @param fieldId - ID of field to remove
   */
  removeGlobalField: (fieldId: string) => void;
  
  /**
   * Add a point source field to the active set
   * @param field - Point source field to add
   */
  addPointSourceField: (field: PointSourceField) => void;
  
  /**
   * Remove a point source field by ID
   * @param fieldId - ID of field to remove
   */
  removePointSourceField: (fieldId: string) => void;
  
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

const initialGrabbedObject: GrabbedObjectState = {
  scrapId: null,
  scrap: null,
  position: { x: 0, y: 0 },
  velocity: { vx: 0, vy: 0 },
  mass: 1,
  effectiveLoadResult: null
};

const initialPhysics: PhysicsState = {
  globalFields: [DEFAULT_GRAVITY_FIELD],
  pointSourceFields: []
};

const initialState: DragStoreState = {
  dragState: initialDragState,
  mouseTracking: initialMouseTracking,
  overId_cursor: null,
  overId_item: null,
  isOverTerminalDropZone: false,
  pendingDelete: initialPendingDelete,
  grabbedObject: initialGrabbedObject,
  physics: initialPhysics
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
  
  // ===== GRABBED OBJECT PHYSICS =====
  grabObject: (scrap, initialPosition, mass) => {
    set({
      grabbedObject: {
        scrapId: scrap.id,
        scrap,
        position: initialPosition,
        velocity: { vx: 0, vy: 0 },
        mass,
        effectiveLoadResult: null
      }
    });
  },
  
  updateGrabbedObjectPosition: (newPosition, velocity, effectiveLoadResult) => {
    set(state => ({
      grabbedObject: {
        ...state.grabbedObject,
        position: newPosition,
        velocity,
        effectiveLoadResult
      }
    }));
  },
  
  releaseObject: () => {
    const state = get();
    const released = state.grabbedObject.scrapId ? { ...state.grabbedObject } : null;
    
    set({
      grabbedObject: initialGrabbedObject
    });
    
    return released;
  },
  
  // ===== PHYSICS FIELDS =====
  setGlobalFields: (fields) => {
    set(state => ({
      physics: {
        ...state.physics,
        globalFields: fields
      }
    }));
  },
  
  setPointSourceFields: (fields) => {
    set(state => ({
      physics: {
        ...state.physics,
        pointSourceFields: fields
      }
    }));
  },
  
  addGlobalField: (field) => {
    set(state => ({
      physics: {
        ...state.physics,
        globalFields: [...state.physics.globalFields, field]
      }
    }));
  },
  
  removeGlobalField: (fieldId) => {
    set(state => ({
      physics: {
        ...state.physics,
        globalFields: state.physics.globalFields.filter(f => f.id !== fieldId)
      }
    }));
  },
  
  addPointSourceField: (field) => {
    set(state => ({
      physics: {
        ...state.physics,
        pointSourceFields: [...state.physics.pointSourceFields, field]
      }
    }));
  },
  
  removePointSourceField: (fieldId) => {
    set(state => ({
      physics: {
        ...state.physics,
        pointSourceFields: state.physics.pointSourceFields.filter(f => f.id !== fieldId)
      }
    }));
  },
  
  resetDragState: () => {
    set(initialState);
  }
}));
