import React from 'react';
import { Barrier as BarrierType } from '../../../types/barrierTypes';
import { getBarrierTransform } from '../../../utils/barrierGeometry';
import './Barrier.css';

interface BarrierProps {
  barrier: BarrierType;
}

const Barrier: React.FC<BarrierProps> = ({ barrier }) => {
  if (!barrier.enabled) return null;

  const { position, width, height, visual } = barrier;
  
  // Use shared geometry calculation - ensures visual matches collision exactly
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.xVw}vw`,
    bottom: `${position.bottomVh}vh`,
    width: `${width}vw`,
    height: `${height}vw`, // Use vw for height to maintain aspect ratio
    transform: getBarrierTransform(barrier),
    transformOrigin: 'center',
    backgroundColor: visual?.color || '#fff',
    opacity: visual?.opacity ?? 1
  };

  return <div className="barrier" style={style} />;
};

export default Barrier;

