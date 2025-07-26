import React from 'react';
import { useToggleContext } from '../contexts/ToggleContext';
import { useGameState } from '../hooks/useGameState';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import './DataReadout.css';

const DataReadout: React.FC = () => {
  const { toggleStates } = useToggleContext();
  const { gameTime, installedApps } = useGameState();
  const { annumReckoning, ledgerCycle, grind } = gameTime;

  // Check if ChronoTrack is installed AND toggle is enabled
  const isChronoTrackInstalled = installedApps.some(app => app.id === 'chronoTrack');
  const shouldShowDateReadout = toggleStates.dateReadoutEnabled && isChronoTrackInstalled;

  // Only render if both conditions are met
  if (!shouldShowDateReadout) {
    return null;
  }

  const dateString = `AR-${getAnnumReckoningName(annumReckoning)} • LC-${getLedgerCycleName(ledgerCycle)} • G-${getGrindName(grind)}`;

  return (
    <div className="data-readout">
      <div className="data-readout-content">
        {dateString}
      </div>
    </div>
  );
};

export default DataReadout; 