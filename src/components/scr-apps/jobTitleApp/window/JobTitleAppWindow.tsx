import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { GamePhase, GameMode } from '../../../../types/gameState';
import { GAME_PHASES } from '../../../../constants/gameConstants';
import './JobTitleAppWindow.css';

interface JobTitleAppWindowProps extends BaseWindowProps {
  gamePhase: GamePhase;
  gameMode: GameMode;
  onBeginWorkSession: () => void;
}

const JobTitleAppWindow: React.FC<JobTitleAppWindowProps> = ({
  gamePhase,
  gameMode,
  onBeginWorkSession,
  ...windowProps
}) => {
  const jobTitle = GAME_PHASES[gamePhase].title;

  const content = (
    <div className="window-column-layout window-content-padded">
      <div className="window-row-layout">
        <div className="detail-label">Job Title</div>
        <div className="detail-value">{jobTitle}</div>
      </div>
      <div className="window-row-layout">
        <button
          className={`work-button ${gameMode === 'workMode' ? 'working' : ''}`}
          onClick={onBeginWorkSession}
          disabled={gameMode === 'workMode'}
        >
          {gameMode === 'workMode' ? 'WORKING...' : 'WORK?'}
        </button>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Job Title"
      {...windowProps}
      size={{ width: 300, height: 150 }}
      minSize={{ width: 300, height: 150 }}
    >
      {content}
    </ScrAppWindow>
  );
};

export default JobTitleAppWindow; 