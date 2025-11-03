/**
 * MouseDebugReadout Component
 * 
 * Debug display for the global mouse tracking system.
 * Shows current mouse position, tracking status, and subscriber count.
 * Positioned next to ClockDebugReadout.
 */

import React, { useEffect } from 'react';
import { useDragStore, useViewportStore } from '../../stores';
import { screenToWorld } from '../../constants/cameraConstants';
import './MouseDebugReadout.css';

interface MouseDebugReadoutProps {
  /** Whether to show the debug readout */
  visible?: boolean;
  
  /** Optional custom position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
}

const MouseDebugReadout: React.FC<MouseDebugReadoutProps> = ({ 
  visible = true,
  position = 'bottom-left' 
}) => {
  // Mouse tracking state
  const globalMousePosition = useDragStore(state => state.mouseTracking.globalMousePosition);
  const isTrackingMouse = useDragStore(state => state.mouseTracking.isTrackingMouse);
  const subscriberCount = useDragStore(state => state.mouseTracking.trackingSubscribers.size);
  const subscribeToMouse = useDragStore(state => state.subscribeToMouse);
  const unsubscribeFromMouse = useDragStore(state => state.unsubscribeFromMouse);
  
  // Viewport dimensions from centralized viewport store
  const viewport = useViewportStore(state => state.viewport);

  // Check if scrap is being dragged (not app/window drag)
  const grabbedObject = useDragStore(state => state.grabbedObject);
  const isScrapDragging = !!grabbedObject.scrapId;

  // Subscribe this debug component to mouse tracking
  useEffect(() => {
    subscribeToMouse('MouseDebugReadout');
    return () => {
      unsubscribeFromMouse('MouseDebugReadout');
    };
  }, [subscribeToMouse, unsubscribeFromMouse]);

  // Convert cursor position to world units
  const cursorWorldPosition = globalMousePosition
    ? screenToWorld(
        globalMousePosition.x,
        globalMousePosition.y,
        viewport.width,
        viewport.height
      )
    : null;

  if (!visible) return null;

  return (
    <div className={`mouse-debug-readout mouse-debug-readout--${position}`}>
      <div className="mouse-debug-readout__header">
        <span className="mouse-debug-readout__title">CURSOR</span>
        <span className={`mouse-debug-readout__status ${
          isTrackingMouse ? 'status-tracking' : 'status-idle'
        }`}>
          {isTrackingMouse ? 'TRACKING' : 'IDLE'}
        </span>
      </div>
      
      <div className="mouse-debug-readout__metrics">
        <div className="mouse-debug-readout__metric" title="Cursor X position in pixels">
          <span className="metric-label">X(px):</span>
          <span className="metric-value">
            {globalMousePosition?.x?.toFixed(0) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Cursor Y position in pixels">
          <span className="metric-label">Y(px):</span>
          <span className="metric-value">
            {globalMousePosition?.y?.toFixed(0) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Cursor X position in world units">
          <span className="metric-label">X(wu):</span>
          <span className="metric-value">
            {cursorWorldPosition ? cursorWorldPosition.x.toFixed(3) : '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Cursor Y position in world units">
          <span className="metric-label">Y(wu):</span>
          <span className="metric-value">
            {cursorWorldPosition ? cursorWorldPosition.y.toFixed(3) : '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Number of active mouse tracking subscribers">
          <span className="metric-label">Subs:</span>
          <span className="metric-value">
            {subscriberCount}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Whether scrap is currently being dragged">
          <span className="metric-label">Drag:</span>
          <span className={`metric-value ${isScrapDragging ? 'metric-active' : ''}`}>
            {isScrapDragging ? 'YES' : 'NO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MouseDebugReadout;
