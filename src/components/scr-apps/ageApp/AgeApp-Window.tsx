import React from 'react';
import ScrAppWindow, { BaseWindowProps } from '../ScrApp-Window';
import { GameTime } from '../../../types/gameState';

interface AgeAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
}

const AgeAppWindow: React.FC<AgeAppWindowProps> = ({
  gameTime,
  ...windowProps
}) => {
  const { age, annumReckoning } = gameTime;
  const yearOfBirth = annumReckoning - age;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Current Age</div>
        <div className="detail-value">{age} Reckonings</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">Year of Birth</div>
        <div className="detail-value">AR {yearOfBirth}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Age Tracker"
      {...windowProps}
    >
      {content}
    </ScrAppWindow>
  );
};

export default AgeAppWindow; 