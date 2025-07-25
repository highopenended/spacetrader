import React from 'react';
import { getAssemblyLineConfig } from '../../utils/scrapUtils';
import AssemblyLine from './AssemblyLine';
import ScrapBin from './ScrapBin';

const WorkScreen: React.FC = () => {
  const config = getAssemblyLineConfig();
  
  const workScreenStyle = {
    '--assembly-line-bottom': `${config.layout.bottom}px`,
    '--assembly-line-height': `${config.layout.height}px`,
    '--assembly-line-z-index': config.visuals.zIndex,
    '--assembly-line-track-height': `${config.layout.trackHeight}px`
  } as React.CSSProperties;

  return (
    <div className="work-screen" style={workScreenStyle}>
      <AssemblyLine />
      <ScrapBin />
    </div>
  );
};

export default WorkScreen; 