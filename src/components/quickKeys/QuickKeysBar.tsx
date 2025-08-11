import React from 'react';
import { ToggleStates } from '../../types/toggleState';
import { InstalledApp } from '../../types/scrAppListState';
import { APP_REGISTRY } from '../../constants/scrAppListConstants';

interface QuickKeysBarProps {
  toggleStates: ToggleStates;
  installedApps: InstalledApp[];
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;
}

const Keycap: React.FC<{ label: string; letter: string; glow?: boolean; onClick?: () => void }> = ({ label, letter, glow = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 140 140"
        role="img"
        aria-label={`Keyboard keycap: ${letter}`}
      >
        <rect x="10" y="10" width="120" height="120" rx="14" ry="14"
          fill="#141414" stroke={glow ? '#4a4' : '#555'} strokeWidth="2" />
        <rect x="18" y="18" width="104" height="104" rx="10" ry="10"
          fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1" />
        <path d="M20 28 Q70 14 120 28" fill="none" stroke="#2f2f2f" strokeWidth="2" opacity="0.6" />
        <text x="70" y="92" textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          fontSize="64"
          fill={glow ? '#9f9' : '#aaa'}
          letterSpacing="2"
        >
          {letter}
        </text>
      </svg>
      <div
        className="detail-label"
        style={{ marginTop: 2, color: '#ccc', textShadow: '0 0 2px #333832, 0 0 6px #333832' }}
      >
        {label}
      </div>
    </div>
  );
};

const QuickKeysBar: React.FC<QuickKeysBarProps> = ({ toggleStates, installedApps, setToggleState }) => {
  // Build quick items from registry metadata (always show when installed + configured)
  const quickItems = installedApps
    .map(app => APP_REGISTRY[app.id])
    .filter((def): def is NonNullable<typeof def> => Boolean(def))
    .filter(def => def.showInQuickBar && Boolean(def.shortcutKey))
    .map(def => ({
      id: def.id,
      keyLetter: def.shortcutKey as string,
      label: def.quickKeyLabel || def.name,
      toggleKey: def.quickToggleStateKey
    }));

  if (quickItems.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '4px 8px',
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(45, 45, 45, 0.9) 100%)',
          border: '1px solid #444',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          backdropFilter: 'blur(2px)'
        }}
      >
        {quickItems.map(item => {
          const isOn = item.toggleKey ? Boolean(toggleStates[item.toggleKey]) : true;
          const handleClick = item.toggleKey
            ? () => setToggleState(item.toggleKey!, !isOn)
            : undefined;
          return (
            <Keycap
              key={item.id}
              label={item.label}
              letter={item.keyLetter}
              glow={isOn}
              onClick={handleClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default QuickKeysBar;


