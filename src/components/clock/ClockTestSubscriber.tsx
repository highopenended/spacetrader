/**
 * ClockTestSubscriber Component
 * 
 * Simple test component to demonstrate clock subscription functionality.
 * Shows a spinning element and tick counter to verify the global clock is working.
 * This is a temporary component for testing - will be removed once we integrate
 * real systems like scrap physics.
 */

import React, { useState } from 'react';
import { useClockSubscription } from '../../hooks/useClockSubscription';
import './ClockTestSubscriber.css';

interface ClockTestSubscriberProps {
  /** Whether to show the test component */
  visible?: boolean;
  
  /** Position on screen */
  position?: 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
}

const ClockTestSubscriber: React.FC<ClockTestSubscriberProps> = ({ 
  visible = true,
  position = 'top-right'
}) => {
  // State to track rotation and ticks
  const [rotation, setRotation] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [lastDeltaTime, setLastDeltaTime] = useState(0);

  // Subscribe to clock ticks
  useClockSubscription(
    'test-subscriber',
    (deltaTime, scaledDeltaTime, tickCount) => {
      // Update rotation based on scaled time (respects time scale and pause)
      setRotation(prev => prev + (scaledDeltaTime * 0.1)); // Slow rotation
      setTickCount(tickCount);
      setLastDeltaTime(deltaTime);
    },
    {
      priority: 10, // Lower priority (runs after important systems)
      name: 'Clock Test Subscriber'
    }
  );

  if (!visible) return null;

  return (
    <div className={`clock-test-subscriber clock-test-subscriber--${position}`}>
      <div className="clock-test-subscriber__header">
        <span className="test-title">CLOCK TEST</span>
      </div>
      
      <div className="clock-test-subscriber__content">
        {/* Spinning element */}
        <div 
          className="clock-test-subscriber__spinner"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          ⚙
        </div>
        
        {/* Tick info */}
        <div className="clock-test-subscriber__info">
          <div className="test-metric">
            <span className="metric-label">Ticks:</span>
            <span className="metric-value">{tickCount.toLocaleString()}</span>
          </div>
          <div className="test-metric">
            <span className="metric-label">Delta:</span>
            <span className="metric-value">{lastDeltaTime.toFixed(1)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockTestSubscriber;
