import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { GamePhase } from '../../../../types/gameState';
import { GAME_PHASES } from '../../../../constants/gameConstants';

interface JobTitleAppWindowProps extends BaseWindowProps {
  gamePhase: GamePhase;
}

const JobTitleAppWindow: React.FC<JobTitleAppWindowProps> = ({
  gamePhase,
  ...windowProps
}) => {
  const jobTitle = GAME_PHASES[gamePhase].title;

  const content = (
    <div className="window-column-layout window-content-padded">
      <div className="window-row-layout">
        <div className="detail-label">Job Title</div>
        <div className="detail-value">{jobTitle}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Job Title"
      {...windowProps}
      size={{ width: 300, height: 100 }}
      minSize={{ width: 300, height: 100 }}

    >
      {content}
    </ScrAppWindow>
  );
};

export default JobTitleAppWindow; 