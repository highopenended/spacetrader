import React from 'react';
import ScrApp from '../../ScrAppItem';

interface DumpsterVisionAppItemProps {}

const DumpsterVisionAppItem: React.FC<DumpsterVisionAppItemProps> = () => {
  return (
    <ScrApp>
      <div>
        <div className="app-label">Dumpster Vision</div>
      </div>
    </ScrApp>
  );
};

export default DumpsterVisionAppItem;


