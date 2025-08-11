import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { APP_REGISTRY } from '../../../../constants/scrAppListConstants';
import { ToggleStates } from '../../../../types/toggleState';

interface DumpsterVisionAppWindowProps extends BaseWindowProps {}

const DumpsterVisionAppWindow: React.FC<DumpsterVisionAppWindowProps> = ({
  toggleStates,
  setToggleState,
  appType,
  ...windowProps
}) => {
  const toggleKey = APP_REGISTRY[appType]?.quickToggleStateKey as keyof ToggleStates | undefined;
  const isEnabled = toggleKey ? Boolean(toggleStates?.[toggleKey]) : true;
  const keyLetter = APP_REGISTRY[appType]?.shortcutKey || 'X';

  const toggleEnabled = () => {
    if (!toggleKey) return;
    setToggleState?.(toggleKey, !isEnabled);
  };

  return (
    <ScrAppWindow
      title="Dumpster Vision"
      appType={appType}
      {...windowProps}
    >
      <div className="window-content-padded">
        <div className="window-column-layout" style={{ gap: '4px' }}>
          <div
            className="detail-label"
            style={{
              textAlign: 'center',
              color: isEnabled ? '#9f9' : undefined,
              textShadow: isEnabled ? '0 0 6px rgba(144,255,144,0.6)' : undefined,
              fontWeight: isEnabled ? 600 : undefined
            }}
          >
            {isEnabled ? 'ACTIVE' : 'OFFLINE'}
          </div>
          <div
            onClick={toggleEnabled}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEnabled(); } }}
            aria-pressed={isEnabled}
            title={isEnabled ? 'Disable Dumpster Vision' : 'Enable Dumpster Vision'}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          >
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              role="img"
              aria-label={`Keyboard keycap: ${keyLetter} (${isEnabled ? 'enabled' : 'disabled'})`}
            >
              <rect x="10" y="10" width="120" height="120" rx="14" ry="14"
                fill="#141414" stroke={isEnabled ? '#4a4' : '#555'} strokeWidth="2" />
              <rect x="18" y="18" width="104" height="104" rx="10" ry="10"
                fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1" />
              <path d="M20 28 Q70 14 120 28" fill="none" stroke="#2f2f2f" strokeWidth="2" opacity="0.6" />
              <text x="70" y="92" textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                fontSize="64"
                fill={isEnabled ? '#9f9' : '#aaa'}
                letterSpacing="2"
              >
                {keyLetter}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </ScrAppWindow>
  );
};

export default DumpsterVisionAppWindow;


