/**
 * useScrapDrag
 *
 * Lightweight pointer-based drag management for scrap items.
 * - Tracks which scrap is being dragged
 * - Tracks cursor position and computes release velocity
 * - Exposes props for draggable elements and a style helper when dragging
 * - Calls an onDrop callback with release position and velocity
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ScrapDragDropInfo {
  scrapId: string;
  releasePositionPx: { x: number; y: number };
  releaseVelocityPxPerSec: { vx: number; vy: number };
  elementSizePx: { width: number; height: number };
}

export interface UseScrapDragOptions {
  onDrop?: (info: ScrapDragDropInfo) => void;
  throttleMs?: number; // default ~16ms (~60fps)
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
  const { onDrop, throttleMs = 16 } = options;

  const [draggedScrapId, setDraggedScrapId] = useState<string | null>(null);
  const [cursorPositionPx, setCursorPositionPx] = useState<{ x: number; y: number } | null>(null);

  // Track when drag started to compute pointer velocity
  const lastEventTimeRef = useRef<number>(0);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityPxPerSecRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const holdOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const elementSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const isThrottledRef = useRef(false);

  const startDragAt = useCallback((scrapId: string, startClientX: number, startClientY: number, targetEl?: HTMLElement | null) => {
    setDraggedScrapId(scrapId);
    setCursorPositionPx({ x: startClientX, y: startClientY });

    // Compute offset from element top-left to pointer for better anchor feel
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      holdOffsetRef.current = { dx: rect.width / 2, dy: rect.height / 2 }; // center under cursor
      elementSizeRef.current = { width: rect.width, height: rect.height };
    } else {
      holdOffsetRef.current = { dx: 12, dy: 12 };
      elementSizeRef.current = { width: 24, height: 24 };
    }

    lastEventTimeRef.current = performance.now();
    lastPointerRef.current = { x: startClientX, y: startClientY };
    velocityPxPerSecRef.current = { vx: 0, vy: 0 };
  }, []);

  const endDrag = useCallback(() => {
    if (!draggedScrapId || !cursorPositionPx) {
      setDraggedScrapId(null);
      setCursorPositionPx(null);
      return;
    }

    const releasePositionPx = cursorPositionPx;
    const releaseVelocityPxPerSec = velocityPxPerSecRef.current;
    const scrapId = draggedScrapId;

    setDraggedScrapId(null);
    setCursorPositionPx(null);

    if (onDrop) {
      onDrop({ scrapId, releasePositionPx, releaseVelocityPxPerSec, elementSizePx: elementSizeRef.current });
    }
  }, [draggedScrapId, cursorPositionPx, onDrop]);

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
    }

    lastEventTimeRef.current = now;
    lastPointerRef.current = { x: clientX, y: clientY };
    setCursorPositionPx({ x: clientX, y: clientY });
  }, [draggedScrapId, throttleMs]);

  // Mouse events
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

  const getDragStyle = useCallback((scrapId: string): React.CSSProperties | undefined => {
    if (!isDragging(scrapId) || !cursorPositionPx) return undefined;
    const { dx, dy } = holdOffsetRef.current;
    return {
      position: 'fixed',
      left: `${Math.max(0, cursorPositionPx.x)}px`,
      top: `${Math.max(0, cursorPositionPx.y)}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      pointerEvents: 'none',
      transition: 'none'
    };
  }, [isDragging, cursorPositionPx]);

  return useMemo(() => ({
    draggedScrapId,
    cursorPositionPx,
    getDraggableProps,
    isDragging,
    getDragStyle
  }), [draggedScrapId, cursorPositionPx, getDraggableProps, isDragging, getDragStyle]);
};

export default useScrapDrag;


