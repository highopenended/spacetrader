import React from 'react';
import ScrApp from '../../ScrAppItem';

interface ChronoTrackAppProps {
  // No props needed for barebones version
}

const ChronoTrackApp: React.FC<ChronoTrackAppProps> = () => {
  return (
    <ScrApp>
      <div>
        <div className="app-label">Chrono Track</div>
      </div>
    </ScrApp>
  );
};

export default ChronoTrackApp; 