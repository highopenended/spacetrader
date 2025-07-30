import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import SaveSection from './SaveSection';
import LoadSection from './LoadSection';

interface CacheSyncAppWindowProps extends BaseWindowProps {
  // Props will be determined based on what functionality this app needs
}

const CacheSyncAppWindow: React.FC<CacheSyncAppWindowProps> = ({
  ...windowProps
}) => {
  return (
    <ScrAppWindow
      title="Cache Sync"
      {...windowProps}
      minSize={{ width: 300, height: 200 }}
    >
      <div className="window-content-padded">
        <SaveSection />
        <LoadSection />
      </div>
    </ScrAppWindow>
  );
};

export default CacheSyncAppWindow; 