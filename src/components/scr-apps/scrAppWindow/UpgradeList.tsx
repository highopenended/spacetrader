import React from 'react';
import UpgradeRow from './UpgradeRow';
import { UpgradeDefinition, UpgradeId } from '../../../types/upgradeState';

interface UpgradeListProps {
  upgrades: UpgradeDefinition[];
  isPurchased: (id: UpgradeId) => boolean;
  canPurchase: (id: UpgradeId) => boolean;
  purchase: (id: UpgradeId) => boolean;
  refund: (id: UpgradeId) => boolean;
}

const UpgradeList: React.FC<UpgradeListProps> = ({ upgrades, isPurchased, canPurchase, purchase, refund }) => {
  if (upgrades.length === 0) return null;
  
  // Sort upgrades: parents first, then children
  const sortedUpgrades = [...upgrades].sort((a, b) => {
    const aHasDeps = a.dependencies && a.dependencies.length > 0;
    const bHasDeps = b.dependencies && b.dependencies.length > 0;
    
    if (aHasDeps && !bHasDeps) return 1; // a is child, b is parent
    if (!aHasDeps && bHasDeps) return -1; // a is parent, b is child
    return 0; // both same type
  });
  
  return (
    <div className="window-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Upgrades Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 4,
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '1px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        textTransform: 'uppercase'
      }}>
        <div style={{ flex: 1, height: '1px', background: '#555' }}></div>
        <div style={{ padding: '0 8px' }}>Upgrades</div>
        <div style={{ flex: 1, height: '1px', background: '#555' }}></div>
      </div>
      
      {sortedUpgrades.map(up => (
        <UpgradeRow
          key={up.id}
          upgradeId={up.id}
          label={up.label}
          description={up.description}
          cost={up.cost}
          purchased={isPurchased(up.id)}
          refundable={up.refundable}
          canPurchase={canPurchase(up.id)}
          onPurchase={() => purchase(up.id)}
          onRefund={() => refund(up.id)}
          dependencies={up.dependencies}
          allUpgrades={upgrades}
        />
      ))}
    </div>
  );
};

export default UpgradeList;


