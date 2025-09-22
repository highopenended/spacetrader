import React from 'react';
import './UpgradeRow.css';
import { UpgradeDefinition } from '../../../types/upgradeState';
import { useUpgradesStore } from '../../../stores';

interface UpgradeRowProps {
  upgradeId: string;
  label: string;
  description?: string;
  cost: number;
  purchased: boolean;
  refundable?: boolean;
  canPurchase?: boolean;
  onPurchase: () => void;
  onRefund?: () => void;
  dependencies?: string[];
  allUpgrades: UpgradeDefinition[];
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ 
  upgradeId,
  label, 
  description, 
  cost, 
  purchased, 
  refundable = false, 
  canPurchase = true, 
  onPurchase, 
  onRefund,
  dependencies,
  allUpgrades
}) => {
  const { appUpgradeInProgress, currentUpgradeId } = useUpgradesStore();
  const isThisUpgradeInProgress = appUpgradeInProgress && currentUpgradeId === upgradeId;
  const canClick = !purchased && canPurchase && !appUpgradeInProgress;
  const hasDependencies = dependencies && dependencies.length > 0;
  
  // Check if this is the last dependent upgrade in the list
  const dependentUpgrades = allUpgrades.filter(up => up.dependencies && up.dependencies.length > 0);
  const isLastDependent = hasDependencies && dependentUpgrades[dependentUpgrades.length - 1]?.id === label.toLowerCase().replace(/\s+/g, '');
  
  return (
    <div className={`upgrade-card ${hasDependencies ? 'upgrade-card--dependent' : ''} ${purchased ? 'upgrade-card--purchased' : 'upgrade-card--unpurchased'}`}>
      {/* Dependency connector */}
      {hasDependencies && (
        <div className="upgrade-dependency-connector">
          <div className="upgrade-dependency-line"></div>
          {!isLastDependent && <div className="upgrade-dependency-continuation"></div>}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="detail-label" style={{ lineHeight: 1.2, letterSpacing: 0.5 }}>{label}</div>
      </div>
      <div className="upgrade-actions">
        {!purchased && (
          <button
            type="button"
            onClick={onPurchase}
            disabled={!canClick}
            title={appUpgradeInProgress ? 'Upgrade in progress...' : (canPurchase ? `Purchase for ${cost} credits` : 'Insufficient credits or requirements not met')}
            className={`upgrade-btn upgrade-btn--purchase ${isThisUpgradeInProgress ? 'upgrade-btn--downloading' : ''}`}
          >
            {isThisUpgradeInProgress ? 'DOWNLOADING...' : `${cost}c`}
          </button>
        )}
        {purchased && (
          refundable && onRefund ? (
            <button
              type="button"
              onClick={onRefund}
              title={`Refund ${cost} credits`}
              className="upgrade-btn upgrade-btn--purchased"
            >
              PURCHASED
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Already installed"
              className="upgrade-btn upgrade-btn--installed"
            >
              INSTALLED
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default UpgradeRow;


