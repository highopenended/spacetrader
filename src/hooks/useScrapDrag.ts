/**
 * useScrapDrag
 *
 * Force-based spring physics for scrap dragging with realistic momentum.
 * - Uses spring-damper model: scrap acts like it's attached to cursor by elastic string
 * - Maintains persistent velocity state for natural momentum and pendulum effects
 * - Calculates effective load based on mass, manipulator strength, and active fields
 * - Spring force scales with effectiveness: low effectiveness = weak spring = heavy swinging
 * - Exposes props for draggable elements and a style helper when dragging
 * - Calls an onDrop callback with release position and velocity from physics system
 *
 * Physics Model:
 * - Spring force pulls scrap toward cursor (proportional to distance × stiffness × effectiveness)
 * - Damping force opposes velocity (prevents infinite oscillation)
 * - Forces → acceleration → velocity integration → position integration
 * - Speed limit applied to velocity magnitude (prevents tunneling)
 * - Result: Natural pendulum swings when direction changes rapidly
 *
 * WORLD UNITS:
 * - All physics calculations use world units (wu) for device-independent behavior
 * - Camera system (screenToWorld/worldToScreen) handles pixel ↔ world conversions
 * - Positions stored in world units, converted to screen pixels for rendering
 * 
 * Uses centralized mouse tracking and grabbed object physics from dragStore.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Z_LAYERS } from '../constants/zLayers';
import { 
  VELOCITY_MIN_THRESHOLD_WU_PER_S, 
  SPRING_STIFFNESS_WU, 
  DRAG_DAMPING, 
  MAX_SCRAP_DRAG_SPEED_WU_PER_S 
} from '../constants/physicsConstants';
import { screenToWorld, worldToScreen } from '../constants/cameraConstants';
import { useClockSubscription } from './useClockSubscription';
import { useDragStore, useGameStore } from '../stores';
import { calculateScrapMass, calculateEffectiveLoad, calculateFieldForces } from '../utils/physicsUtils';
import { PhysicsContext } from '../types/physicsTypes';
import { ScrapObject } from '../types/scrapTypes';

export interface ScrapDragDropInfo {
  scrapId: string;
  releasePositionPx: { x: number; y: number }; // Screen pixels for drop detection
  releaseVelocityWuPerSec: { vx: number; vy: number }; // World units per second for physics
  elementSizePx: { width: number; height: number }; // Screen pixels for rendering
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
    
    // Get scrap's actual current position (center point) from DOM
    // This prevents instant teleport - physics will close the gap naturally
    let scrapCenterX = startClientX;
    let scrapCenterY = startClientY;
    
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      scrapCenterX = rect.left + rect.width / 2;
      scrapCenterY = rect.top + rect.height / 2;
      elementSizeRef.current = { width: rect.width, height: rect.height };
    } else {
      elementSizeRef.current = { width: 24, height: 24 };
    }
    
    // Grab object at its actual position in world units (convert from screen pixels)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const worldPos = screenToWorld(scrapCenterX, scrapCenterY, viewportWidth, viewportHeight);
    
    // Store in world units for physics, but convert back to pixels for drag store (temporary)
    // TODO: Update dragStore to use world units internally
    grabObject(scrap, worldPos, mass);
  }, [updateGlobalMousePosition, grabObject, getScrap]);

  const endDrag = useCallback(() => {
    // Release object from store
    const releasedState = releaseObject();
    
    // Clear cursor position tracking
    previousCursorPosRef.current = null;
    
    if (!releasedState || !releasedState.scrapId) {
      return;
    }

    // Velocity is already in world units from physics system
    let releaseVelocityWuPerSec = releasedState.velocity;
    
    // Apply minimum velocity threshold to ignore micro-wiggles (in world units)
    const speed = Math.sqrt(
      releaseVelocityWuPerSec.vx * releaseVelocityWuPerSec.vx + 
      releaseVelocityWuPerSec.vy * releaseVelocityWuPerSec.vy
    );
    
    // If moving very slowly at release, treat as stationary
    if (speed < VELOCITY_MIN_THRESHOLD_WU_PER_S) {
      releaseVelocityWuPerSec = { vx: 0, vy: 0 };
    }

    if (onDrop) {
      // Convert world position back to screen pixels for drop detection
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const screenPos = worldToScreen(releasedState.position.x, releasedState.position.y, viewportWidth, viewportHeight);
      
      onDrop({ 
        scrapId: releasedState.scrapId, 
        releasePositionPx: screenPos, 
        releaseVelocityWuPerSec, 
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
      
      // Get viewport size for coordinate conversions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Convert cursor position to world units for physics calculations
      const cursorWorldPos = screenToWorld(cursorPos.x, cursorPos.y, viewportWidth, viewportHeight);
      
      // Calculate cursor movement since last frame (in world units)
      let cursorDeltaX = 0;
      let cursorDeltaY = 0;
      
      if (previousCursorPosRef.current) {
        const prevCursorWorldPos = screenToWorld(
          previousCursorPosRef.current.x, 
          previousCursorPosRef.current.y, 
          viewportWidth, 
          viewportHeight
        );
        cursorDeltaX = cursorWorldPos.x - prevCursorWorldPos.x;
        cursorDeltaY = cursorWorldPos.y - prevCursorWorldPos.y;
      }
      
      // Calculate distance and direction to cursor (all in world units)
      const dx = cursorWorldPos.x - currentGrabbedObject.position.x;
      const dy = cursorWorldPos.y - currentGrabbedObject.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If very close to cursor, not moving, and velocity is low, snap to it
      // This prevents jitter when holding still and provides tight control at rest
      // Thresholds in world units (2 wu ≈ 0.2 meters at current scale)
      const cursorSpeed = Math.sqrt(cursorDeltaX * cursorDeltaX + cursorDeltaY * cursorDeltaY);
      const scrapSpeed = Math.sqrt(
        currentGrabbedObject.velocity.vx * currentGrabbedObject.velocity.vx + 
        currentGrabbedObject.velocity.vy * currentGrabbedObject.velocity.vy
      );
      if (distance < 0.2 && cursorSpeed < 0.1 && scrapSpeed < 1.0) {
        updateGrabbedObjectPosition(
          cursorWorldPos,
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
      
      // === SPRING-DAMPER PHYSICS MODEL ===
      // Scrap acts like it's attached to cursor by an elastic string
      // This creates natural momentum and pendulum effects
      
      // Get current velocity from grabbed object state
      let vx = currentGrabbedObject.velocity.vx;
      let vy = currentGrabbedObject.velocity.vy;
      
      // Calculate spring force: F = k * distance * effectiveness
      // Spring pulls scrap toward cursor, strength proportional to distance
      // Spring constant is in world units (device-independent)
      // Effectiveness scales spring stiffness (low effectiveness = weak spring = heavy swinging)
      const effectiveStiffness = SPRING_STIFFNESS_WU * effectiveLoadResult.manipulatorEffectiveness;
      const springForceX = dx * effectiveStiffness;
      const springForceY = dy * effectiveStiffness;
      
      // Calculate field forces (gravity, magnets, etc.)
      const fieldForces = calculateFieldForces(physicsContext, currentGrabbedObject.position);
      
      // Combine all forces
      const totalForceX = springForceX + fieldForces.fx;
      const totalForceY = springForceY + fieldForces.fy;
      
      // Calculate acceleration: a = F / m
      const mass = currentGrabbedObject.mass;
      const accelerationX = totalForceX / mass;
      const accelerationY = totalForceY / mass;
      
      // Integrate velocity: v = v + a * dt
      vx += accelerationX * dtSeconds;
      vy += accelerationY * dtSeconds;
      
      // Apply damping: v = v * damping (prevents infinite oscillation)
      vx *= DRAG_DAMPING;
      vy *= DRAG_DAMPING;
      
      // === SPEED LIMITING ===
      // Clamp velocity magnitude to prevent tunneling and physics breakage
      // Speed limit is in world units (device-independent)
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > MAX_SCRAP_DRAG_SPEED_WU_PER_S) {
        const scale = MAX_SCRAP_DRAG_SPEED_WU_PER_S / speed;
        vx *= scale;
        vy *= scale;
      }
      
      // Integrate position: p = p + v * dt (all in world units)
      const newX = currentGrabbedObject.position.x + vx * dtSeconds;
      const newY = currentGrabbedObject.position.y + vy * dtSeconds;
      
      // Update cursor position tracking for next frame
      previousCursorPosRef.current = { x: cursorPos.x, y: cursorPos.y };
      
      // Velocity state to persist for next frame and release physics
      const velocity = { vx, vy };
      
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
    
    // Convert world position to screen pixels for rendering
    const worldPos = grabbedObject.position;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const screenPos = worldToScreen(worldPos.x, worldPos.y, viewportWidth, viewportHeight);
    
    const width = elementSizeRef.current.width || 0;
    const height = elementSizeRef.current.height || 0;
    const leftPx = Math.max(0, screenPos.x - width / 2);
    const bottomPx = Math.max(0, (window.innerHeight - (screenPos.y + height / 2)));
    
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


