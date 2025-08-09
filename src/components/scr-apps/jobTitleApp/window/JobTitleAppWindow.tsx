import React, { useState } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ToggleSection from '../../scrAppWindow/ToggleSection';
import { GamePhase, GameMode } from '../../../../types/gameState';
import { GAME_PHASES } from '../../../../constants/gameConstants';
import './JobTitleAppWindow.css';

interface JobTitleAppWindowProps extends BaseWindowProps {
  gamePhase: GamePhase;
  gameMode: GameMode;
  beginWorkSession: () => void;
}

const JobTitleAppWindow: React.FC<JobTitleAppWindowProps> = ({
  gamePhase,
  gameMode,
  beginWorkSession,
  toggleStates,
  setToggleState,
  ...windowProps
}) => {
  const jobTitle = GAME_PHASES[gamePhase].title;
  const [jobTitleReadoutEnabled, setJobTitleReadoutEnabled] = useState(toggleStates.readoutEnabled_JobTitle);
  const [workButtonReadoutEnabled, setWorkButtonReadoutEnabled] = useState(toggleStates.readoutEnabled_WorkButton);

  const toggleJobTitleReadout = () => {
    const newState = !jobTitleReadoutEnabled;
    setJobTitleReadoutEnabled(newState);
    setToggleState?.('readoutEnabled_JobTitle', newState);
  };

  const toggleWorkButtonReadout = () => {
    const newState = !workButtonReadoutEnabled;
    setWorkButtonReadoutEnabled(newState);
    setToggleState?.('readoutEnabled_WorkButton', newState);
  };

  const toggleConfig = [
    {
      id: 'jobTitleReadout',
      label: 'Job Title Readout',
      enabled: jobTitleReadoutEnabled,
      onToggle: toggleJobTitleReadout,
      title: jobTitleReadoutEnabled ? 'Disable Job Title Readout' : 'Enable Job Title Readout'
    },
    {
      id: 'workButtonReadout',
      label: 'Work Button Readout',
      enabled: workButtonReadoutEnabled,
      onToggle: toggleWorkButtonReadout,
      title: workButtonReadoutEnabled ? 'Disable Work Button Readout' : 'Enable Work Button Readout'
    }
  ];

  const content = (
    <div className="window-column-layout window-content-padded">
      <ToggleSection toggleConfig={toggleConfig} />
      <div className="window-row-layout">
        <div className="detail-label">Job Title</div>
        <div className="detail-value">{jobTitle}</div>
      </div>
      <div className="window-row-layout">
        <button
          className={`work-button ${gameMode === 'workMode' ? 'working' : ''}`}
          onClick={beginWorkSession}
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
    >
      {content}
    </ScrAppWindow>
  );
};

export default JobTitleAppWindow; 