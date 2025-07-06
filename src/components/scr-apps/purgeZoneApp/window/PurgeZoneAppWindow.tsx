import React from 'react';
import { useDroppable, UniqueIdentifier } from '@dnd-kit/core';
import ScrAppWindow, { BaseWindowProps } from '../../ScrAppWindow';
import './PurgeZoneAppWindow.css';

interface PurgeZoneAppWindowProps extends BaseWindowProps {
  overId?: UniqueIdentifier | null;
  onCloseWindow?: (windowId: string) => void;
  onUpdateWindowPosition?: (appType: string, position: { x: number; y: number }) => void;
  onUpdateWindowSize?: (appType: string, size: { width: number; height: number }) => void;
}

const PurgeZoneAppWindow: React.FC<PurgeZoneAppWindowProps> = ({
  overId,
  onCloseWindow,
  onUpdateWindowPosition,
  onUpdateWindowSize,
  ...windowProps
}) => {
  const { setNodeRef } = useDroppable({
    id: 'purge-zone-window',
  });

  const isActive = overId === 'purge-zone-window';

  // Create callback handlers that match the expected interface
  const handleClose = () => {
    if (onCloseWindow && windowProps.windowId) {
      onCloseWindow(windowProps.windowId);
    }
  };

  const handlePositionChange = (position: { x: number; y: number }) => {
    if (onUpdateWindowPosition && windowProps.appType) {
      onUpdateWindowPosition(windowProps.appType, position);
    }
  };

  const handleSizeChange = (size: { width: number; height: number }) => {
    if (onUpdateWindowSize && windowProps.appType) {
      onUpdateWindowSize(windowProps.appType, size);
    }
  };

  const content = (
    <div className="purge-zone-content">
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
      onClose={handleClose}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      minSize={{ width: 100, height: 100 }}
    >
      {content}
    </ScrAppWindow>
  );
};

export default PurgeZoneAppWindow; 