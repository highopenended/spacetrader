/**
 * DataReadout Component
 * 
 * Displays key game information in a compact overlay format.
 * Shows credits, job title, work button, and date information based on toggle states.
 * 
 * STATE FLOW ARCHITECTURE:
 * 
 * This component receives game data via props from App.tsx and accesses
 * toggle state directly from Zustand store for optimal performance.
 * 
 * CORRECT PATTERN:
 * - Get game data via props from App.tsx
 * - Get toggle state directly from useToggleStore (selective subscription)
 * - This ensures DataReadout stays synchronized with all other components
 */

import React from 'react';
import { useToggleStore } from '../stores';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import { getJobTitle } from '../utils/gameStateUtils';
import { GameTime, GamePhase, GameMode } from '../types/gameState';
import { InstalledApp } from '../types/appListState';
import './DataReadout.css';

interface DataReadoutProps {
  gameMode: GameMode;
  beginWorkSession: () => void;
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  installedApps: InstalledApp[];
}

const DataReadout: React.FC<DataReadoutProps> = ({
  gameMode,
  beginWorkSession,
  credits,
  gameTime,
  gamePhase,
  installedApps
}) => {
  // Get toggle states directly from Zustand store
  const toggleStates = useToggleStore(state => state.toggleStates);
  const { annumReckoning, ledgerCycle, grind } = gameTime;

  // Check if ChronoTrack, JobTitle, and Credits are installed
  const isChronoTrackInstalled = installedApps.some(app => app.id === 'chronoTrack');
  const isJobTitleInstalled = installedApps.some(app => app.id === 'jobTitle');
  const isCreditsInstalled = installedApps.some(app => app.id === 'credits');

  return (
    <div className="data-readout">
      <div className="data-readout-content">
        {/* Credits line */}
        {toggleStates.readoutEnabled_Credits && isCreditsInstalled && (
          <div style={{ color: credits < 0 ? '#ff6666' : '#4a4' }}>
            {`₵ ${credits.toLocaleString()}`}
          </div>
        )}
        {/* Work button */}
        {toggleStates.readoutEnabled_WorkButton && (
          <button
            className={`work-button ${gameMode === 'workMode' ? 'working' : ''}`}
            onClick={beginWorkSession}
            disabled={gameMode === 'workMode'}
          >
            {gameMode === 'workMode' ? 'WORKING...' : 'WORK?'}
          </button>
        )}
        {/* JobTitle line */}
        {toggleStates.readoutEnabled_JobTitle && isJobTitleInstalled && (
          <div>
            {`Job: ${getJobTitle(gamePhase)}`}
          </div>
        )}
        
        {/* ChronoTrack date line */}
        {toggleStates.readoutEnabled_Date && isChronoTrackInstalled && (
          <div>
            {`AR-${getAnnumReckoningName(annumReckoning)}|LC-${getLedgerCycleName(ledgerCycle)}|G-${getGrindName(grind)}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataReadout; 