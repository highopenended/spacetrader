import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../ScrApp-Window';
import { GameTime } from '../../../types/gameState';

interface AgeAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
  isOverDeleteZone?: boolean;
}

const AgeAppWindow: React.FC<AgeAppWindowProps> = ({
  gameTime,
  isOverDeleteZone,
  ...windowProps
}) => {
  const { age, annumReckoning, yearOfDeath } = gameTime;
  const yearOfBirth = annumReckoning - age;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Current Age</div>
        <div className="detail-value">{age} Reckonings</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Date of Birth</div>
        <div className="detail-value">AR {yearOfBirth}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Date of Death</div>
        <div className="detail-value">{yearOfDeath ? `AR ${yearOfDeath}` : 'Not Yet Assigned'}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Age Tracker"
      {...windowProps}
      size={{ width: 300, height: 120 }}
      minSize={{ width: 300, height: 120 }}
      isOverDeleteZone={isOverDeleteZone}
    >
      {content}
    </ScrAppWindow>
  );
};

export default AgeAppWindow; 