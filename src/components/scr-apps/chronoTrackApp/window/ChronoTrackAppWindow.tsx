import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';

interface ChronoTrackAppWindowProps extends BaseWindowProps {
  // No additional props needed for barebones version
}

const ChronoTrackAppWindow: React.FC<ChronoTrackAppWindowProps> = ({
  ...windowProps
}) => {
  return (
    <ScrAppWindow
      title="Chrono Track"
      {...windowProps}
      minSize={{ width: 200, height: 100 }}
    >
      <div className="window-content-padded">
        <div className="window-column-layout">
          <div className="window-row-layout">
            <div className="detail-label">Status</div>
            <div className="detail-value">Active</div>
          </div>
        </div>
      </div>
    </ScrAppWindow>
  );
};

export default ChronoTrackAppWindow; 