/**
 * Ending Cutscene Wrapper
 * 
 * Renders the appropriate ending cutscene based on the active ending.
 * Currently only supports the default ending component.
 */

import React from 'react';
import { ActiveEnding } from '../../types/endingState';
import { DefaultEnding } from './endings/defaultEnding';
import { RecursivePurgeCutscene } from './endings/recursivePurge';

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

  // Route to appropriate cutscene component
  console.log('EndingCutscene: rendering ending', ending.id, 'with component', ending.cutsceneComponent);
  
  switch (ending.cutsceneComponent) {
    case 'RecursivePurgeCutscene':
      console.log('EndingCutscene: Using RecursivePurgeCutscene');
      return (
        <RecursivePurgeCutscene 
          onComplete={onComplete}
          endingName={ending.name}
          endingDescription={ending.description}
        />
      );
    
    case 'DefaultEnding':
    default:
      console.log('EndingCutscene: Using DefaultEnding (fallback)');
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
