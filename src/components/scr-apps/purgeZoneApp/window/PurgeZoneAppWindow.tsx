import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import UpgradeList from '../../scrAppWindow/UpgradeList';
import PurgeDropArea from '../../../purgeDropArea/PurgeDropArea';
import './PurgeZoneAppWindow.css';
import { DOM_IDS } from '../../../../constants/domIds';
import { useUpgradesStore } from '../../../../stores';

const PurgeZoneAppWindow: React.FC<BaseWindowProps> = ({
  appType,
  ...windowProps
}) => {
  // Get upgrades directly from upgradesStore
  const getUpgradesForApp = useUpgradesStore(state => state.getUpgradesForApp);
  const isPurchased = useUpgradesStore(state => state.isPurchased);
  const canPurchase = useUpgradesStore(state => state.canPurchase);
  const purchase = useUpgradesStore(state => state.purchase);
  const refund = useUpgradesStore(state => state.refund);
  
  // Call the function outside the selector to avoid infinite re-renders
  const upgradesForApp = React.useMemo(() => getUpgradesForApp(appType), [getUpgradesForApp, appType]);

  const content = (
    <div className="purge-zone-content window-column-layout">
      <PurgeDropArea
        domId={DOM_IDS.PURGE_ZONE_WINDOW}
        containerStyle={{
          flex: 1,
          width: '100%',
          height: '100%',
          margin: '2px',
          minHeight: '80px'
        }}
      />
      
      {/* Upgrades Section */}
      <div style={{ marginTop: 8 }}>
        <UpgradeList
          upgrades={upgradesForApp}
          isPurchased={isPurchased}
          canPurchase={canPurchase}
          purchase={purchase}
          refund={refund}
        />
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Purge Zone"
      appType={appType}
      {...windowProps}
    >
      {content}
    </ScrAppWindow>
  );
};

export default PurgeZoneAppWindow; 