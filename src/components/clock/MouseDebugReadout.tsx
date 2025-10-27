/**
 * MouseDebugReadout Component
 * 
 * Debug display for the global mouse tracking system.
 * Shows current mouse position, tracking status, and subscriber count.
 * Positioned next to ClockDebugReadout.
 */

import React from 'react';
import { useDragStore, useGameStore } from '../../stores';
import { MAX_SCRAP_DRAG_SPEED_PX_PER_S } from '../../constants/physicsConstants';
import './MouseDebugReadout.css';

interface MouseDebugReadoutProps {
  /** Whether to show the debug readout */
  visible?: boolean;
  
  /** Optional custom position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
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
  
  // Grabbed object physics state
  const grabbedObject = useDragStore(state => state.grabbedObject);
  const playerState = useGameStore(state => state.playerState);
  
  // Check if scrap is being dragged (not app/window drag)
  const isScrapDragging = !!grabbedObject.scrapId;

  // Subscribe this debug component to mouse tracking
  React.useEffect(() => {
    subscribeToMouse('MouseDebugReadout');
    return () => {
      unsubscribeFromMouse('MouseDebugReadout');
    };
  }, [subscribeToMouse, unsubscribeFromMouse]);

  if (!visible) return null;

  // Check if we have grabbed object physics data
  const hasPhysicsData = grabbedObject.scrapId && grabbedObject.effectiveLoadResult;
  const effectiveLoad = grabbedObject.effectiveLoadResult;
  
  // Calculate current drag speed from velocity
  const currentSpeed = isScrapDragging && grabbedObject.velocity
    ? Math.sqrt(grabbedObject.velocity.vx ** 2 + grabbedObject.velocity.vy ** 2)
    : 0;
  const speedPercentage = (currentSpeed / MAX_SCRAP_DRAG_SPEED_PX_PER_S) * 100;
  
  // Calculate distance from cursor to grabbed object (for spring physics debugging)
  const cursorDistance = isScrapDragging && globalMousePosition
    ? Math.sqrt(
        (globalMousePosition.x - grabbedObject.position.x) ** 2 + 
        (globalMousePosition.y - grabbedObject.position.y) ** 2
      )
    : 0;

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
          <span className="metric-label">X:</span>
          <span className="metric-value">
            {globalMousePosition?.x?.toFixed(0) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Cursor Y position in pixels">
          <span className="metric-label">Y:</span>
          <span className="metric-value">
            {globalMousePosition?.y?.toFixed(0) ?? '---'}
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
        
        <div className="mouse-debug-readout__metric" title="Current velocity of dragged scrap in pixels per second">
          <span className="metric-label">Spd:</span>
          <span className={`metric-value ${
            speedPercentage > 90 ? 'metric-warning' : 
            speedPercentage > 70 ? 'metric-active' : ''
          }`}>
            {isScrapDragging ? `${currentSpeed.toFixed(0)}` : '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Distance in pixels between cursor and dragged scrap position">
          <span className="metric-label">Dist:</span>
          <span className={`metric-value ${
            cursorDistance > 100 ? 'metric-warning' : 
            cursorDistance > 50 ? 'metric-active' : ''
          }`}>
            {isScrapDragging ? `${cursorDistance.toFixed(0)}` : '---'}
          </span>
        </div>
        
        {/* Physics metrics - always visible */}
        <div className="mouse-debug-readout__metric" title="Mass of the grabbed scrap (baseMass + mutators)">
          <span className="metric-label">Mass:</span>
          <span className="metric-value">
            {hasPhysicsData ? grabbedObject.mass.toFixed(1) : '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Player manipulator base strength (how much load it can handle easily)">
          <span className="metric-label">Grip:</span>
          <span className="metric-value">
            {playerState.manipulatorStrength.toFixed(1)}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Effective load including mass and all active field forces">
          <span className="metric-label">Load:</span>
          <span className={`metric-value ${
            effectiveLoad && effectiveLoad.effectiveLoad > playerState.manipulatorMaxLoad ? 'metric-warning' : ''
          }`}>
            {effectiveLoad?.effectiveLoad.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Manipulator effectiveness (0-100%), lower when approaching max load">
          <span className="metric-label">Eff:</span>
          <span className={`metric-value ${
            effectiveLoad && effectiveLoad.manipulatorEffectiveness > 0 ? 'metric-active' : ''
          }`}>
            {effectiveLoad ? `${(effectiveLoad.manipulatorEffectiveness * 100).toFixed(0)}%` : '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Effective load when moving upward">
          <span className="metric-label">↑:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadUp.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Effective load when moving downward">
          <span className="metric-label">↓:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadDown.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Effective load when moving left">
          <span className="metric-label">←:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadLeft.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="mouse-debug-readout__metric" title="Effective load when moving right">
          <span className="metric-label">→:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadRight.toFixed(1) ?? '---'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MouseDebugReadout;

