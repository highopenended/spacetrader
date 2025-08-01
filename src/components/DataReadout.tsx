/**
 * DataReadout Component
 * 
 * Displays key game information in a compact overlay format.
 * Shows credits, job title, work button, and date information based on toggle states.
 * 
 * STATE FLOW ARCHITECTURE:
 * 
 * This component receives all data via props from App.tsx to ensure
 * single source of truth and prevent state synchronization issues.
 * 
 * CORRECT PATTERN:
 * - Get all data via props from App.tsx
 * - NEVER call useGameState() or useToggleContext() directly
 * - This ensures DataReadout stays synchronized with all other components
 */

import React from 'react';
import { ToggleStates } from '../types/toggleState';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import { getJobTitle } from '../utils/gameStateUtils';
import { GameTime, GamePhase, GameMode } from '../types/gameState';
import { InstalledApp } from '../types/scrAppListState';
import './DataReadout.css';

interface DataReadoutProps {
  toggleStates: ToggleStates;
  gameMode: GameMode;
  beginWorkSession: () => void;
  credits: number;
  gameTime: GameTime;
  gamePhase: GamePhase;
  installedApps: InstalledApp[];
}

const DataReadout: React.FC<DataReadoutProps> = ({
  toggleStates,
  gameMode,
  beginWorkSession,
  credits,
  gameTime,
  gamePhase,
  installedApps
}) => {
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