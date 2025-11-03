import React, { useMemo, useState, useEffect } from 'react';
import { Barrier as BarrierType } from '../../../types/barrierTypes';
import { getBarrierTransform, getBarrierBounds, getBarrierVertices } from '../../../utils/barrierGeometry';
import { useCameraUtils } from '../../../hooks/useCameraUtils';
import { worldRectToScreenStylesFromViewport } from '../../../utils/cameraUtils';
import { DEBUG_BARRIER_BOUNDS, getBarrierOverlapState } from '../../../utils/barrierCollisionUtils';
import './Barrier.css';

interface BarrierProps {
  barrier: BarrierType;
}

const Barrier: React.FC<BarrierProps> = ({ barrier }) => {
  const { viewport } = useCameraUtils();
  const { position, width, height, visual } = barrier;
  
  // Convert barrier world units to screen pixel styles (respects letterboxing)
  const baseStyle = useMemo(() => {
    return worldRectToScreenStylesFromViewport(
      {
        x: position.x,
        yFromBottom: position.yFromBottom,
        width: width,
        height: height,
        anchor: 'center'
      },
      viewport
    );
  }, [position.x, position.yFromBottom, width, height, viewport]);

  // Get bounding box for debug visualization
  const debugBounds = useMemo(() => {
    if (!DEBUG_BARRIER_BOUNDS) return null;
    return getBarrierBounds(barrier, viewport.width, viewport.height);
  }, [barrier, viewport.width, viewport.height]);

  // Get vertices for debug visualization (to verify bounding box)
  const debugVertices = useMemo(() => {
    if (!DEBUG_BARRIER_BOUNDS) return null;
    return getBarrierVertices(barrier, viewport.width, viewport.height);
  }, [barrier, viewport.width, viewport.height]);

  // Track overlap state for debug visualization (update every frame)
  const [hasOverlap, setHasOverlap] = useState(false);
  
  useEffect(() => {
    if (!DEBUG_BARRIER_BOUNDS) return;
    
    let rafId: number | null = null;
    let cancelled = false;
    
    const updateOverlap = () => {
      if (cancelled) return;
      setHasOverlap(getBarrierOverlapState(barrier.id));
      rafId = requestAnimationFrame(updateOverlap);
    };
    
    // Start polling
    updateOverlap();
    
    return () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [barrier.id]);

  if (!barrier.enabled) return null;

  // Combine base positioning with rotation transform and visual styles
  const style: React.CSSProperties = {
    ...baseStyle,
    position: 'fixed',
    transform: getBarrierTransform(barrier),
    transformOrigin: 'center',
    backgroundColor: visual?.color || '#fff',
    opacity: visual?.opacity ?? 1
  };

  return (
    <>
      <div className="barrier" style={style} />
      {DEBUG_BARRIER_BOUNDS && debugBounds && (
        <>
          {/* Bounding box outline */}
          <div
            className="barrier-debug-bounds"
            style={{
              position: 'fixed',
              left: `${debugBounds.minX}px`,
              top: `${debugBounds.minY}px`,
              width: `${debugBounds.maxX - debugBounds.minX}px`,
              height: `${debugBounds.maxY - debugBounds.minY}px`,
              border: `1px solid ${hasOverlap ? '#0f0' : '#f00'}`,
              pointerEvents: 'none',
              zIndex: 100,
              boxSizing: 'border-box'
            }}
          />
          {/* Debug vertices (small dots to verify calculation) */}
          {debugVertices && debugVertices.map((vertex, idx) => (
            <div
              key={idx}
              style={{
                position: 'fixed',
                left: `${vertex.x - 2}px`,
                top: `${vertex.y - 2}px`,
                width: '4px',
                height: '4px',
                backgroundColor: '#00f',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 101
              }}
            />
          ))}
        </>
      )}
    </>
  );
};

export default Barrier;

