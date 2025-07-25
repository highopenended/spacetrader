import React from 'react';
import { useDroppable, UniqueIdentifier } from '@dnd-kit/core';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import './PurgeZoneAppWindow.css';

interface PurgeZoneAppWindowProps extends BaseWindowProps {
  overId?: UniqueIdentifier | null;
}

const PurgeZoneAppWindow: React.FC<PurgeZoneAppWindowProps> = ({
  overId,
  ...windowProps
}) => {
  const { setNodeRef } = useDroppable({
    id: 'purge-zone-window',
  });

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
      minSize={{ width: 100, height: 100 }}
    >
      {content}
    </ScrAppWindow>
  );
};

export default PurgeZoneAppWindow; 