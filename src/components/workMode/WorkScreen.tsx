import React from 'react';
import AssemblyLine from './AssemblyLine';
import ScrapBin from './ScrapBin';

const WorkScreen: React.FC = () => {
  return (
    <div className="work-screen">
      <AssemblyLine />
      <ScrapBin />
    </div>
  );
};

export default WorkScreen; 