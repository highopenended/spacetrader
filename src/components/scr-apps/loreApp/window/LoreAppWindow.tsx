import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';

interface LoreAppWindowProps extends BaseWindowProps {}

/**
 * Game Lore window shell. Wire in `src/gameLore` readouts when ready.
 */
const LoreAppWindow: React.FC<LoreAppWindowProps> = ({ ...windowProps }) => {
  return (
    <ScrAppWindow title="Game Lore" {...windowProps}>
      <div className="window-content-padded">
        <div className="window-column-layout" style={{ gap: 'var(--spacing-sm)' }}>
          <div className="window-row-layout">
            <div className="detail-label">Status</div>
            <div className="detail-value">Skeleton. Lore UI goes here.</div>
          </div>
        </div>
      </div>
    </ScrAppWindow>
  );
};

export default LoreAppWindow;
