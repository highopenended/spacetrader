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
  return (
    <div className="window-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {upgrades.map(up => (
        <UpgradeRow
          key={up.id}
          label={up.label}
          description={up.description}
          cost={up.cost}
          purchased={isPurchased(up.id)}
          refundable={up.refundable}
          canPurchase={canPurchase(up.id)}
          onPurchase={() => purchase(up.id)}
          onRefund={() => refund(up.id)}
        />
      ))}
    </div>
  );
};

export default UpgradeList;


