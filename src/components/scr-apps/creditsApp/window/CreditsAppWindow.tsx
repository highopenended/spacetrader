import React, { useState } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ToggleSection from '../../scrAppWindow/ToggleSection';
import './CreditsAppWindow.css';

interface CreditsAppWindowProps extends BaseWindowProps {
  credits: number;
}

const CreditsAppWindow: React.FC<CreditsAppWindowProps> = ({
  credits,
  toggleStates,
  setToggleState,
  ...windowProps
}) => {
  const [creditsReadoutEnabled, setCreditsReadoutEnabled] = useState(toggleStates.creditsReadoutEnabled || false);

  const toggleCreditsReadout = () => {
    const newState = !creditsReadoutEnabled;
    setCreditsReadoutEnabled(newState);
    setToggleState?.('creditsReadoutEnabled', newState);
  };

  const toggleConfig = [
    {
      id: 'creditsReadout',
      label: 'Credits Readout',
      enabled: creditsReadoutEnabled,
      onToggle: toggleCreditsReadout,
      title: creditsReadoutEnabled ? 'Disable Credits Readout' : 'Enable Credits Readout'
    }
  ];

  const content = (
    <div className="window-column-layout window-content-padded">
      <ToggleSection toggleConfig={toggleConfig} />
      <div className="window-row-layout">
        <div className="detail-label">Credits</div>
        <div className="detail-value">₵ {credits.toLocaleString()}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Credits"
      {...windowProps}
      minSize={{ width: 300, height: 150 }}
    >
      {content}
    </ScrAppWindow>
  );
};

export default CreditsAppWindow; 