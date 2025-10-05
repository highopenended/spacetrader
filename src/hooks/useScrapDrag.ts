/**
 * useScrapDrag
 *
 * Physics-based scrap drag management with field calculations.
 * - Tracks which scrap is being dragged via centralized dragStore
 * - Separates cursor position from grabbed object position for realistic physics
 * - Calculates effective load based on mass, manipulator strength, and active fields
 * - Exposes props for draggable elements and a style helper when dragging
 * - Calls an onDrop callback with release position and velocity from physics system
 *
 * Anchoring model (critical for no-jump drops):
 * - We position the dragged element using left (px) and bottom (px) with transform: none
 * - Rendering in WorkScreen also uses left/bottom with transform: none
 * - On drop, we convert the centered position to left/bottom consistently so there is no anchor switch
 * 
 * Uses centralized mouse tracking and grabbed object physics from dragStore.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Z_LAYERS } from '../constants/zLayers';
import { VELOCITY_MIN_THRESHOLD_PX_PER_S, MANIPULATOR_CURSOR_FOLLOW_RATE, MANIPULATOR_GAP_CLOSURE_RATE } from '../constants/physicsConstants';
import { useClockSubscription } from './useClockSubscription';
import { useDragStore, useGameStore } from '../stores';
import { calculateScrapMass, calculateEffectiveLoad, calculateFollowSpeed } from '../utils/physicsUtils';
import { PhysicsContext } from '../types/physicsTypes';
import { ScrapObject } from '../types/scrapTypes';

export interface ScrapDragDropInfo {
  scrapId: string;
  releasePositionPx: { x: number; y: number };
  releaseVelocityPxPerSec: { vx: number; vy: number };
  elementSizePx: { width: number; height: number };
}

export interface UseScrapDragOptions {
  onDrop?: (info: ScrapDragDropInfo) => void;
  getScrap?: (scrapId: string) => ScrapObject | undefined; // Function to get full scrap object
}

export interface UseScrapDragApi {
  draggedScrapId: string | null;
  cursorPositionPx: { x: number; y: number } | null;
  grabbedObjectPosition: { x: number; y: number } | null;
  getDraggableProps: (scrapId: string) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  isDragging: (scrapId: string) => boolean;
  getDragStyle: (scrapId: string) => React.CSSProperties | undefined;
}

export const useScrapDrag = (options: UseScrapDragOptions = {}): UseScrapDragApi => {
  const { onDrop, getScrap } = options;

  // Store actions (don't cause re-renders)
  const subscribeToMouse = useDragStore(state => state.subscribeToMouse);
  const unsubscribeFromMouse = useDragStore(state => state.unsubscribeFromMouse);
  const updateGlobalMousePosition = useDragStore(state => state.updateGlobalMousePosition);
  const grabObject = useDragStore(state => state.grabObject);
  const updateGrabbedObjectPosition = useDragStore(state => state.updateGrabbedObjectPosition);
  const releaseObject = useDragStore(state => state.releaseObject);
  
  // Grabbed object state (only re-renders when grabbed object changes)
  const grabbedObject = useDragStore(state => state.grabbedObject);
  
  // Non-reactive mouse position getter (doesn't cause re-renders)
  const getMousePosition = useCallback(() => 
    useDragStore.getState().mouseTracking.globalMousePosition, 
  []);

  // Track element size for rendering
  const elementSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Track previous cursor position for delta calculations
  const previousCursorPosRef = useRef<{ x: number; y: number } | null>(null);

  const startDragAt = useCallback((scrapId: string, startClientX: number, startClientY: number, targetEl?: HTMLElement | null) => {
    // Get scrap object
    const scrap = getScrap?.(scrapId);
    if (!scrap) {
      console.warn(`useScrapDrag: Could not find scrap ${scrapId}`);
      return;
    }
    
    // Calculate scrap mass
    const mass = calculateScrapMass(scrap);
    
    // Update global mouse position
    updateGlobalMousePosition({ x: startClientX, y: startClientY });
    
    // Initialize cursor position tracking for delta calculations
    previousCursorPosRef.current = { x: startClientX, y: startClientY };
    
    // Grab object in store with physics tracking
    grabObject(scrap, { x: startClientX, y: startClientY }, mass);
    
    // Track element size for rendering
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      elementSizeRef.current = { width: rect.width, height: rect.height };
    } else {
      elementSizeRef.current = { width: 24, height: 24 };
    }
  }, [updateGlobalMousePosition, grabObject, getScrap]);

  const endDrag = useCallback(() => {
    // Release object from store
    const releasedState = releaseObject();
    
    // Clear cursor position tracking
    previousCursorPosRef.current = null;
    
    if (!releasedState || !releasedState.scrapId) {
      return;
    }

    // Use velocity from physics system (calculated every frame)
    let releaseVelocityPxPerSec = releasedState.velocity;
    
    // Apply minimum velocity threshold to ignore micro-wiggles
    const speed = Math.sqrt(
      releaseVelocityPxPerSec.vx * releaseVelocityPxPerSec.vx + 
      releaseVelocityPxPerSec.vy * releaseVelocityPxPerSec.vy
    );
    
    // If moving very slowly at release (< 20px/s), treat as stationary
    if (speed < VELOCITY_MIN_THRESHOLD_PX_PER_S) {
      releaseVelocityPxPerSec = { vx: 0, vy: 0 };
    }

    if (onDrop) {
      onDrop({ 
        scrapId: releasedState.scrapId, 
        releasePositionPx: releasedState.position, 
        releaseVelocityPxPerSec, 
        elementSizePx: elementSizeRef.current 
      });
    }
  }, [releaseObject, onDrop]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!grabbedObject.scrapId) return;
    
    // Update global mouse position (physics system will read this in clock subscription)
    updateGlobalMousePosition({ x: clientX, y: clientY });
  }, [grabbedObject.scrapId, updateGlobalMousePosition]);

  // Subscribe to global mouse tracking (always active for this hook)
  useEffect(() => {
    subscribeToMouse('useScrapDrag');
    return () => {
      unsubscribeFromMouse('useScrapDrag');
    };
  }, [subscribeToMouse, unsubscribeFromMouse]);

  // During active drag, we need mouse listener for velocity tracking
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    if (grabbedObject.scrapId) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [grabbedObject.scrapId, handlePointerMove, endDrag]);

  // Touch events
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      handlePointerMove(t.clientX, t.clientY);
    };
    const onTouchEnd = () => endDrag();
    if (grabbedObject.scrapId) {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchEnd);
    }
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [grabbedObject.scrapId, handlePointerMove, endDrag]);

  const getDraggableProps = useCallback((scrapId: string) => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      startDragAt(scrapId, e.clientX, e.clientY, e.currentTarget as HTMLElement);
    },
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      e.preventDefault();
      startDragAt(scrapId, t.clientX, t.clientY, e.currentTarget as HTMLElement);
    }
  }), [startDragAt]);

  const isDragging = useCallback((scrapId: string) => grabbedObject.scrapId === scrapId, [grabbedObject.scrapId]);

  // Clock subscription for physics-based grabbed object movement
  // Only enabled when actually grabbing an object (prevents unnecessary frame updates)
  useClockSubscription(
    'scrap-drag-physics',
    (deltaTime, scaledDeltaTime, tickCount) => {
      // Read fresh state from stores (not stale closures)
      const currentGrabbedObject = useDragStore.getState().grabbedObject;
      const currentPhysics = useDragStore.getState().physics;
      const currentPlayerState = useGameStore.getState().playerState;
      
      if (!currentGrabbedObject.scrapId) return;
      
      const cursorPos = getMousePosition();
      if (!cursorPos) return;
      
      const dtSeconds = Math.max(0, deltaTime / 1000);
      
      // Calculate cursor movement since last frame
      let cursorDeltaX = 0;
      let cursorDeltaY = 0;
      
      if (previousCursorPosRef.current) {
        cursorDeltaX = cursorPos.x - previousCursorPosRef.current.x;
        cursorDeltaY = cursorPos.y - previousCursorPosRef.current.y;
      }
      
      // Calculate distance and direction to cursor (for physics calculations)
      const dx = cursorPos.x - currentGrabbedObject.position.x;
      const dy = cursorPos.y - currentGrabbedObject.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If very close to cursor and not moving, snap to it
      const cursorSpeed = Math.sqrt(cursorDeltaX * cursorDeltaX + cursorDeltaY * cursorDeltaY);
      if (distance < 2 && cursorSpeed < 1) {
        updateGrabbedObjectPosition(
          cursorPos,
          { vx: 0, vy: 0 },
          currentGrabbedObject.effectiveLoadResult || {
            loadUp: currentGrabbedObject.mass,
            loadDown: currentGrabbedObject.mass,
            loadLeft: currentGrabbedObject.mass,
            loadRight: currentGrabbedObject.mass,
            effectiveLoad: currentGrabbedObject.mass,
            manipulatorEffectiveness: 1.0
          }
        );
        previousCursorPosRef.current = { x: cursorPos.x, y: cursorPos.y };
        return;
      }
      
      // Normalized drag direction (screen coords: +Y is down)
      const dragDirection = {
        x: distance > 0 ? dx / distance : 0,
        y: distance > 0 ? dy / distance : 0
      };
      
      // Build physics context
      const physicsContext: PhysicsContext = {
        globalFields: currentPhysics.globalFields,
        pointSourceFields: currentPhysics.pointSourceFields,
        manipulatorStrength: currentPlayerState.manipulatorStrength,
        manipulatorMaxLoad: currentPlayerState.manipulatorMaxLoad,
        scrapMass: currentGrabbedObject.mass,
        dragDirection
      };
      
      // Calculate effective load
      const effectiveLoadResult = calculateEffectiveLoad(physicsContext, currentGrabbedObject.position);
      
      // Calculate follow speed multiplier based on manipulator effectiveness
      const followSpeed = calculateFollowSpeed(effectiveLoadResult.manipulatorEffectiveness);
      
      // === HYBRID MOVEMENT SYSTEM ===
      // Two independent components that combine for natural-feeling lag:
      
      // 1. CURSOR DELTA FOLLOWING: Scale cursor movement with adjustable lag
      //    - At 100% effectiveness: always follows cursor exactly (no lag)
      //    - Below 100%: lag is scaled by MANIPULATOR_CURSOR_FOLLOW_RATE
      //    - Rate = 1.0: normal lag, Rate = 2.0: double lag, Rate = 0.5: half lag
      const ineffectiveness = 1.0 - followSpeed;
      const scaledIneffectiveness = ineffectiveness * MANIPULATOR_CURSOR_FOLLOW_RATE;
      const finalFollowRate = 1.0 - scaledIneffectiveness;
      const deltaMovementX = cursorDeltaX * finalFollowRate;
      const deltaMovementY = cursorDeltaY * finalFollowRate;
      
      // 2. DISTANCE-BASED ATTRACTION: Independent lerp toward cursor
      //    - Always pulls scrap toward cursor, even when cursor stops
      //    - Tunable via MANIPULATOR_GAP_CLOSURE_RATE constant
      //    - Strength increases with distance (linear relationship)
      //    - Scaled by effectiveness AND time (framerate-independent)
      const gapClosureRate = MANIPULATOR_GAP_CLOSURE_RATE * followSpeed * dtSeconds;
      const closureFactorX = dx * gapClosureRate;
      const closureFactorY = dy * gapClosureRate;
      
      // Combine both movements
      const newX = currentGrabbedObject.position.x + deltaMovementX + closureFactorX;
      const newY = currentGrabbedObject.position.y + deltaMovementY + closureFactorY;
      
      // Update cursor position tracking for next frame
      previousCursorPosRef.current = { x: cursorPos.x, y: cursorPos.y };
      
      // Calculate velocity for release physics (px/s)
      const velocity = {
        vx: (newX - currentGrabbedObject.position.x) / dtSeconds,
        vy: (newY - currentGrabbedObject.position.y) / dtSeconds
      };
      
      // Update grabbed object in store
      updateGrabbedObjectPosition(
        { x: newX, y: newY },
        velocity,
        effectiveLoadResult
      );
    },
    {
      priority: 2, // After main game loop but before rendering
      name: 'Scrap Drag Physics',
      enabled: !!grabbedObject.scrapId // Only run when actually grabbing scrap
    }
  );

  const getDragStyle = useCallback((scrapId: string): React.CSSProperties | undefined => {
    if (!isDragging(scrapId)) return undefined;
    
    // Use grabbed object position from physics system
    const positionToUse = grabbedObject.position;
    
    const width = elementSizeRef.current.width || 0;
    const height = elementSizeRef.current.height || 0;
    const leftPx = Math.max(0, positionToUse.x - width / 2);
    const bottomPx = Math.max(0, (window.innerHeight - (positionToUse.y + height / 2)));
    return {
      position: 'fixed',
      left: `${leftPx}px`,
      bottom: `${bottomPx}px`,
      transform: 'none',
      zIndex: Z_LAYERS.SCRAP_DRAG,
      pointerEvents: 'none',
      transition: 'none'
    };
  }, [isDragging, grabbedObject.position]);

  return useMemo(() => ({
    draggedScrapId: grabbedObject.scrapId,
    cursorPositionPx: getMousePosition(), // Read on-demand, doesn't cause re-renders
    grabbedObjectPosition: grabbedObject.scrapId ? grabbedObject.position : null,
    getDraggableProps,
    isDragging,
    getDragStyle
  }), [grabbedObject.scrapId, grabbedObject.position, getDraggableProps, isDragging, getDragStyle, getMousePosition]);
};

export default useScrapDrag;


