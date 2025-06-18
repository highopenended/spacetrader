import React from 'react';
import './JobTitleApp.css';
import ScrApp from '../ScrApp';
import { GamePhase } from '../../../types/gameState';
import { GAME_PHASES } from '../../../constants/gameConstants';

interface JobTitleAppProps {
  gamePhase: GamePhase;
}

const JobTitleApp: React.FC<JobTitleAppProps> = ({ gamePhase }) => {
  const phaseInfo = GAME_PHASES[gamePhase];
  
  return (
    <ScrApp>
      <div className="job-title-tracker">
        <div className="job-title-label">Position</div>
        <div className="job-title-name">{phaseInfo.title}</div>
      </div>
    </ScrApp>
  );
};

export default JobTitleApp; 