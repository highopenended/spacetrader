/**
 * Scrap Mutator Registry
 * 
 * Central registry of all mutators that can be applied to scrap objects.
 * Mutators modify scrap behavior, value, and interaction requirements.
 */

import { ScrapMutator, ScrapInteractionContext } from '../types/mutatorTypes';

export const MutatorRegistry = {
  sharp: {
    id: 'sharp',
    label: 'Sharp',
    appearance: '✂️',
    creditMultiplier: 1.0,
    protectionRequired: 'isProtectedFromSharp',
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle sharp injury logic here
      console.log('Sharp scrap interaction - implement injury logic');
    },
    rarity: 0.05,
    description: `Scans indicate that jagged edges and exposed metal shards present a serious laceration risk. Ensure you are equipped with your standard-issue corporate gloves.
**Note: Following numerous complaints from corporate leadership, the Glove Readiness Initiative Program has been officially discontinued. The corporation will no longer be issuing protective gloves at this time.**`
  },
  radioactive: {
    id: 'radioactive',
    label: 'Radioactive',
    appearance: '☢️',
    creditMultiplier: 1.5,
    protectionRequired: 'isProtectedFromRadiation',
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle radiation injury logic here
      console.log('Radioactive scrap interaction - implement radiation logic');
    },
    rarity: 0.05,
    description: "Dispite numerous internal investigations, no links have been found between radiation exposure in the workplace and cancer."
  },
  alienArtifact: {
    id: 'alienArtifact',
    label: 'Alien Artifact',
    appearance: '🧿',
    creditMultiplier: 5,
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle alien artifact logic here
      console.log('Alien artifact interaction - implement special logic');
    },
    rarity: 0.05,
    description: "WARNING: Xeno-technology of unknown origin. Report to superiors immediately or risk termination."
  },
  corrosive: {
    id: 'corrosive',
    label: 'Corrosive',
    appearance: '🧪',
    creditMultiplier: 1.3,
    protectionRequired: 'isProtectedFromCorrosive',
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle corrosive injury logic here
      console.log('Corrosive scrap interaction - implement acid damage logic');
    },
    rarity: 0.05,
    description: `Prolonged exposure to corrosive agents can result in equipment degradation, flesh loss, and disciplinary review. Reduce waste, handle swiftly.`
  },
  explosive: {
    id: 'explosive',
    label: 'Explosive',
    appearance: '💥',
    creditMultiplier: 2.5,
    protectionRequired: 'isProtectedFromExplosive',
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle explosive logic here
      console.log('Explosive scrap interaction - implement blast logic');
    },
    rarity: 0.05,
    description: "Improper handling of unstable materials may result in localized detonation, asset destruction, coworker injury, and formal reprimand. Your negligence is not just a safety risk—it’s a failure to uphold team values. For everyone's sake, exercise caution."
  },
  quantumPhased: {
    id: 'quantumPhased',
    label: 'Quantum-Phased',
    appearance: '🌀',
    creditMultiplier: 2,
    protectionRequired: 'isProtectedFromQuantum',
    onInteract: ({ gameState, scrap }: ScrapInteractionContext) => {
      // TODO: handle quantum state logic here
      console.log('Quantum-phased scrap interaction - implement quantum effects');
    },
    rarity: 0.05,
    description: "Warning: This material exhibits unstable temporal coherence. All personnel are reminded to follow approved stabilization protocols (Directive 77-B, Rev. 6; see Memo #5124-QP) to prevent phase drift, asset loss, and/or causality infractions. Mishandling may negatively impact future performance reviews already on file and may result in retroactive termination of employment. We are observing you."
  }
} as const satisfies Record<string, ScrapMutator>;

// Re-export the refined type with actual keys  
export type MutatorId = keyof typeof MutatorRegistry; 