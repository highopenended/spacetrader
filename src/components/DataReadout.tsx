import React from 'react';
import { useToggleContext } from '../contexts/ToggleContext';
import { GameTime } from '../types/gameState';
import { getAnnumReckoningName, getLedgerCycleName, getGrindName } from '../utils/gameStateUtils';
import './DataReadout.css';

interface DataReadoutProps {
  gameTime: GameTime;
}

const DataReadout: React.FC<DataReadoutProps> = ({ gameTime }) => {
  const { toggleStates } = useToggleContext();
  const { annumReckoning, ledgerCycle, grind } = gameTime;

  // Only render if there's something to show
  if (!toggleStates.dateReadoutEnabled) {
    return null;
  }

  const dateString = `AR-${getAnnumReckoningName(annumReckoning)} • LC-${getLedgerCycleName(ledgerCycle)} • G-${getGrindName(grind)}`;

  return (
    <div className="data-readout">
      <div className="data-readout-text">{dateString}</div>
    </div>
  );
};

export default DataReadout; 