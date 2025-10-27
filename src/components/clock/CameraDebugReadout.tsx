/**
 * CameraDebugReadout Component
 * 
 * Debug display for the camera/viewport system.
 * Shows game world size, viewport size, zoom factor, and letterbox bars.
 */

import React, { useState, useEffect } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT, calculateZoom, calculateLetterbox } from '../../constants/cameraConstants';
import './CameraDebugReadout.css';

interface CameraDebugReadoutProps {
  /** Whether to show the debug readout */
  visible?: boolean;
  
  /** Optional custom position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

const CameraDebugReadout: React.FC<CameraDebugReadoutProps> = ({ 
  visible = true,
  position = 'bottom-center' 
}) => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!visible) return null;

  // Calculate zoom and letterbox
  const zoom = calculateZoom(viewport.width, viewport.height);
  const letterbox = calculateLetterbox(viewport.width, viewport.height);
  
  const horizontalBarTotal = letterbox.left + letterbox.right;
  const verticalBarTotal = letterbox.top + letterbox.bottom;

  return (
    <div className={`camera-debug-readout camera-debug-readout--${position}`}>
      <div className="camera-debug-readout__header">
        <span className="camera-debug-readout__title">CAMERA</span>
      </div>
      
      <div className="camera-debug-readout__metrics">
        <div className="camera-debug-readout__metric" title="Fixed game world size in world units">
          <span className="metric-label">Game Screen:</span>
          <span className="metric-value">
            {WORLD_WIDTH}w × {WORLD_HEIGHT}h
          </span>
        </div>
        
        <div className="camera-debug-readout__metric" title="Current browser viewport size in pixels">
          <span className="metric-label">Viewport:</span>
          <span className="metric-value">
            {viewport.width}px × {viewport.height}px
          </span>
        </div>
        
        <div className="camera-debug-readout__metric" title="Current zoom factor (pixels per world unit)">
          <span className="metric-label">Zoom:</span>
          <span className="metric-value metric-highlight">
            {zoom.toFixed(2)}x
          </span>
        </div>
        
        <div className="camera-debug-readout__metric" title="Black bar space on left and right sides">
          <span className="metric-label">Left/Right Bar:</span>
          <span className={`metric-value ${horizontalBarTotal > 0 ? 'metric-active' : ''}`}>
            {letterbox.left.toFixed(0)} + {letterbox.right.toFixed(0)} = {horizontalBarTotal.toFixed(0)}px
          </span>
        </div>
        
        <div className="camera-debug-readout__metric" title="Black bar space on top and bottom">
          <span className="metric-label">Top/Bottom Bar:</span>
          <span className={`metric-value ${verticalBarTotal > 0 ? 'metric-active' : ''}`}>
            {letterbox.top.toFixed(0)} + {letterbox.bottom.toFixed(0)} = {verticalBarTotal.toFixed(0)}px
          </span>
        </div>
      </div>
    </div>
  );
};

export default CameraDebugReadout;

