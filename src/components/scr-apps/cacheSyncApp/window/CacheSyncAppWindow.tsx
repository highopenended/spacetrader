import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import SaveSection from './SaveSection';
import LoadSection from './LoadSection';
import { useSaveLoad } from '../../../../hooks/useSaveLoad';

interface CacheSyncAppWindowProps extends BaseWindowProps {
  credits: number;
  updateCredits: (amount: number) => void;
  encodeGameState: () => any;
  decodeGameState: (state: any) => boolean;
}

const CacheSyncAppWindow: React.FC<CacheSyncAppWindowProps> = ({
  credits,
  updateCredits,
  encodeGameState,
  decodeGameState,
  ...windowProps
}) => {
  const {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  } = useSaveLoad(credits, updateCredits, encodeGameState, decodeGameState);

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