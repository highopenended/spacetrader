/**
 * Scrap Type Registry
 * 
 * Central registry of all scrap types available in the game.
 * Each scrap type defines the base properties for scrap objects.
 */

import { ScrapType } from '../types/scrapTypes';
import { MutatorId } from '../types/mutatorTypes';

export const ScrapRegistry = {
  metalScrap: { 
    id: 'metalScrap', 
    label: 'Metal Scrap', 
    baseValue: 2, 
    appearance: '🔩', 
    weight: 70, 
    description: "Just some common metal scrap. Usually pretty low value." 
  },
  junkCircuitry: { 
    id: 'junkCircuitry', 
    label: 'Junk Circuitry', 
    baseValue: 5, 
    appearance: '🖥️', 
    weight: 5, 
    description: "Damaged electronic components. Always a good source of scrap." 
  },
  heavyPlating: { 
    id: 'heavyPlating', 
    label: 'Heavy Plating', 
    baseValue: 20, 
    appearance: '🛡️', 
    weight: 5, 
    alwaysMutators: ['dense'] as MutatorId[], // Heavy plating is always dense
    description: "Chunks of reinforced armor plating used on military vessels and the like. Not reinforced enough apparently." 
  },
  cryotube: { 
    id: 'cryotube', 
    label: 'Cryotube', 
    baseValue: 20, 
    appearance: '🫙', 
    weight: 10, 
    neverMutators: ['dense'] as MutatorId[], // Cryotube can never be dense
    states: {
      intact: {
        appearance: '🫙',
        mutators: ['fragile'] as MutatorId[],
        baseValue: 25,
        label: 'Cryotube',
        spawnWeight: 1 // Rarer - intact cryotubes are harder to find
      },
      broken: {
        appearance: '🫙', // Will be different sprite when we have art
        mutators: ['sharp'] as MutatorId[],
        baseValue: 15,
        label: 'Shattered Cryotube',
        spawnWeight: 3 // More common - broken ones are easier to find
      }
    },
    description: "A cryogenic preservation tube. The occupants might still be alive... or not." 
  },
  corpCreds: { 
    id: 'corpCreds', 
    label: 'Corporate Credentials', 
    baseValue: 150, 
    appearance: '🪪', 
    weight: 1, 
    description: "High-value corporate access cards. Extremely rare and worth a fortune on the black market. Or maybe you could keep them for yourself..?" 
  },
  biomassSample: { 
    id: 'biomassSample', 
    label: 'Biomass Sample', 
    baseValue: 15, 
    appearance: '🧬', 
    weight: 5, 
    description: "Looks like some kind of organic material. The guys in the lab would love this. Guess they'll get the shredded version later..." 
  },
  brokenDroneCore: { 
    id: 'brokenDroneCore', 
    label: 'Broken Drone Core', 
    baseValue: 60, 
    appearance: '🤖', 
    weight: 4, 
    description: "Damaged AI core from automated drones. Contains valuable quantum processors. Probably not haunted." 
  }
} as const satisfies Record<string, ScrapType>;

// Re-export the refined type with actual keys
export type ScrapTypeId = keyof typeof ScrapRegistry; 