import React from 'react';
import './ScrAppStore.css';
import ScrApp from '../ScrApp';

interface ScrAppStoreProps {
  hasNewApps?: boolean;
}

const ScrAppStore: React.FC<ScrAppStoreProps> = ({ hasNewApps = false }) => {
  return (
    <ScrApp>
      <div className="scr-app-store">
        <div className="store-content">
          <div className="cargo-icon">▦</div>
          <div className="store-name">SCRAPP STORE</div>
          <div className={`alert-indicator ${hasNewApps ? 'active' : ''}`}></div>
        </div>
      </div>
    </ScrApp>
  );
};

export default ScrAppStore; 