/**
 * useScrapDrag
 *
 * Lightweight pointer-based drag management for scrap items.
 * - Tracks which scrap is being dragged
 * - Tracks cursor position via centralized dragStore and computes release velocity
 * - Exposes props for draggable elements and a style helper when dragging
 * - Calls an onDrop callback with release position and velocity
 *
 * Anchoring model (critical for no-jump drops):
 * - We position the dragged element using left (px) and bottom (px) with transform: none
 * - Rendering in WorkScreen also uses left/bottom with transform: none
 * - On drop, we convert the centered cursor to left/bottom consistently so there is no anchor switch
 * 
 * Uses centralized mouse tracking from dragStore to eliminate duplicate event listeners.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Z_LAYERS } from '../constants/zLayers';
import { MOMENTUM_VALID_WINDOW_MS, VELOCITY_MIN_THRESHOLD_PX_PER_S, GRAVITY_VH_PER_S2 } from '../constants/physicsConstants';
import { useClockSubscription } from './useClockSubscription';
import { useDragStore } from '../stores';

export interface ScrapDragDropInfo {
  scrapId: string;
  releasePositionPx: { x: number; y: number };
  releaseVelocityPxPerSec: { vx: number; vy: number };
  elementSizePx: { width: number; height: number };
}

export interface UseScrapDragOptions {
  onDrop?: (info: ScrapDragDropInfo) => void;
  throttleMs?: number; // default ~16ms (~60fps)
  getScrapMutators?: (scrapId: string) => string[]; // Function to get mutators for a scrap
}

export interface UseScrapDragApi {
  draggedScrapId: string | null;
  cursorPositionPx: { x: number; y: number } | null;
  getDraggableProps: (scrapId: string) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  isDragging: (scrapId: string) => boolean;
  getDragStyle: (scrapId: string) => React.CSSProperties | undefined;
}

export const useScrapDrag = (options: UseScrapDragOptions = {}): UseScrapDragApi => {
  const { onDrop, throttleMs = 16, getScrapMutators } = options;

  // Centralized mouse tracking from dragStore
  const cursorPositionPx = useDragStore(state => state.mouseTracking.globalMousePosition);
  const subscribeToMouse = useDragStore(state => state.subscribeToMouse);
  const unsubscribeFromMouse = useDragStore(state => state.unsubscribeFromMouse);
  const updateGlobalMousePosition = useDragStore(state => state.updateGlobalMousePosition);

  const [draggedScrapId, setDraggedScrapId] = useState<string | null>(null);
  
  // Track lagged position for dense scrap
  const [draggedScrapPositionPx, setDraggedScrapPositionPx] = useState<{ x: number; y: number } | null>(null);
  
  // Track momentum for dense scrap (for swinging behavior)
  const momentumRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  // Track when drag started to compute pointer velocity
  const lastEventTimeRef = useRef<number>(0);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityPxPerSecRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const elementSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Momentum recency filter (keep momentum only if release is soon after last significant movement)
  const lastActiveVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastActiveTimeRef = useRef<number>(0);

  const isThrottledRef = useRef(false);

  const startDragAt = useCallback((scrapId: string, startClientX: number, startClientY: number, targetEl?: HTMLElement | null) => {
    setDraggedScrapId(scrapId);
    updateGlobalMousePosition({ x: startClientX, y: startClientY });
    setDraggedScrapPositionPx({ x: startClientX, y: startClientY }); // Initialize lagged position
    momentumRef.current = { vx: 0, vy: 0 }; // Reset momentum

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      elementSizeRef.current = { width: rect.width, height: rect.height };
    } else {
      elementSizeRef.current = { width: 24, height: 24 };
    }

    lastEventTimeRef.current = performance.now();
    lastPointerRef.current = { x: startClientX, y: startClientY };
    velocityPxPerSecRef.current = { vx: 0, vy: 0 };
  }, [updateGlobalMousePosition]);

  const endDrag = useCallback(() => {
    if (!draggedScrapId || !cursorPositionPx) {
      setDraggedScrapId(null);
      setDraggedScrapPositionPx(null);
      return;
    }

    // Use scrap position instead of cursor position for drop detection and physics
    const releasePositionPx = draggedScrapPositionPx || cursorPositionPx;
    // Use last significant movement only if within recent time window; else zero out momentum
    const now = performance.now();
    const timeSinceActive = now - lastActiveTimeRef.current;
    const useMomentum = timeSinceActive <= MOMENTUM_VALID_WINDOW_MS;
    const releaseVelocityPxPerSec = useMomentum ? lastActiveVelocityRef.current : { vx: 0, vy: 0 };
    const scrapId = draggedScrapId;

    setDraggedScrapId(null);
    setDraggedScrapPositionPx(null);
    momentumRef.current = { vx: 0, vy: 0 }; // Reset momentum

    if (onDrop) {
      onDrop({ scrapId, releasePositionPx, releaseVelocityPxPerSec, elementSizePx: elementSizeRef.current });
    }
  }, [draggedScrapId, cursorPositionPx, draggedScrapPositionPx, onDrop]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggedScrapId) return;
    if (isThrottledRef.current) return;

    isThrottledRef.current = true;
    setTimeout(() => {
      isThrottledRef.current = false;
    }, throttleMs);

    const now = performance.now();
    const dtMs = now - lastEventTimeRef.current;
    const dt = dtMs > 0 ? dtMs / 1000 : 0.016; // seconds

    const last = lastPointerRef.current;
    const dx = clientX - last.x;
    const dy = clientY - last.y;

    // Update velocity in px/s
    if (dt > 0) {
      velocityPxPerSecRef.current = { vx: dx / dt, vy: dy / dt };
      const speed = Math.hypot(velocityPxPerSecRef.current.vx, velocityPxPerSecRef.current.vy);
      if (speed >= VELOCITY_MIN_THRESHOLD_PX_PER_S) {
        lastActiveVelocityRef.current = velocityPxPerSecRef.current;
        lastActiveTimeRef.current = now;
      }
    }

    lastEventTimeRef.current = now;
    lastPointerRef.current = { x: clientX, y: clientY };
    updateGlobalMousePosition({ x: clientX, y: clientY });

    // For normal scrap, update position immediately
    // For dense scrap, the position will be updated by the clock subscription
    setDraggedScrapPositionPx(prevPosition => {
      if (!prevPosition) return { x: clientX, y: clientY };
      
      // Check if scrap has dense mutator
      const mutators = getScrapMutators?.(draggedScrapId) || [];
      const isDense = mutators.includes('dense');
      
      if (!isDense) {
        // Normal scrap follows cursor exactly
        return { x: clientX, y: clientY };
      } else {
        // Dense scrap position will be updated by clock subscription
        return prevPosition;
      }
    });
  }, [draggedScrapId, throttleMs, getScrapMutators, updateGlobalMousePosition]);

  // Subscribe to global mouse tracking (always active for this hook)
  useEffect(() => {
    subscribeToMouse('useScrapDrag');
    return () => {
      unsubscribeFromMouse('useScrapDrag');
    };
  }, [subscribeToMouse, unsubscribeFromMouse]);

  // During active drag, we still need our own mouse listener for velocity tracking
  // The global tracker handles position, but we need to track velocity/momentum locally
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    if (draggedScrapId) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggedScrapId, handlePointerMove, endDrag]);

  // Touch events
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      handlePointerMove(t.clientX, t.clientY);
    };
    const onTouchEnd = () => endDrag();
    if (draggedScrapId) {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchEnd);
    }
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [draggedScrapId, handlePointerMove, endDrag]);

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

  const isDragging = useCallback((scrapId: string) => draggedScrapId === scrapId, [draggedScrapId]);

  // Clock subscription for dense scrap lag movement
  useClockSubscription(
    'scrap-drag-lag',
    (deltaTime, scaledDeltaTime, tickCount) => {
      if (!draggedScrapId || !cursorPositionPx || !draggedScrapPositionPx) return;
      
      const mutators = getScrapMutators?.(draggedScrapId) || [];
      const isDense = mutators.includes('dense');
      
      if (!isDense) return;
      
      // Momentum-based swinging movement for dense scrap
      const dtSeconds = Math.max(0, deltaTime / 1000);
      
      // Convert pixels to physics units for calculations
      const vhPerPx = 100 / window.innerHeight;
      const vwPerPx = 100 / window.innerWidth;
      
      // Physics constants
      const gravityResistance = Math.abs(GRAVITY_VH_PER_S2) * 0.002;
      const inertiaResistance = 0.6;
      const springStrength = 200; // How strongly it's pulled toward target
      const damping = 0.8; // How much momentum is dampened (0.8 = 20% momentum lost per frame)
      
      // Calculate force toward target (like a spring)
      const deltaX = cursorPositionPx.x - draggedScrapPositionPx.x;
      const deltaY = cursorPositionPx.y - draggedScrapPositionPx.y;
      
      // Convert to physics units
      const deltaXvw = deltaX * vwPerPx;
      const deltaYvh = deltaY * vhPerPx;
      
      // Apply spring force toward target
      const springForceX = deltaXvw * springStrength;
      const springForceY = deltaYvh * springStrength;
      
      // Apply inertia resistance to horizontal force
      const horizontalSpringForce = springForceX * (1 - inertiaResistance);
      
      // Update momentum (integrate forces)
      momentumRef.current.vx += horizontalSpringForce * dtSeconds;
      momentumRef.current.vy += springForceY * dtSeconds;
      
      // Apply gravity resistance to vertical momentum accumulation
      // Note: In screen coordinates, positive Y is DOWN, negative Y is UP
      if (momentumRef.current.vy > 0) { // Moving DOWN in screen coords (gravity helps)
        momentumRef.current.vy *= (1 + gravityResistance * 0.3); // Increase downward momentum
      } else { // Moving UP in screen coords (fighting gravity)
        momentumRef.current.vy *= (1 - gravityResistance * 0.5); // Reduce upward momentum
      }
      
      // Apply damping (lose momentum over time)
      momentumRef.current.vx *= damping;
      momentumRef.current.vy *= damping;
      
      // Update position based on momentum
      const newXvw = draggedScrapPositionPx.x * vwPerPx + momentumRef.current.vx * dtSeconds;
      const newYvh = draggedScrapPositionPx.y * vhPerPx + momentumRef.current.vy * dtSeconds;
      
      // Convert back to pixels
      const newX = newXvw / vwPerPx;
      const newY = newYvh / vhPerPx;
      
      setDraggedScrapPositionPx({ x: newX, y: newY });
    },
    {
      priority: 2, // After main game loop but before rendering
      name: 'Scrap Drag Lag Movement'
    }
  );

  const getDragStyle = useCallback((scrapId: string): React.CSSProperties | undefined => {
    if (!isDragging(scrapId) || !cursorPositionPx) return undefined;
    
    // Use lagged position for dense scrap, cursor position for normal scrap
    const mutators = getScrapMutators?.(scrapId) || [];
    const isDense = mutators.includes('dense');
    const positionToUse = (isDense && draggedScrapPositionPx) ? draggedScrapPositionPx : cursorPositionPx;
    
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
  }, [isDragging, cursorPositionPx, draggedScrapPositionPx, getScrapMutators]);

  return useMemo(() => ({
    draggedScrapId,
    cursorPositionPx,
    getDraggableProps,
    isDragging,
    getDragStyle
  }), [draggedScrapId, cursorPositionPx, getDraggableProps, isDragging, getDragStyle]);
};

export default useScrapDrag;


