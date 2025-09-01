/**
 * Default Ending Cutscene
 * 
 * Generic "GAME OVER" ending used as fallback and for placeholder endings.
 * Simple black screen with white text.
 */

import React from 'react';
import './DefaultEnding.css';

interface DefaultEndingProps {
  /** Called when the cutscene completes */
  onComplete: () => void;
  /** The ending that triggered this cutscene */
  endingName: string;
  /** Optional ending description */
  endingDescription?: string;
}

const DefaultEnding: React.FC<DefaultEndingProps> = ({ 
  onComplete, 
  endingName, 
  endingDescription 
}) => {
  
  // Handle click to continue
  const handleClick = () => {
    onComplete();
  };

  return (
    <div className="default-ending-overlay" onClick={handleClick}>
      <div className="default-ending-content">
        <div className="default-ending-title">GAME OVER</div>
        <div className="default-ending-name">{endingName}</div>
        {endingDescription && (
          <div className="default-ending-description">{endingDescription}</div>
        )}
        <div className="default-ending-continue">Click to continue</div>
      </div>
    </div>
  );
};

export default DefaultEnding;
