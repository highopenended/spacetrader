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
    description: "Common metallic debris. Low value but abundant." 
  },
  junkCircuitry: { 
    id: 'junkCircuitry', 
    label: 'Junk Circuitry', 
    baseValue: 5, 
    appearance: '🪨', 
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
    description: "Shattered reamins of a cryogenic preservation tube. Doubt the occupent made it out alive." 
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
    description: "Organic material of unknown origin. Research labs pay well for specimens. Warning, do not consume or rub in your eyes." 
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