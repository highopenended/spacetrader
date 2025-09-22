import React, { useState } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import ToggleSection from '../../scrAppWindow/ToggleSection';
import UpgradeList from '../../scrAppWindow/UpgradeList';
import { GameTime, GamePhase } from '../../../../types/gameState';
import { getLedgerCycleName, getAnnumReckoningName, getGrindName } from '../../../../utils/gameStateUtils';
import { useToggleStore, useQuickBarStore, useUpgradesStore, useClockStore } from '../../../../stores';
import { QUICKBAR_CONFIG } from '../../../../constants/quickBarConstants';

interface ChronoTrackAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
  gamePhase: GamePhase;
}

const ChronoTrackAppWindow: React.FC<ChronoTrackAppWindowProps> = ({
  gameTime,
  gamePhase,
  appType,
  ...windowProps
}) => {
  const { annumReckoning, ledgerCycle, grind, age, yearOfDeath } = gameTime;
  const yearOfBirth = annumReckoning - age;
  
  // Get toggle state directly from Zustand store
  const toggleStates = useToggleStore(state => state.toggleStates);
  const setToggleState = useToggleStore(state => state.setToggleState);
  const [dateReadoutEnabled, setDateReadoutEnabled] = useState(toggleStates.readoutEnabled_Date);

  // Time control functionality
  const quickBarFlags = useQuickBarStore(state => state.quickBarFlags);
  const setQuickBarFlag = useQuickBarStore(state => state.setQuickBarFlag);
  const isTimeControlEnabled = quickBarFlags.isActiveTimeControl;
  const keyLetter = QUICKBAR_CONFIG.chronoTrack.shortcutKey;

  // Clock store integration for time scaling
  const setTimeScale = useClockStore(state => state.setTimeScale);

  const toggleTimeControl = () => {
    const newState = !isTimeControlEnabled;
    setQuickBarFlag('isActiveTimeControl', newState);
    // Set time scale: 0.5x when active, 1.0x when inactive
    setTimeScale(newState ? 0.5 : 1.0);
  };

  // Get upgrades directly from upgradesStore
  const getUpgradesForApp = useUpgradesStore(state => state.getUpgradesForApp);
  const isPurchased = useUpgradesStore(state => state.isPurchased);
  const canPurchase = useUpgradesStore(state => state.canPurchase);
  const purchase = useUpgradesStore(state => state.purchase);
  const refund = useUpgradesStore(state => state.refund);
  
  // Call the function outside the selector to avoid infinite re-renders
  const upgradesForApp = React.useMemo(() => getUpgradesForApp(appType), [getUpgradesForApp, appType]);

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
      appType={appType}
      {...windowProps}
    >
      <div className="window-content-padded">
        <div className="window-column-layout" style={{ gap: '4px' }}>
          <ToggleSection toggleConfig={toggleConfig} />
          
          {/* Time Control Section */}
          <div
            className="detail-label"
            style={{
              textAlign: 'center',
              color: isTimeControlEnabled ? '#9f9' : undefined,
              textShadow: isTimeControlEnabled ? '0 0 6px rgba(144,255,144,0.6)' : undefined,
              fontWeight: isTimeControlEnabled ? 600 : undefined
            }}
          >
            {isTimeControlEnabled ? 'SLOW TIME ACTIVE' : 'TIME CONTROL OFFLINE'}
          </div>
          <div
            onClick={toggleTimeControl}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTimeControl(); } }}
            aria-pressed={isTimeControlEnabled}
            title={isTimeControlEnabled ? 'Disable Time Control' : 'Enable Time Control'}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          >
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              role="img"
              aria-label={`Keyboard keycap: ${keyLetter} (${isTimeControlEnabled ? 'enabled' : 'disabled'})`}
            >
              <rect x="10" y="10" width="120" height="120" rx="14" ry="14"
                fill="#141414" stroke={isTimeControlEnabled ? '#4a4' : '#555'} strokeWidth="2" />
              <rect x="18" y="18" width="104" height="104" rx="10" ry="10"
                fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1" />
              <path d="M20 28 Q70 14 120 28" fill="none" stroke="#2f2f2f" strokeWidth="2" opacity="0.6" />
              <text x="70" y="92" textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                fontSize="64"
                fill={isTimeControlEnabled ? '#9f9' : '#aaa'}
                letterSpacing="2"
              >
                {keyLetter}
              </text>
            </svg>
          </div>

          {/* Upgrades Section */}
          <div style={{ marginTop: 8 }}>
            <UpgradeList
              upgrades={upgradesForApp}
              isPurchased={isPurchased}
              canPurchase={canPurchase}
              purchase={purchase}
              refund={refund}
            />
          </div>
          
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