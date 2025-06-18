import React from 'react';
import './ScrAppStore.css';
import ScrApp from '../ScrApp';

interface ScrAppStoreProps {
  hasNewApps?: boolean;
  onAppClick?: () => void;
}

const ScrAppStore: React.FC<ScrAppStoreProps> = ({ hasNewApps = false, onAppClick }) => {
  return (
    <ScrApp onClick={onAppClick}>
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