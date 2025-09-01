/**
 * CRT Effects Component
 * 
 * Simulates old CRT monitor effects including scanlines, screen wobble, and static.
 * Intensity increases to show system instability without overwhelming the content.
 */

import React from 'react';
import './CRTEffects.css';

interface CRTEffectsProps {
  /** Whether the effects are active */
  isActive: boolean;
  /** Intensity level affecting wobble and distortion */
  intensity: 'subtle' | 'moderate' | 'heavy' | 'extreme';
}

const CRTEffects: React.FC<CRTEffectsProps> = ({
  isActive,
  intensity
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <div className={`crt-effects ${intensity}`}>
      {/* Scanlines overlay */}
      <div className="crt-scanlines"></div>
      
      {/* Static overlay */}
      <div className="crt-static"></div>
      
      {/* Screen wobble container */}
      <div className="crt-wobble"></div>
    </div>
  );
};

export default CRTEffects;
