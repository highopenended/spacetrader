/**
 * GrabbedScrapDebugReadout Component
 * 
 * Debug display for grabbed scrap physics and drag information.
 * Shows speed, distance, mass, grip, load, effectiveness, and directional loads.
 * Positioned to the right of MouseDebugReadout.
 */

import React from 'react';
import { useDragStore, useGameStore } from '../../stores';
import './GrabbedScrapDebugReadout.css';

interface GrabbedScrapDebugReadoutProps {
  /** Whether to show the debug readout */
  visible?: boolean;
  
  /** Optional custom position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const GrabbedScrapDebugReadout: React.FC<GrabbedScrapDebugReadoutProps> = ({ 
  visible = true,
  position = 'bottom-left' 
}) => {
  // Grabbed object physics state
  const grabbedObject = useDragStore(state => state.grabbedObject);
  const playerState = useGameStore(state => state.playerState);
  const globalMousePosition = useDragStore(state => state.mouseTracking.globalMousePosition);
  
  // Check if scrap is being dragged (not app/window drag)
  const isScrapDragging = !!grabbedObject.scrapId;

  if (!visible) return null;

  // Check if we have grabbed object physics data
  const hasPhysicsData = grabbedObject.scrapId && grabbedObject.effectiveLoadResult;
  const effectiveLoad = grabbedObject.effectiveLoadResult;
  
  // Calculate current drag speed from velocity (in world units)
  const currentSpeedWu = isScrapDragging && grabbedObject.velocity
    ? Math.sqrt(grabbedObject.velocity.vx ** 2 + grabbedObject.velocity.vy ** 2)
    : 0;
  
  // Calculate distance from cursor to grabbed object (for spring physics debugging)
  const cursorDistance = isScrapDragging && globalMousePosition
    ? Math.sqrt(
        (globalMousePosition.x - grabbedObject.position.x) ** 2 + 
        (globalMousePosition.y - grabbedObject.position.y) ** 2
      )
    : 0;

  return (
    <div className={`grabbed-scrap-debug-readout grabbed-scrap-debug-readout--${position}`}>
      <div className="grabbed-scrap-debug-readout__header">
        <span className="grabbed-scrap-debug-readout__title">GRABBED</span>
      </div>
      
      <div className="grabbed-scrap-debug-readout__metrics">
        <div className="grabbed-scrap-debug-readout__metric" title="Current velocity of dragged scrap in world units per second">
          <span className="metric-label">Spd:</span>
          <span className={`metric-value ${currentSpeedWu > 20 ? 'metric-active' : ''}`}>
            {isScrapDragging ? `${currentSpeedWu.toFixed(1)} wu/s` : '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Distance in pixels between cursor and dragged scrap position">
          <span className="metric-label">Dist:</span>
          <span className={`metric-value ${
            cursorDistance > 100 ? 'metric-warning' : 
            cursorDistance > 50 ? 'metric-active' : ''
          }`}>
            {isScrapDragging ? `${cursorDistance.toFixed(0)}` : '---'}
          </span>
        </div>
        
        {/* Physics metrics - always visible */}
        <div className="grabbed-scrap-debug-readout__metric" title="Mass of the grabbed scrap (baseMass + mutators)">
          <span className="metric-label">Mass:</span>
          <span className="metric-value">
            {hasPhysicsData ? grabbedObject.mass.toFixed(1) : '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Player manipulator base strength (how much load it can handle easily)">
          <span className="metric-label">Grip:</span>
          <span className="metric-value">
            {playerState.manipulatorStrength.toFixed(1)}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Effective load including mass and all active field forces">
          <span className="metric-label">Load:</span>
          <span className={`metric-value ${
            effectiveLoad && effectiveLoad.effectiveLoad > playerState.manipulatorMaxLoad ? 'metric-warning' : ''
          }`}>
            {effectiveLoad?.effectiveLoad.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Manipulator effectiveness (0-100%), lower when approaching max load">
          <span className="metric-label">Eff:</span>
          <span className={`metric-value ${
            effectiveLoad && effectiveLoad.manipulatorEffectiveness > 0 ? 'metric-active' : ''
          }`}>
            {effectiveLoad ? `${(effectiveLoad.manipulatorEffectiveness * 100).toFixed(0)}%` : '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Effective load when moving upward">
          <span className="metric-label">↑:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadUp.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Effective load when moving downward">
          <span className="metric-label">↓:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadDown.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Effective load when moving left">
          <span className="metric-label">←:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadLeft.toFixed(1) ?? '---'}
          </span>
        </div>
        
        <div className="grabbed-scrap-debug-readout__metric" title="Effective load when moving right">
          <span className="metric-label">→:</span>
          <span className="metric-value metric-small">
            {effectiveLoad?.loadRight.toFixed(1) ?? '---'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GrabbedScrapDebugReadout;
