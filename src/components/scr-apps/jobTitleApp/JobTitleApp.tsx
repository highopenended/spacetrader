import React from 'react';
import './JobTitleApp.css';
import { GamePhase } from '../../../types/gameState';
import { GAME_PHASES } from '../../../constants/gameConstants';

interface JobTitleAppProps {
  gamePhase: GamePhase;
}

const JobTitleApp: React.FC<JobTitleAppProps> = ({ gamePhase }) => {
  const phaseInfo = GAME_PHASES[gamePhase];
  
  return (
    <div className="job-title-tracker">
      <div className="job-title-label">Position</div>
      <div className="job-title-name">{phaseInfo.title}</div>
    </div>
  );
};

export default JobTitleApp; 