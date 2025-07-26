import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ToggleSection from '../../scrAppWindow/ToggleSection';
import { useToggleContext } from '../../../../contexts/ToggleContext';
import { GameTime, GamePhase } from '../../../../types/gameState';
import { getTitheName, getLedgerCycleName, getAnnumReckoningName, getGrindName } from '../../../../utils/gameStateUtils';

interface ChronoTrackAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
  gamePhase: GamePhase;
}

const ChronoTrackAppWindow: React.FC<ChronoTrackAppWindowProps> = ({
  gameTime,
  gamePhase,
  ...windowProps
}) => {
  const { annumReckoning, ledgerCycle, grind, tithe, age, yearOfDeath } = gameTime;
  const yearOfBirth = annumReckoning - age;
  const { toggleStates, updateToggle } = useToggleContext();

  const toggleDateReadout = () => {
    updateToggle('dateReadoutEnabled', !toggleStates.dateReadoutEnabled);
  };

  const toggleConfig = [
    {
      id: 'dateReadout',
      label: 'Date Readout',
      enabled: toggleStates.dateReadoutEnabled,
      onToggle: toggleDateReadout,
      title: toggleStates.dateReadoutEnabled ? 'Disable Date Readout' : 'Enable Date Readout'
    }
  ];

  return (
    <ScrAppWindow
      title="Chrono Track"
      {...windowProps}
      minSize={{ width: 200, height: 100 }}
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