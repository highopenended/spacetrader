import React from 'react';
import './DumpsterVisionOverlay.css';
import { useAnchorsStore } from '../../../stores';
import { Anchor } from '../../../stores/anchorsStore';
import { VisualOverlayProps, ANIMATION_DURATIONS } from '../types';
import { useClockSubscription } from '../../../hooks/useClockSubscription';

/**
 * DumpsterVisionOverlay Component
 * 
 * High-performance AR overlay for scrap item identification.
 * Uses direct DOM manipulation and clock-driven updates for 60fps performance.
 * 
 * Key Features:
 * - Direct DOM updates (no React re-renders)
 * - Clock-driven animation loop
 * - Dynamic element creation/removal
 * - Smooth position interpolation
 * - Connector lines from scrap to labels
 */
const DumpsterVisionOverlay: React.FC<VisualOverlayProps> = ({ isExiting, animationState }) => {
  // ===== REFS & STATE =====
  const labelRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const connectorRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const smoothMapRef = React.useRef<Map<string, Anchor>>(new Map());
  const animateLabelsRef = React.useRef<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // ===== STORE ACCESS =====
  const getAnchors = () => useAnchorsStore.getState().anchors;

  // ===== DOM ELEMENT CREATION =====
  const createLabelElement = React.useCallback((anchor: Anchor, index: number): HTMLDivElement => {
    const labelEl = document.createElement('div');
    
    // Apply CSS class for base styles
    labelEl.className = 'dv-label';
    
    // Set dynamic positioning
    labelEl.style.left = `${anchor.xVw}vw`;
    labelEl.style.bottom = `${anchor.bottomVh}vh`;
    labelEl.setAttribute('aria-hidden', 'true');
    
    // Add animation if needed
    if (animateLabelsRef.current) {
      labelEl.style.animation = `dv-label-in 300ms ease-out ${(index % 5) * 30}ms both`;
    }
    
    // Add label content
    const lines = anchor.label.split('\n');
    lines.forEach((line, lineIdx) => {
      const lineEl = document.createElement('div');
      lineEl.textContent = line;
      
      if (lineIdx === 0) {
        // Header line
        lineEl.className = 'dv-label-header';
      } else if (lineIdx === 1 && lines.length > 1) {
        // First mutator line
        lineEl.className = 'dv-label-mutator';
      }
      
      labelEl.appendChild(lineEl);
    });
    
    return labelEl;
  }, []);

  const createConnectorElement = React.useCallback((): HTMLDivElement => {
    const connectorEl = document.createElement('div');
    connectorEl.className = 'dv-connector';
    connectorEl.setAttribute('aria-hidden', 'true');
    return connectorEl;
  }, []);

  // ===== DOM ELEMENT UPDATES =====
  const updateLabelElement = React.useCallback((element: HTMLDivElement, anchor: Anchor) => {
    element.style.left = `${anchor.xVw}vw`;
    element.style.bottom = `${anchor.bottomVh}vh`;
  }, []);

  const updateConnectorLine = React.useCallback((
    connectorEl: HTMLDivElement, 
    anchor: Anchor, 
    labelEl: HTMLDivElement | null
  ) => {
    if (!labelEl || anchor.cxVw == null || anchor.cyVh == null) return;
    
    const rect = labelEl.getBoundingClientRect();
    const startX = anchor.cxVw * (window.innerWidth / 100);
    const startY = window.innerHeight - anchor.cyVh * (window.innerHeight / 100);
    
    // Use actual on-screen label rect (accounts for transforms) for nearest point
    const labelLeftPx = rect.left;
    const labelRightPx = rect.right;
    const labelTopPx = rect.top;
    const labelBottomPxFromTop = rect.bottom;
    
    // Find nearest point on label rect to start
    const nearestX = Math.max(labelLeftPx, Math.min(startX, labelRightPx));
    const nearestY = Math.max(labelTopPx, Math.min(startY, labelBottomPxFromTop));
    
    const dx = nearestX - startX;
    const dy = nearestY - startY;
    const length = Math.max(0, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Update connector line styles directly
    connectorEl.style.left = `${startX}px`;
    connectorEl.style.top = `${startY}px`;
    connectorEl.style.width = `${Math.max(0, length + 1)}px`;
    connectorEl.style.height = '0px';
    connectorEl.style.transform = `rotate(${angle}deg)`;
  }, []);

  // ===== REF MANAGEMENT =====
  const addLabelElement = React.useCallback((anchor: Anchor, index: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const labelEl = createLabelElement(anchor, index);
    labelRefs.current.set(anchor.id, labelEl);
    container.appendChild(labelEl);
  }, [createLabelElement]);

  const removeLabelElement = React.useCallback((anchorId: string) => {
    const labelEl = labelRefs.current.get(anchorId);
    if (labelEl && labelEl.parentNode) {
      labelEl.parentNode.removeChild(labelEl);
      labelRefs.current.delete(anchorId);
    }
  }, []);

  const addConnectorElement = React.useCallback((anchor: Anchor) => {
    const container = containerRef.current;
    if (!container || anchor.cxVw == null || anchor.cyVh == null) return;
    
    const connectorEl = createConnectorElement();
    connectorRefs.current.set(anchor.id, connectorEl);
    container.appendChild(connectorEl);
  }, [createConnectorElement]);

  const removeConnectorElement = React.useCallback((anchorId: string) => {
    const connectorEl = connectorRefs.current.get(anchorId);
    if (connectorEl && connectorEl.parentNode) {
      connectorEl.parentNode.removeChild(connectorEl);
      connectorRefs.current.delete(anchorId);
    }
  }, []);

  const syncElementsWithAnchors = React.useCallback((currentAnchors: Anchor[]) => {
    const currentIds = new Set(currentAnchors.map(a => a.id));
    
    // Remove elements for anchors that no longer exist
    for (const id of Array.from(labelRefs.current.keys())) {
      if (!currentIds.has(id)) {
        removeLabelElement(id);
      }
    }
    
    for (const id of Array.from(connectorRefs.current.keys())) {
      if (!currentIds.has(id)) {
        removeConnectorElement(id);
      }
    }
    
    // Add elements for new anchors
    currentAnchors.forEach((anchor, index) => {
      if (!labelRefs.current.has(anchor.id)) {
        addLabelElement(anchor, index);
      }
      
      if (!connectorRefs.current.has(anchor.id) && anchor.cxVw != null && anchor.cyVh != null) {
        addConnectorElement(anchor);
      }
    });
  }, [addLabelElement, removeLabelElement, addConnectorElement, removeConnectorElement]);

  const clearAllElements = React.useCallback(() => {
    // Remove all label elements
    for (const id of Array.from(labelRefs.current.keys())) {
      removeLabelElement(id);
    }
    
    // Remove all connector elements
    for (const id of Array.from(connectorRefs.current.keys())) {
      removeConnectorElement(id);
    }
    
    // Clear all ref maps
    labelRefs.current.clear();
    connectorRefs.current.clear();
    smoothMapRef.current.clear();
  }, [removeLabelElement, removeConnectorElement]);

  // ===== SMOOTHING & ANIMATION =====
  const SMOOTHING_CONFIG = React.useMemo(() => ({
    DEAD_PX: 2.5, // slightly larger dead-zone for micro jiggles
    LERP: 0.15, // softer easing when above dead-zone
  }), []);

  const applySmoothing = React.useCallback((anchor: Anchor): Anchor => {
    const vwToPx = window.innerWidth / 100;
    const vhToPx = window.innerHeight / 100;
    const { DEAD_PX, LERP } = SMOOTHING_CONFIG;

    const prev = smoothMapRef.current.get(anchor.id);
    if (!prev) {
      return anchor;
    }

    let xVw = anchor.xVw;
    let bottomVh = anchor.bottomVh;
    const dxPx = (anchor.xVw - prev.xVw) * vwToPx;
    const dyPx = (anchor.bottomVh - prev.bottomVh) * vhToPx;
    
    if (Math.abs(dxPx) < DEAD_PX) {
      xVw = prev.xVw;
    } else {
      xVw = prev.xVw + (anchor.xVw - prev.xVw) * LERP;
    }
    
    if (Math.abs(dyPx) < DEAD_PX) {
      bottomVh = prev.bottomVh;
    } else {
      bottomVh = prev.bottomVh + (anchor.bottomVh - prev.bottomVh) * LERP;
    }

    // Do NOT smooth the scrap center so the connector stays glued during fast motion
    const cxVw = anchor.cxVw;
    const cyVh = anchor.cyVh;

    return { ...anchor, xVw, bottomVh, cxVw, cyVh } as Anchor;
  }, [SMOOTHING_CONFIG]);

  // ===== CLOCK SUBSCRIPTION =====
  const CLOCK_CONFIG = React.useMemo(() => ({
    priority: 2, // After WorkScreen game loop (priority 1)
    name: 'DumpsterVision Animation'
  }), []);

  useClockSubscription(
    'dumpster-vision-animation',
    (deltaTime, scaledDeltaTime, tickCount) => {
      // Handle different animation states
      if (animationState === 'booting') {
        // During boot sequence, don't update anchors
        return;
      }
      
      if (isExiting) {
        // During exit, clean up all elements
        clearAllElements();
        return;
      }
      
      if (animationState !== 'idle') {
        // For other states, don't update
        return;
      }
      
      // Get current anchors from store
      const currentAnchors = getAnchors();
      
      // Sync DOM elements with current anchors (add/remove as needed)
      syncElementsWithAnchors(currentAnchors);
      
      // Update label positions and connector lines with smoothing
      currentAnchors.forEach((anchor, index) => {
        const smoothedAnchor = applySmoothing(anchor);
        
        // Update smooth map for next frame
        smoothMapRef.current.set(anchor.id, smoothedAnchor);
        
        // Update label position directly via DOM
        const labelEl = labelRefs.current.get(anchor.id);
        if (labelEl) {
          updateLabelElement(labelEl, smoothedAnchor);
        }
        
        // Update connector line position directly via DOM
        const connectorEl = connectorRefs.current.get(anchor.id);
        if (connectorEl && anchor.cxVw != null && anchor.cyVh != null) {
          updateConnectorLine(connectorEl, smoothedAnchor, labelEl || null);
        }
      });
      
      // Clean up stale smooth map entries
      const currentIds = new Set(currentAnchors.map(a => a.id));
      for (const id of Array.from(smoothMapRef.current.keys())) {
        if (!currentIds.has(id)) {
          smoothMapRef.current.delete(id);
        }
      }
    },
    CLOCK_CONFIG
  );

  // ===== EFFECTS =====
  // Trigger a one-shot intro animation for labels once booting completes
  React.useEffect(() => {
    if (animationState !== 'idle') return;
    animateLabelsRef.current = true;
    const t = window.setTimeout(() => {
      animateLabelsRef.current = false;
    }, ANIMATION_DURATIONS.LABEL_INTRO);
    return () => window.clearTimeout(t);
  }, [animationState]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearAllElements();
    };
  }, [clearAllElements]);

  // ===== RENDER =====
  const getCrtClassName = () => {
    if (animationState === 'booting') return 'dv-crt dv-booting';
    if (isExiting) return 'dv-crt dv-shutdown';
    return 'dv-crt dv-active';
  };

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    >
      {/* Base CRT layer: scanlines + vignette + subtle green tint */}
      <div className={getCrtClassName()} aria-hidden />

      {/* Boot overlays (shown only during startup) */}
      {animationState === 'booting' && (
        <>
          <div className="dv-boot-flash" aria-hidden />
          <div className="dv-boot-beam" aria-hidden />
          <div className="dv-boot-text" aria-hidden>SYSTEM ONLINE</div>
          <div className="dv-boot-loader" aria-hidden>
            <div className="dv-boot-loader-bar" />
          </div>
          <div className="dv-boot-welcome" aria-hidden>
            WELCOME TO DUMPSTER VISION
          </div>
        </>
      )}
      
      {/* Labels and connector lines are now managed dynamically via clock subscription */}
    </div>
  );
};

export default DumpsterVisionOverlay;