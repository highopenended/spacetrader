import React from 'react';
import './JobTitleAppItem.css';
import ScrApp from '../../ScrAppItem';
import { GamePhase } from '../../../../types/gameState';

interface JobTitleAppProps {
  gamePhase: GamePhase;
}

const JobTitleApp: React.FC<JobTitleAppProps> = ({ gamePhase }) => {
  return (
    <ScrApp>
      <div>
        <div className="app-label">Job Title</div>
      </div>
    </ScrApp>
  );
};

export default JobTitleApp; 