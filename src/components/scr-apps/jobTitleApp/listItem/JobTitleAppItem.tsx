import React from 'react';
import './JobTitleAppItem.css';
import ScrApp from '../../ScrAppItem';
import { GamePhase } from '../../../../types/gameState';

interface JobTitleAppProps {
  gamePhase: GamePhase;
}

const JobTitleApp: React.FC<JobTitleAppProps> = ({ gamePhase }) => {
  const getJobTitle = () => {
    switch (gamePhase) {
      case 'lineRat':
        return 'Line Rat';
      case 'bayBoss':
        return 'Bay Boss';
      case 'scrapCaptain':
        return 'Scrap Captain';
      case 'fleetBoss':
        return 'Fleet Boss';
      case 'subsectorWarden':
        return 'Subsector Warden';
      case 'sectorCommodore':
        return 'Sector Commodore';
      case 'ledgerPatrician':
        return 'Ledger Patrician';
      case 'cathedraMinor':
        return 'Cathedra Minor';
      case 'cathedraDominus':
        return 'Cathedra Dominus';
      case 'cathedraUltima':
        return 'Cathedra Ultima';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScrApp>
      <div className="job-title-tracker">
        <div className="app-label">Job Title</div>
        <div className="app-value job-title">{getJobTitle()}</div>
      </div>
    </ScrApp>
  );
};

export default JobTitleApp; 