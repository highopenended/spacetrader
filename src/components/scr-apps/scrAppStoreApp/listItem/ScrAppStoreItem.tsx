import React from 'react';
import './ScrAppStoreItem.css';
import ScrApp from '../../ScrApp';

interface ScrAppStoreProps {
  hasNewApps?: boolean;
}

const ScrAppStore: React.FC<ScrAppStoreProps> = ({ hasNewApps = false }) => {
  return (
    <ScrApp>
      <div className="scr-app-store">
        <div className="app-label">SCR-App Store</div>
        <div className="app-value store-status">
          {hasNewApps ? 'New Apps Available' : 'No Updates'}
        </div>
        {hasNewApps && <div className="notification-dot"></div>}
      </div>
    </ScrApp>
  );
};

export default ScrAppStore; 