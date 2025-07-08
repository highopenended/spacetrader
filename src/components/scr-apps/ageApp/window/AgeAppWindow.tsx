import React, { useState, useEffect } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../ScrAppWindow';
import { GameTime } from '../../../../types/gameState';

const COMPACT_LEVELS = {
  C3: 270,    // Full text at 300px+
  C2: 170,  // Medium compact at 250px+
  C1: 60, // Compact at 200px+
  C0: 50    // Mini at 150px+
};

interface AgeAppWindowProps extends BaseWindowProps {
  gameTime: GameTime;
}

const AgeAppWindow: React.FC<AgeAppWindowProps> = ({
  gameTime,
  onWidthChange,
  ...windowProps
}) => {
  const { age, annumReckoning, yearOfDeath } = gameTime;
  const yearOfBirth = annumReckoning - age;
  const [compactLevel, setCompactLevel] = useState<'C3' | 'C2' | 'C1' | 'C0'>('C3');

  // Calculate compact level based on width
  const getCompactLevel = (width: number): 'C3' | 'C2' | 'C1' | 'C0' => {
    if (width >= COMPACT_LEVELS.C3) return 'C3';
    if (width >= COMPACT_LEVELS.C2) return 'C2';
    if (width >= COMPACT_LEVELS.C1) return 'C1';
    return 'C0';
  };

  // Handle width changes and update compact level
  const handleWidthChange = (width: number) => {
    setCompactLevel(getCompactLevel(width));
    if (onWidthChange) {
      onWidthChange(width);
    }
  };

  // Initialize compact level based on initial width
  useEffect(() => {
    if (windowProps.size?.width) {
      setCompactLevel(getCompactLevel(windowProps.size.width));
    }
  }, [windowProps.size?.width]);

  // Helper functions for each section
  const getAgeLabel = () => {
    switch (compactLevel) {
      case 'C3': return 'Current Age';
      case 'C2': return 'Age';
      default: return 'Age';
    }
  };

  const getAgeValue = () => {
    switch (compactLevel) {
      case 'C3': return `${age} Reckonings`;
      case 'C2': return `${age} R`;
      default: return age;
    }
  };

  const getBirthLabel = () => {
    switch (compactLevel) {
      case 'C3': return 'Date of Birth';
      case 'C2': return 'Birth';
      default: return 'DOB';
    }
  };

  const getBirthValue = () => {
    switch (compactLevel) {
      case 'C3': return `AR ${yearOfBirth}`;
      case 'C2': return `AR ${yearOfBirth}`;
      default: return `AR${yearOfBirth}`;
    }
  };

  const getDeathLabel = () => {
    switch (compactLevel) {
      case 'C3': return 'Date of Death';
      case 'C2': return 'Death';
      default: return 'DOD';
    }
  };

  const getDeathValue = () => {
    if (yearOfDeath) {
      switch (compactLevel) {
        case 'C3': return `AR ${yearOfDeath}`;
        case 'C2': return `AR ${yearOfDeath}`;
        default: return `AR${yearOfDeath}`;
      }
    } else {
      switch (compactLevel) {
        case 'C3': return 'Not Yet Assigned';
        case 'C2': return 'Not Assigned';
        default: return 'NYA';
      }
    }
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">{getAgeLabel()}</div>
        <div className="detail-value">{getAgeValue()}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">{getBirthLabel()}</div>
        <div className="detail-value">{getBirthValue()}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div className="detail-label">{getDeathLabel()}</div>
        <div className="detail-value">{getDeathValue()}</div>
      </div>
    </div>
  );

  return (
    <ScrAppWindow
      title="Age Tracker"
      {...windowProps}
      minSize={{ width: 100, height: 100 }}
      onWidthChange={handleWidthChange}
    >
      {content}
    </ScrAppWindow>
  );
};

export default AgeAppWindow; 