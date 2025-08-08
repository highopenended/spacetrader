import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { useDragContext } from '../../../../contexts/DragContext';
import './PurgeZoneAppWindow.css';

const PurgeZoneAppWindow: React.FC<BaseWindowProps> = ({
  ...windowProps
}) => {
  const { setNodeRef } = useDroppable({
    id: 'purge-zone-window',
  });

  const { overId } = useDragContext();
  const isActive = overId === 'purge-zone-window';

  const content = (
    <div className="purge-zone-content window-column-layout">
      <div
        ref={setNodeRef}
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