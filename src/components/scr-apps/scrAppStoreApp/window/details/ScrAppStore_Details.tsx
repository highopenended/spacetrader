import React from 'react';
import './ScrAppStore_Details.css';
import { APP_REGISTRY } from '../../../../../constants/scrAppListConstants';

interface ScrAppStore_DetailsProps {
  selectedAppId: string | null;
  credits: number;
  installApp: (appId: string) => void;
  onAppInstalled: () => void;
  installedApps?: any[]; // To check if app is already purchased
}

const ScrAppStore_Details: React.FC<ScrAppStore_DetailsProps> = ({
  selectedAppId,
  credits,
  installApp,
  onAppInstalled,
  installedApps = []
}) => {
  // Get selected app details
  const selectedApp = selectedAppId ? APP_REGISTRY[selectedAppId] : null;
  const isPurchased = selectedAppId ? installedApps.some(app => app.id === selectedAppId) : false;
  const purchasePrice = selectedApp?.purchaseCost || 0;
  const canAfford = credits >= purchasePrice;

  const handlePurchase = () => {
    if (selectedAppId && !isPurchased && canAfford) {
      installApp(selectedAppId);
      onAppInstalled();
    }
  };

  // No app selected state
  if (!selectedApp) {
    return (
      <div className="scr-app-store-details">
        <div className="no-selection-message">
          No SCR-App Selected
        </div>
      </div>
    );
  }

  // App selected - show 3-section layout
  return (
    <div className="scr-app-store-details">
      {/* Header Section */}
      <div className="details-header">
        <div className="app-title">{selectedApp.name}</div>
      </div>

      {/* Information Section (Scrollable) */}
      <div className="details-info">
        <div className="info-section">
          <div className="info-label">Description</div>
          <div className="info-value">{selectedApp.description}</div>
        </div>
        
        <div className="info-section">
          <div className="info-label">Cost</div>
          <div className="info-value">₵{purchasePrice.toLocaleString()}</div>
        </div>

        <div className="info-section">
          <div className="info-label">Monthly Maintenance</div>
          <div className="info-value">₵{selectedApp.maintenanceCost || 0}/cycle</div>
        </div>

        {selectedApp.unlockRequirements && (
          <div className="info-section">
            <div className="info-label">Requirements</div>
            <div className="info-value">{selectedApp.unlockRequirements.join(', ')}</div>
          </div>
        )}
      </div>

      {/* Purchase Button Section */}
      <div className="details-purchase">
        {isPurchased ? (
          <div className="purchase-status">Already Purchased</div>
        ) : (
          <>
            <div className="purchase-info">
              <div className="current-credits">Current Credits: ₵{credits.toLocaleString()}</div>
              {!canAfford && (
                <div className="insufficient-credits">Insufficient Credits</div>
              )}
            </div>
            <button 
              className={`purchase-button ${!canAfford ? 'disabled' : ''}`}
              onClick={handlePurchase}
              disabled={!canAfford}
            >
              {purchasePrice === 0 ? 'FREE INSTALL' : `Purchase for ₵${purchasePrice.toLocaleString()}`}
            </button>
            {purchasePrice === 0 && (
              <div className="fine-print">In-App Purchases Available</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScrAppStore_Details; 