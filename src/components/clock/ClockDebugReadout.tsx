/**
 * ClockDebugReadout Component
 * 
 * Debug display for the global clock system.
 * Shows FPS, time scale, pause state, and subscriber information.
 * Positioned in the top-left corner next to the settings gear.
 */

import React from 'react';
import { useClockStore } from '../../stores';
import './ClockDebugReadout.css';

interface ClockDebugReadoutProps {
  /** Whether to show the debug readout */
  visible?: boolean;
  
  /** Optional custom position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const ClockDebugReadout: React.FC<ClockDebugReadoutProps> = ({ 
  visible = true,
  position = 'top-left' 
}) => {
  // Clock state
  const isPaused = useClockStore(state => state.isPaused);
  const timeScale = useClockStore(state => state.timeScale);
  const isRunning = useClockStore(state => state.isRunning);
  const metrics = useClockStore(state => state.metrics);
  const subscriberCount = useClockStore(state => state.subscribers.size);

  if (!visible) return null;

  return (
    <div className={`clock-debug-readout clock-debug-readout--${position}`}>
      <div className="clock-debug-readout__header">
        <span className="clock-debug-readout__title">CLOCK</span>
        <span className={`clock-debug-readout__status ${
          !isRunning ? 'status-stopped' : 
          isPaused ? 'status-paused' : 
          'status-running'
        }`}>
          {!isRunning ? 'STOPPED' : isPaused ? 'PAUSED' : 'RUNNING'}
        </span>
      </div>
      
      <div className="clock-debug-readout__metrics">
        <div className="clock-debug-readout__metric">
          <span className="metric-label">FPS:</span>
          <span className={`metric-value ${metrics.fps < 30 ? 'metric-warning' : ''}`}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="clock-debug-readout__metric">
          <span className="metric-label">Scale:</span>
          <span className={`metric-value ${timeScale !== 1 ? 'metric-modified' : ''}`}>
            {timeScale.toFixed(1)}x
          </span>
        </div>
        
        <div className="clock-debug-readout__metric">
          <span className="metric-label">Frame:</span>
          <span className="metric-value">
            {metrics.averageFrameTime.toFixed(1)}ms
          </span>
        </div>
        
        <div className="clock-debug-readout__metric">
          <span className="metric-label">Subs:</span>
          <span className="metric-value">
            {subscriberCount}
          </span>
        </div>
        
        <div className="clock-debug-readout__metric">
          <span className="metric-label">Ticks:</span>
          <span className="metric-value">
            {metrics.totalTicks.toLocaleString()}
          </span>
        </div>
        
        <div className="clock-debug-readout__metric">
          <span className="metric-label">Proc:</span>
          <span className={`metric-value ${
            metrics.lastTickProcessingTime > 5 ? 'metric-warning' : ''
          }`}>
            {metrics.lastTickProcessingTime.toFixed(2)}ms
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClockDebugReadout;
