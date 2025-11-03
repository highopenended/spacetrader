import React, { useMemo } from 'react';
import { Barrier as BarrierType } from '../../../types/barrierTypes';
import { getBarrierTransform } from '../../../utils/barrierGeometry';
import { useCameraUtils } from '../../../hooks/useCameraUtils';
import { worldRectToScreenStylesFromViewport } from '../../../utils/cameraUtils';
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

  return <div className="barrier" style={style} />;
};

export default Barrier;

