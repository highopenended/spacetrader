import React, { useState } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ToggleSection from '../../scrAppWindow/ToggleSection';
import { GameTime, GamePhase } from '../../../../types/gameState';
import { getLedgerCycleName, getAnnumReckoningName, getGrindName } from '../../../../utils/gameStateUtils';
import { useToggleStore } from '../../../../stores';

interface ChronoTrackAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
  gamePhase: GamePhase;
}

const ChronoTrackAppWindow: React.FC<ChronoTrackAppWindowProps> = ({
  gameTime,
  gamePhase,
  ...windowProps
}) => {
  const { annumReckoning, ledgerCycle, grind, age, yearOfDeath } = gameTime;
  const yearOfBirth = annumReckoning - age;
  
  // Get toggle state directly from Zustand store
  const toggleStates = useToggleStore(state => state.toggleStates);
  const setToggleState = useToggleStore(state => state.setToggleState);
  const [dateReadoutEnabled, setDateReadoutEnabled] = useState(toggleStates.readoutEnabled_Date);

  const toggleDateReadout = () => {
    const newState = !dateReadoutEnabled;
    setDateReadoutEnabled(newState);
    setToggleState('readoutEnabled_Date', newState);
  };

  const toggleConfig = [
    {
      id: 'dateReadout',
      label: 'Date Readout',
      enabled: dateReadoutEnabled,
      onToggle: toggleDateReadout,
      title: dateReadoutEnabled ? 'Disable Date Readout' : 'Enable Date Readout'
    }
  ];

  return (
    <ScrAppWindow
      title="Chrono Track"
      {...windowProps}
    >
      <div className="window-content-padded">
        <div className="window-column-layout">
          <ToggleSection toggleConfig={toggleConfig} />
          
          {/* Date Section */}
          <div className="window-row-layout">
            <div className="detail-label">Current Date</div>
            <div className="detail-value">
              AR-{getAnnumReckoningName(annumReckoning)} • LC-{getLedgerCycleName(ledgerCycle)} • G-{getGrindName(grind)}
            </div>
          </div>
          
          {/* Age Section */}
          <div className="window-row-layout">
            <div className="detail-label">Current Age</div>
            <div className="detail-value">{age} Reckonings</div>
          </div>
          <div className="window-row-layout">
            <div className="detail-label">Date of Birth</div>
            <div className="detail-value">AR {yearOfBirth}</div>
          </div>
          <div className="window-row-layout">
            <div className="detail-label">Date of Death</div>
            <div className="detail-value">
              {yearOfDeath ? `AR ${yearOfDeath}` : 'Not Yet Assigned'}
            </div>
          </div>
        </div>
      </div>
    </ScrAppWindow>
  );
};

export default ChronoTrackAppWindow; 