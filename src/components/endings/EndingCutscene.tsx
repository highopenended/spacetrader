/**
 * Ending Cutscene Wrapper
 * 
 * Renders the appropriate ending cutscene based on the active ending.
 * Currently only supports the default ending component.
 */

import React from 'react';
import { ActiveEnding } from '../../types/endingState';
import { DefaultEnding } from './endings/defaultEnding';

interface EndingCutsceneProps {
  /** The active ending to display */
  activeEnding: ActiveEnding;
  /** Called when the cutscene completes */
  onComplete: () => void;
}

const EndingCutscene: React.FC<EndingCutsceneProps> = ({ 
  activeEnding, 
  onComplete 
}) => {
  const { ending } = activeEnding;

  // For now, all endings use the default cutscene
  // Later we can add a switch statement to handle specific cutscene components
  switch (ending.cutsceneComponent) {
    default:
      return (
        <DefaultEnding 
          onComplete={onComplete}
          endingName={ending.name}
          endingDescription={ending.description}
        />
      );
  }
};

export default EndingCutscene;
