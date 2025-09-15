/**
 * Scrap Type Registry
 * 
 * Central registry of all scrap types available in the game.
 * Each scrap type defines the base properties for scrap objects.
 */

import { ScrapType } from '../types/scrapTypes';

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
    description: "Chunks of reinforced armor plating used on military vessels and the like. Not reinforced enough apparently." 
  },
  shatteredCryotube: { 
    id: 'shatteredCryotube', 
    label: 'Shattered Cryotube', 
    baseValue: 20, 
    appearance: '🫙', 
    weight: 10, 
    description: "Looks like the shattered remains of a cryogenic preservation tube. Doubt the occupants made it out alive." 
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