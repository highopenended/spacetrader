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
import { VELOCITY_MIN_THRESHOLD_PX_PER_S } from '../constants/physicsConstants';
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
  
  // Physics state (only re-renders when fields change - rare)
  const physics = useDragStore(state => state.physics);
  
  // Player state (only re-renders when manipulator upgraded - rare)
  const playerState = useGameStore(state => state.playerState);
  
  // Non-reactive mouse position getter (doesn't cause re-renders)
  const getMousePosition = useCallback(() => 
    useDragStore.getState().mouseTracking.globalMousePosition, 
  []);

  // Track element size for rendering
  const elementSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

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
      const cursorPos = getMousePosition();
      if (!cursorPos) return;
      
      const dtSeconds = Math.max(0, deltaTime / 1000);
      
      // Calculate drag direction from current position to cursor
      const dx = cursorPos.x - grabbedObject.position.x;
      const dy = cursorPos.y - grabbedObject.position.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If very close to cursor, snap to it
      if (distance < 0.5) {
        updateGrabbedObjectPosition(
          cursorPos,
          { vx: 0, vy: 0 },
          grabbedObject.effectiveLoadResult || {
            loadUp: grabbedObject.mass,
            loadDown: grabbedObject.mass,
            loadLeft: grabbedObject.mass,
            loadRight: grabbedObject.mass,
            effectiveLoad: grabbedObject.mass,
            manipulatorEffectiveness: 1.0
          }
        );
        return;
      }
      
      // Normalized drag direction (screen coords: +Y is down)
      const dragDirection = {
        x: dx / distance,
        y: dy / distance
      };
      
      // Build physics context
      const physicsContext: PhysicsContext = {
        globalFields: physics.globalFields,
        pointSourceFields: physics.pointSourceFields,
        manipulatorStrength: playerState.manipulatorStrength,
        manipulatorMaxLoad: playerState.manipulatorMaxLoad,
        scrapMass: grabbedObject.mass,
        dragDirection
      };
      
      // Calculate effective load
      const effectiveLoadResult = calculateEffectiveLoad(physicsContext, grabbedObject.position);
      
      // Calculate follow speed multiplier
      const followSpeed = calculateFollowSpeed(effectiveLoadResult.manipulatorEffectiveness);
      
      // Calculate new position (lerp toward cursor based on follow speed)
      const newX = grabbedObject.position.x + dx * followSpeed;
      const newY = grabbedObject.position.y + dy * followSpeed;
      
      // Calculate velocity for release physics (px/s)
      const velocity = {
        vx: (newX - grabbedObject.position.x) / dtSeconds,
        vy: (newY - grabbedObject.position.y) / dtSeconds
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


