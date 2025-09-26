import React from 'react';
import './UpgradeProgressOverlay.css';
import { VisualOverlayProps } from '../types';
import { useUpgradesStore } from '../../../stores';
import { getAppDisplayName_fromID } from '../../../utils/appUtils';

const UpgradeProgressOverlay: React.FC<VisualOverlayProps> = ({ isExiting, animationState }) => {
  const { appUpgradeInProgress, currentUpgradeId, completeUpgrade } = useUpgradesStore();
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState('UPDATING APP');
  const [showOverlay, setShowOverlay] = React.useState(false);

  // Start the upgrade animation when appUpgradeInProgress becomes true
  React.useEffect(() => {
    if (appUpgradeInProgress && currentUpgradeId) {
      setShowOverlay(true);
      setProgress(0);
      
      // Get the app name from the upgrade registry
      const upgradeDef = useUpgradesStore.getState().getDefinition(currentUpgradeId);
      const appName = upgradeDef ? getAppDisplayName_fromID(upgradeDef.appId) : 'APP';
      setStatusText(`UPDATING ${appName}`);
      
      // Animate progress bar
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2; // Smooth progress animation
        });
      }, 30); // 30ms intervals for smooth animation

      // Complete upgrade after animation finishes
      const completeTimer = setTimeout(() => {
        setStatusText('UPGRADE COMPLETE');
        
        // Hide overlay after brief completion message
        setTimeout(() => {
          setShowOverlay(false);
          completeUpgrade();
        }, 800);
      }, 1500); // Total animation duration

      return () => {
        clearInterval(progressInterval);
        clearTimeout(completeTimer);
      };
    }
  }, [appUpgradeInProgress, currentUpgradeId, completeUpgrade]);

  if (!showOverlay) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 4000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Status Text */}
      <div className="upgrade-status-text">
        {statusText}
      </div>
      
      {/* Progress Bar Container */}
      <div className="upgrade-progress-bar-container">
        <div 
          className="upgrade-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Spinning Scrap Icon */}
      <div className="upgrade-scrap-icon">
        <div className="scrap-spinner">⚙</div>
      </div>
    </div>
  );
};

export default UpgradeProgressOverlay;
