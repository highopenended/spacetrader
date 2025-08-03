import React, { useState } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ScrAppStore_List from './list/ScrAppStore_List';
import ScrAppStore_Details from './details/ScrAppStore_Details';
import { GamePhase } from '../../../../types/gameState';
import './ScrAppStoreAppWindow.css';

interface ScrAppStoreAppWindowProps extends BaseWindowProps {
  credits: number;
  gamePhase: GamePhase;
  getAvailableApps: () => any[];
  installedApps: any[];
  installApp: (appId: string) => void;
}

const ScrAppStoreAppWindow: React.FC<ScrAppStoreAppWindowProps> = ({
  credits,
  gamePhase,
  getAvailableApps,
  installedApps,
  installApp,
  ...windowProps
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  return (
    <ScrAppWindow
      title="SCR-App Store"
      {...windowProps}
    >
      <div className="scr-app-store-window-content">
        {/* Left Half: App List */}
        <div className="scr-app-store-window-half">
          <ScrAppStore_List 
            credits={credits}
            gamePhase={gamePhase}
            getAvailableApps={getAvailableApps}
            installedApps={installedApps}
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
          />
        </div>
        
        {/* Right Half: App Details */}
        <div className="scr-app-store-window-half">
          <ScrAppStore_Details 
            selectedAppId={selectedAppId}
            credits={credits}
            installApp={installApp}
            onAppInstalled={() => setSelectedAppId(null)}
            installedApps={installedApps}
          />
        </div>
      </div>
    </ScrAppWindow>
  );
};

export default ScrAppStoreAppWindow; 