import React from 'react';

interface ToggleConfig {
  id: string;
  label: string;
  enabled: boolean;
  onToggle: () => void;
  title?: string;
}

interface ToggleSectionProps {
  toggleConfig: ToggleConfig[];
  showDivider?: boolean;
}

const ToggleSection: React.FC<ToggleSectionProps> = ({ toggleConfig, showDivider = true }) => {
  return (
    <>
      {toggleConfig.map((toggle) => (
        <div key={toggle.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div 
            className={`chrono-toggle ${toggle.enabled ? 'enabled' : 'disabled'}`}
            onClick={toggle.onToggle}
            title={toggle.title || (toggle.enabled ? `Disable ${toggle.label}` : `Enable ${toggle.label}`)}
          >
            <div className="toggle-slider"></div>
          </div>
          <div className="detail-label">{toggle.label}</div>
        </div>
      ))}
      {showDivider && <div className="chrono-divider"></div>}
    </>
  );
};

export default ToggleSection; 