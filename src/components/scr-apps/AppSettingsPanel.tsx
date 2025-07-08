import React, { useState } from 'react';
import './AppSettingsPanel.css';
import { AppTier } from '../../types/scrAppListState';

interface AppSettingsPanelProps {
  appName: string;
  tiers: AppTier[];
  currentTier: number;
  onTierClick: (tier: number) => void;
}

const AppSettingsPanel: React.FC<AppSettingsPanelProps> = ({
  appName,
  tiers,
  currentTier,
  onTierClick
}) => {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  const currentTierData = tiers.find(tier => tier.tier === currentTier);
  const currentMonthlyCost = currentTierData?.monthlyCost || 0;

  const getTierClassName = (tier: AppTier) => {
    const isCurrentTier = tier.tier === currentTier;
    const isUnlocked = tier.tier <= currentTier;
    const isHovered = hoveredTier === tier.tier;
    
    let className = 'tier-button';
    
    if (isCurrentTier) {
      className += ' current';
    } else if (isUnlocked) {
      className += ' unlocked';
    }
    
    if (isHovered) {
      if (tier.tier > currentTier) {
        className += ' hover-upgrade';
      }
      // Note: Don't add hover-downgrade to the tier being downgraded TO
      // Only tiers being lost should be red, not the target tier
    }
    
    return className;
  };

  const getHoverPreviewClassName = (tier: AppTier) => {
    if (!hoveredTier || hoveredTier === currentTier) return '';
    
    if (hoveredTier > currentTier) {
      // Upgrading: show green for tiers between current and hovered (inclusive)
      const isInUpgradeRange = tier.tier > currentTier && tier.tier <= hoveredTier;
      return isInUpgradeRange ? 'preview-upgrade' : '';
    } else {
      // Downgrading: show red for tiers that will be lost (above hovered tier, not including hovered tier)
      const isInDowngradeRange = tier.tier > hoveredTier && tier.tier <= currentTier;
      return isInDowngradeRange ? 'preview-downgrade' : '';
    }
  };

  return (
    <div className="app-settings-panel">
      <div className="settings-header">
        <div className="settings-title">{appName} Settings</div>
      </div>
      
      <div className="settings-section">
        <div className="section-title">Monthly Cost</div>
        <div className="monthly-cost">{currentMonthlyCost} Credits per Ledger Cycle</div>
      </div>
      
      <div className="settings-section">
        <div className="section-title">Upgrade Tiers</div>
        <div className="tier-grid">
          {tiers.map(tier => (
            <div
              key={tier.tier}
              className={`${getTierClassName(tier)} ${getHoverPreviewClassName(tier)}`}
              onClick={() => onTierClick(tier.tier)}
              onMouseEnter={() => setHoveredTier(tier.tier)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <div className="tier-number">{tier.tier}</div>
              <div className="tier-cost">{tier.flatCost}c</div>
              <div className="tier-monthly">{tier.monthlyCost}c/LC</div>
            </div>
          ))}
        </div>
      </div>
      
      {hoveredTier && hoveredTier !== currentTier && (
        <div className="hover-info">
          <div className="hover-title">
            {hoveredTier > currentTier ? 'Upgrade to' : 'Downgrade to'} Tier {hoveredTier}
          </div>
          <div className="hover-details">
            {hoveredTier > currentTier && (
              <div>Cost: {tiers.find(t => t.tier === hoveredTier)?.flatCost || 0} Credits</div>
            )}
            <div>New Monthly: {tiers.find(t => t.tier === hoveredTier)?.monthlyCost || 0} Credits/LC</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSettingsPanel; 