import React from 'react';
import ScrApp from '../../ScrAppItem';

interface ScrAppStoreProps {
  hasNewApps?: boolean;
  onAppClick?: () => void;
}

const ScrAppStore: React.FC<ScrAppStoreProps> = ({ hasNewApps = false, onAppClick }) => {
  return (
    <ScrApp>
      <div style={{ position: 'relative' }}>
        <div className="app-label">SCR-App Store</div>
        <div className="app-value">
          {hasNewApps ? 'New Apps Available' : 'No Updates'}
        </div>
      </div>
    </ScrApp>
  );
};

export default ScrAppStore; 