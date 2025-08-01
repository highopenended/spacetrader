import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import SaveSection from './SaveSection';
import LoadSection from './LoadSection';

interface CacheSyncAppWindowProps extends BaseWindowProps {
  credits: number;
  saveToLocalCache: () => boolean;
  loadFromLocalCache: () => boolean;
  exportToFile: () => boolean;
  importFromFile: (file: File) => Promise<boolean>;
  SAVE_COST: number;
}

const CacheSyncAppWindow: React.FC<CacheSyncAppWindowProps> = ({
  credits,
  saveToLocalCache,
  loadFromLocalCache,
  exportToFile,
  importFromFile,
  SAVE_COST,
  ...windowProps
}) => {
  return (
    <ScrAppWindow
      title="Cache Sync"
      {...windowProps}
      minSize={{ width: 300, height: 200 }}
    >
      <div className="window-content-padded">
        <SaveSection 
          onSaveToCache={saveToLocalCache}
          onExportToFile={exportToFile}
          saveCost={SAVE_COST}
          credits={credits}
        />
        <LoadSection 
          onLoadFromCache={loadFromLocalCache}
          onFileLoad={importFromFile}
        />
      </div>
    </ScrAppWindow>
  );
};

export default CacheSyncAppWindow; 