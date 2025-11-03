/**
 * DebugReadoutsContainer Component
 * 
 * Container for all debug readout components that stacks them left to right
 * at the bottom of the screen with no gaps between them.
 */

import React from 'react';
import ClockDebugReadout from './ClockDebugReadout';
import MouseDebugReadout from './MouseDebugReadout';
import GrabbedScrapDebugReadout from './GrabbedScrapDebugReadout';
import CameraDebugReadout from './CameraDebugReadout';
import './DebugReadoutsContainer.css';

interface DebugReadoutsContainerProps {
  /** Whether to show the debug readouts */
  visible?: boolean;
}

const DebugReadoutsContainer: React.FC<DebugReadoutsContainerProps> = ({ 
  visible = true 
}) => {
  if (!visible) return null;

  return (
    <div className="debug-readouts-container">
      <ClockDebugReadout visible={true} position="inline" />
      <MouseDebugReadout visible={true} position="inline" />
      <GrabbedScrapDebugReadout visible={true} position="inline" />
      <CameraDebugReadout visible={true} position="inline" />
    </div>
  );
};

export default DebugReadoutsContainer;

