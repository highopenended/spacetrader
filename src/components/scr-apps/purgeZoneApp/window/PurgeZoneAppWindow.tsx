import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import UpgradeList from '../../scrAppWindow/UpgradeList';
import PurgeDropArea from '../../../purgeDropArea/PurgeDropArea';
import './PurgeZoneAppWindow.css';
import { DOM_IDS } from '../../../../constants/domIds';

const PurgeZoneAppWindow: React.FC<BaseWindowProps> = ({
  appType,
  ...windowProps
}) => {
  // Upgrades plumbing
  const { upgradeData } = (windowProps as any) || {};
  const upgradesForApp = upgradeData?.getUpgradesForApp ? upgradeData.getUpgradesForApp(appType) : [];

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
        <div className="detail-label" style={{ marginBottom: 4 }}>UPGRADES</div>
        <UpgradeList
          upgrades={upgradesForApp}
          isPurchased={upgradeData?.isPurchased || (() => false)}
          canPurchase={upgradeData?.canPurchase || (() => false)}
          purchase={upgradeData?.purchase || (() => false)}
          refund={upgradeData?.refund || (() => false)}
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