import React, { useEffect, useRef } from 'react';
import './TierChangeConfirmPopup.css';
import { AppTier } from '../../types/scrAppListState';

interface TierChangeConfirmPopupProps {
  open: boolean;
  appName: string;
  currentTier: number;
  targetTier: number;
  tierData: AppTier | undefined;
  isUpgrade: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TierChangeConfirmPopup: React.FC<TierChangeConfirmPopupProps> = ({ 
  open, 
  appName, 
  currentTier,
  targetTier,
  tierData,
  isUpgrade,
  onConfirm, 
  onCancel 
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open || !tierData) return null;

  const actionText = isUpgrade ? 'UPGRADE' : 'DOWNGRADE';
  const costText = isUpgrade ? `Cost: ${tierData.flatCost} Credits` : 'No refund on downgrade';

  return (
    <div className="tier-change-popup-overlay">
      <div className="tier-change-popup">
        <div className="tier-change-title">{actionText} APP?</div>
        <div className="tier-change-app-name">{appName}</div>
        <div className="tier-change-details">
          <div className="tier-change-info">
            Tier {currentTier} → Tier {targetTier}
          </div>
          <div className="tier-change-cost">{costText}</div>
          <div className="tier-change-monthly">
            New Monthly: {tierData.monthlyCost} Credits/LC
          </div>
        </div>
        <div className="tier-change-popup-actions">
          <button ref={confirmRef} className="tier-change-btn confirm" onClick={onConfirm}>
            [{actionText}]
          </button>
          <button className="tier-change-btn cancel" onClick={onCancel}>
            [ABORT]
          </button>
        </div>
        {/* Scanlines overlay must be last to appear on top of all content */}
        <div className="tier-change-popup-scanlines" />
      </div>
    </div>
  );
};

export default TierChangeConfirmPopup; 