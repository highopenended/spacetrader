import React from 'react';
import ScrApp from '../../ScrAppItem';

/**
 * Terminal list row for the Game Lore app. Window content lives in LoreAppWindow.
 */
const LoreApp: React.FC = () => {
  return (
    <ScrApp>
      <div>
        <div className="app-label">Game Lore</div>
      </div>
    </ScrApp>
  );
};

export default LoreApp;
