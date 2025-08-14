import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { useDragContext } from '../../../../contexts/DragContext';
import './PurgeZoneAppWindow.css';
import { DOM_IDS } from '../../../../constants/domIds';

const PurgeZoneAppWindow: React.FC<BaseWindowProps> = ({
  ...windowProps
}) => {
  const { setNodeRef } = useDroppable({
    id: DOM_IDS.PURGE_ZONE,
  });

  const { overId } = useDragContext();
  const isActive = overId === DOM_IDS.PURGE_ZONE;

  const content = (
    <div className="purge-zone-content window-column-layout">
      <div
        ref={setNodeRef}
        id={DOM_IDS.PURGE_ZONE}
        className={`purge-zone-drop-area${isActive ? ' active' : ''}`}
      >
        <div className="purge-zone-text">
          {isActive ? 'PURGE?' : 'DROP TO PURGE'}
        </div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Purge Zone"
      {...windowProps}
    >
      {content}
    </ScrAppWindow>
  );
};

export default PurgeZoneAppWindow; 