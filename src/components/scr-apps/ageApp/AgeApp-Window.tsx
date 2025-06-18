import React from 'react';
import './AgeApp-Window.css';
import ScrAppWindow from '../ScrApp-Window';
import { GameTime } from '../../../types/gameState';

interface AgeAppWindowProps {
  gameTime: GameTime;
  onClose: () => void;
  windowId: string;
  appType: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

const AgeAppWindow: React.FC<AgeAppWindowProps> = ({
  gameTime,
  onClose,
  windowId,
  appType,
  position,
  size,
  minSize,
  onPositionChange,
  onSizeChange
}) => {
  const { age, annumReckoning } = gameTime;
  const yearOfBirth = annumReckoning - age;

  const content = (
    <div className="age-window-content">
      <div className="age-detail">
        <div className="detail-label">Current Age</div>
        <div className="detail-value">{age} Reckonings</div>
      </div>
      <div className="age-detail">
        <div className="detail-label">Year of Birth</div>
        <div className="detail-value">AR {yearOfBirth}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Age Tracker"
      onClose={onClose}
      windowId={windowId}
      appType={appType}
      position={position}
      size={size}
      minSize={minSize}
      onPositionChange={onPositionChange}
      onSizeChange={onSizeChange}
    >
      {content}
    </ScrAppWindow>
  );
};

export default AgeAppWindow; 