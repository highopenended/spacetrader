import React from 'react';
import { useToggleContext } from '../contexts/ToggleContext';
import { useGameState } from '../hooks/useGameState';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import { getJobTitle } from '../utils/gameStateUtils';
import './DataReadout.css';

const DataReadout: React.FC = () => {
  const { toggleStates, gameMode, beginWorkSession } = useToggleContext();
  const { gameTime, installedApps, gamePhase } = useGameState();
  const { annumReckoning, ledgerCycle, grind } = gameTime;

  // Check if ChronoTrack and JobTitle are installed
  const isChronoTrackInstalled = installedApps.some(app => app.id === 'chronoTrack');
  const isJobTitleInstalled = installedApps.some(app => app.id === 'jobTitle');

  return (
    <div className="data-readout">
      <div className="data-readout-content">
        {/* JobTitle line */}
        {toggleStates.jobTitleReadoutEnabled && isJobTitleInstalled && (
          <div>
            {`Job: ${getJobTitle(gamePhase)}`}
          </div>
        )}
        {/* Work button */}
        {toggleStates.workButtonReadoutEnabled && (
          <button
            className={`work-button ${gameMode === 'workMode' ? 'working' : ''}`}
            onClick={beginWorkSession}
            disabled={gameMode === 'workMode'}
          >
            {gameMode === 'workMode' ? 'WORKING...' : 'WORK?'}
          </button>
        )}
        {/* ChronoTrack date line */}
        {toggleStates.dateReadoutEnabled && isChronoTrackInstalled && (
          <div>
            {`AR-${getAnnumReckoningName(annumReckoning)}|LC-${getLedgerCycleName(ledgerCycle)}|G-${getGrindName(grind)}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataReadout; 