import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import SaveSection from './SaveSection';
import LoadSection from './LoadSection';
import { useSaveLoad } from '../../../../hooks/useSaveLoad';

interface CacheSyncAppWindowProps extends BaseWindowProps {
  // Props will be determined based on what functionality this app needs
}

const CacheSyncAppWindow: React.FC<CacheSyncAppWindowProps> = ({
  ...windowProps
}) => {
  const {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  } = useSaveLoad();

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