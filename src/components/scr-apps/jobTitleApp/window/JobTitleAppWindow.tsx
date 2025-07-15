import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../ScrAppWindow';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Job Title</div>
        <div className="detail-value">{jobTitle}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Job Title Tracker"
      {...windowProps}
      size={{ width: 300, height: 100 }}
      minSize={{ width: 300, height: 100 }}

    >
      {content}
    </ScrAppWindow>
  );
};

export default JobTitleAppWindow; 