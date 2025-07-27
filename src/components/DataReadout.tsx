/**
 * DataReadout Component
 * 
 * Displays key game information in a compact overlay format.
 * Shows credits, job title, work button, and date information based on toggle states.
 * 
 * STATE FLOW ARCHITECTURE:
 * 
 * This component is wrapped inside ToggleProvider, so it MUST get game state through
 * the context rather than calling useGameState() directly. This prevents the "two
 * instances of state" problem where DataReadout and app components show different values.
 * 
 * CORRECT PATTERN:
 * - Get game state (credits, gameTime, gamePhase) via useToggleContext()
 * - Get installedApps via useGameState() (this is safe as it's not game state)
 * - NEVER call useGameState() for credits, gameTime, or gamePhase
 * 
 * This ensures DataReadout stays synchronized with all other components that display
 * the same information (like CreditsAppItem, ChronoTrackAppWindow, etc.).
 */

import React from 'react';
import { useToggleContext } from '../contexts/ToggleContext';
import { useGameState } from '../hooks/useGameState';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import { getJobTitle } from '../utils/gameStateUtils';
import './DataReadout.css';

const DataReadout: React.FC = () => {
  const { toggleStates, gameMode, beginWorkSession, credits, gameTime, gamePhase } = useToggleContext();
  const { installedApps } = useGameState();
  const { annumReckoning, ledgerCycle, grind } = gameTime;

  // Check if ChronoTrack, JobTitle, and Credits are installed
  const isChronoTrackInstalled = installedApps.some(app => app.id === 'chronoTrack');
  const isJobTitleInstalled = installedApps.some(app => app.id === 'jobTitle');
  const isCreditsInstalled = installedApps.some(app => app.id === 'credits');

  return (
    <div className="data-readout">
      <div className="data-readout-content">
        {/* Credits line */}
        {toggleStates.creditsReadoutEnabled && isCreditsInstalled && (
          <div style={{ color: credits < 0 ? '#ff6666' : '#4a4' }}>
            {`₵ ${credits.toLocaleString()}`}
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
        
        {/* JobTitle line */}
        {toggleStates.jobTitleReadoutEnabled && isJobTitleInstalled && (
          <div>
            {`Job: ${getJobTitle(gamePhase)}`}
          </div>
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