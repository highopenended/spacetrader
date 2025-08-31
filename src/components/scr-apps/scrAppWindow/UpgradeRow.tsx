import React from 'react';
import './UpgradeRow.css';

interface UpgradeRowProps {
  label: string;
  description?: string;
  cost: number;
  purchased: boolean;
  refundable?: boolean;
  canPurchase?: boolean;
  onPurchase: () => void;
  onRefund?: () => void;
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ label, description, cost, purchased, refundable = false, canPurchase = true, onPurchase, onRefund }) => {
  const canClick = !purchased && canPurchase;
  return (
    <div className="upgrade-card">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="detail-label" style={{ lineHeight: 1.2, letterSpacing: 0.5 }}>{label}</div>
      </div>
      <div className="upgrade-actions">
        {!purchased && (
          <button
            type="button"
            onClick={onPurchase}
            disabled={!canClick}
            title={canPurchase ? `Purchase for ${cost} credits` : 'Insufficient credits or requirements not met'}
            className="upgrade-btn"
          >
            UPGRADE
          </button>
        )}
        {!purchased && (
          <div className={`upgrade-price-note ${canClick ? '' : 'is-unaffordable'}`} aria-label={`Cost: ${cost} credits`}>
            ₵{cost}
          </div>
        )}
        {purchased && (
          refundable && onRefund ? (
            <button
              type="button"
              onClick={onRefund}
              title={`Refund ${cost} credits`}
              className="upgrade-btn upgrade-btn--remove"
            >
              REMOVE
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


