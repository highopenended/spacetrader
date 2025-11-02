import React, { useMemo } from 'react';
import { useViewportStore } from '../../../stores';
import { worldRectToScreenStylesFromViewport } from '../../../utils/cameraUtils';
import { ASSEMBLY_LINE_HEIGHT_WU, ASSEMBLY_LINE_POSITION_WU } from '../../../constants/physicsConstants';
import './AssemblyLine.css';

const AssemblyLine: React.FC = () => {
  const viewport = useViewportStore(state => state.viewport);
  
  // Calculate assembly line screen position from world units (respects letterboxing)
  const lineStyle = useMemo(() => {
    return worldRectToScreenStylesFromViewport(
      {
        x: ASSEMBLY_LINE_POSITION_WU.x,
        yFromBottom: ASSEMBLY_LINE_POSITION_WU.yFromBottom,
        width: ASSEMBLY_LINE_POSITION_WU.width,
        height: ASSEMBLY_LINE_HEIGHT_WU,
        anchor: 'bottom-left'
      },
      viewport
    );
  }, [viewport]);
  
  return (
    <div className="assembly-line" style={lineStyle}>
      <div className="assembly-line-track"></div>
    </div>
  );
};

export default AssemblyLine; 