/**
 * Physics Utility Functions
 * 
 * Core physics calculations for the field-based scrap dragging system.
 * Handles force resolution, effective load calculation, and follow speed.
 */

import { ScrapObject } from '../types/scrapTypes';
import { ScrapRegistry } from '../constants/scrapRegistry';
import { MutatorRegistry } from '../constants/mutatorRegistry';
import { 
  GlobalField, 
  PointSourceField, 
  PhysicsContext, 
  EffectiveLoadResult 
} from '../types/physicsTypes';

/**
 * Calculate the final mass of a scrap object
 * 
 * Combines baseMass from scrap type with additive massModifiers from mutators.
 * 
 * @param scrap - The scrap object to calculate mass for
 * @returns Final mass value (minimum 0.1)
 */
export const calculateScrapMass = (scrap: ScrapObject): number => {
  const scrapType = ScrapRegistry[scrap.typeId as keyof typeof ScrapRegistry];
  if (!scrapType) return 1; // Fallback to default
  
  let mass = scrapType.baseMass;
  
  // Apply mutator mass modifiers (additive)
  for (const mutatorId of scrap.mutators) {
    const mutator = MutatorRegistry[mutatorId as keyof typeof MutatorRegistry];
    if (mutator && 'massModifier' in mutator && mutator.massModifier !== undefined) {
      mass += mutator.massModifier;
    }
  }
  
  // Enforce minimum mass
  return Math.max(0.1, mass);
};

/**
 * Calculate force from a global field in a specific direction
 * 
 * Global fields apply uniform force in their specified direction.
 * Returns positive value if field opposes movement, negative if it assists.
 * 
 * @param field - The global field to calculate force from
 * @param movementDirection - The direction of movement ('up' | 'down' | 'left' | 'right')
 * @returns Force magnitude (positive = opposing, negative = assisting)
 */
const calculateGlobalFieldForce = (
  field: GlobalField,
  movementDirection: 'up' | 'down' | 'left' | 'right'
): number => {
  // If field direction matches movement direction, it assists (negative force)
  if (field.direction === movementDirection) {
    return -field.strength;
  }
  
  // If field direction is opposite to movement direction, it opposes (positive force)
  const opposites: Record<string, string> = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left'
  };
  
  if (opposites[field.direction] === movementDirection) {
    return field.strength;
  }
  
  // Field is perpendicular to movement direction (no effect)
  return 0;
};

/**
 * Calculate force from a point source field at a specific position
 * 
 * Point source fields have distance-based falloff. Force vector points toward
 * (attractor) or away from (repulsor) the source position.
 * 
 * @param field - The point source field
 * @param scrapPosition - Position of the scrap object (px)
 * @param movementDirection - The direction of movement
 * @returns Force magnitude (positive = opposing, negative = assisting)
 */
const calculatePointSourceFieldForce = (
  field: PointSourceField,
  scrapPosition: { x: number; y: number },
  movementDirection: 'up' | 'down' | 'left' | 'right'
): number => {
  // Calculate distance from field source
  const dx = field.position.x - scrapPosition.x;
  const dy = field.position.y - scrapPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Check max range
  if (field.maxRange && distance > field.maxRange) {
    return 0;
  }
  
  // Prevent division by zero
  if (distance < 1) {
    return 0;
  }
  
  // Calculate force magnitude with falloff
  const forceMagnitude = field.strength / Math.pow(distance, field.falloffExponent);
  
  // Normalize direction vector
  const dirX = dx / distance;
  const dirY = dy / distance;
  
  // Determine force component in movement direction
  // Positive field strength = attractor (pulls toward source)
  // Screen coordinates: +X is right, +Y is down
  let forceComponent = 0;
  
  switch (movementDirection) {
    case 'right':
      // Moving right: positive dirX opposes (field pulls left), negative assists
      forceComponent = -dirX * forceMagnitude;
      break;
    case 'left':
      // Moving left: negative dirX opposes (field pulls right), positive assists
      forceComponent = dirX * forceMagnitude;
      break;
    case 'down':
      // Moving down: positive dirY opposes (field pulls up), negative assists
      forceComponent = -dirY * forceMagnitude;
      break;
    case 'up':
      // Moving up: negative dirY opposes (field pulls down), positive assists
      forceComponent = dirY * forceMagnitude;
      break;
  }
  
  return forceComponent;
};

/**
 * Calculate effective load for all cardinal directions
 * 
 * Resolves all active fields and scrap mass to determine the effective load
 * for each cardinal direction and the current drag direction.
 * 
 * @param context - Complete physics context with fields and properties
 * @param scrapPosition - Current position of scrap (px)
 * @returns Complete effective load result with all direction loads and effectiveness
 */
export const calculateEffectiveLoad = (
  context: PhysicsContext,
  scrapPosition: { x: number; y: number }
): EffectiveLoadResult => {
  const { globalFields, pointSourceFields, scrapMass, manipulatorStrength, manipulatorMaxLoad, dragDirection } = context;
  
  // Start with base mass for all directions
  const loads = {
    up: scrapMass,
    down: scrapMass,
    left: scrapMass,
    right: scrapMass
  };
  
  // Apply global fields
  for (const field of globalFields) {
    loads.up += calculateGlobalFieldForce(field, 'up');
    loads.down += calculateGlobalFieldForce(field, 'down');
    loads.left += calculateGlobalFieldForce(field, 'left');
    loads.right += calculateGlobalFieldForce(field, 'right');
  }
  
  // Apply point source fields
  for (const field of pointSourceFields) {
    loads.up += calculatePointSourceFieldForce(field, scrapPosition, 'up');
    loads.down += calculatePointSourceFieldForce(field, scrapPosition, 'down');
    loads.left += calculatePointSourceFieldForce(field, scrapPosition, 'left');
    loads.right += calculatePointSourceFieldForce(field, scrapPosition, 'right');
  }
  
  // Ensure loads are never negative (minimum 0.1)
  loads.up = Math.max(0.1, loads.up);
  loads.down = Math.max(0.1, loads.down);
  loads.left = Math.max(0.1, loads.left);
  loads.right = Math.max(0.1, loads.right);
  
  // Calculate effective load for current drag direction
  let effectiveLoad = scrapMass; // Default if no drag direction
  
  if (dragDirection) {
    const absX = Math.abs(dragDirection.x);
    const absY = Math.abs(dragDirection.y);
    
    // Normalize if needed
    const magnitude = Math.sqrt(absX * absX + absY * absY);
    if (magnitude > 0) {
      const normX = absX / magnitude;
      const normY = absY / magnitude;
      
      // Determine which cardinal directions are involved
      let horizontalLoad = 0;
      let verticalLoad = 0;
      
      if (dragDirection.x > 0) {
        horizontalLoad = loads.right * normX;
      } else if (dragDirection.x < 0) {
        horizontalLoad = loads.left * normX;
      }
      
      // Screen coordinates: positive Y is DOWN, negative Y is UP
      if (dragDirection.y < 0) {
        verticalLoad = loads.up * normY;
      } else if (dragDirection.y > 0) {
        verticalLoad = loads.down * normY;
      }
      
      // Use MAX of component loads (diagonal movement only as hard as hardest direction)
      effectiveLoad = Math.max(horizontalLoad, verticalLoad);
    }
  }
  
  // Calculate manipulator effectiveness
  let manipulatorEffectiveness = 0;
  
  if (effectiveLoad <= manipulatorStrength) {
    // Can move instantly
    manipulatorEffectiveness = 1.0;
  } else if (effectiveLoad >= manipulatorMaxLoad) {
    // Cannot move at all
    manipulatorEffectiveness = 0;
  } else {
    // Scaled effectiveness between strength and max load
    const range = manipulatorMaxLoad - manipulatorStrength;
    const excess = effectiveLoad - manipulatorStrength;
    manipulatorEffectiveness = 1 - (excess / range);
  }
  
  // Clamp to 0-1 range
  manipulatorEffectiveness = Math.max(0, Math.min(1, manipulatorEffectiveness));
  
  return {
    loadUp: loads.up,
    loadDown: loads.down,
    loadLeft: loads.left,
    loadRight: loads.right,
    effectiveLoad,
    manipulatorEffectiveness
  };
};

/**
 * Calculate total force vector from all active fields
 * 
 * Converts global and point source fields into a combined force vector (Fx, Fy).
 * This is used during physics integration to apply environmental forces like gravity.
 * 
 * @param context - Physics context with all active fields
 * @param position - Current position of the object (px)
 * @returns Force vector {fx, fy} in pixels (force = strength * mass for global fields)
 */
export const calculateFieldForces = (
  context: PhysicsContext,
  position: { x: number; y: number }
): { fx: number; fy: number } => {
  let fx = 0;
  let fy = 0;
  
  // Apply global fields (like gravity)
  // Screen coordinates: +X is right, +Y is down
  for (const field of context.globalFields) {
    const forceMagnitude = field.strength * context.scrapMass;
    
    switch (field.direction) {
      case 'down':
        fy += forceMagnitude;  // Positive Y is down
        break;
      case 'up':
        fy -= forceMagnitude;  // Negative Y is up
        break;
      case 'right':
        fx += forceMagnitude;  // Positive X is right
        break;
      case 'left':
        fx -= forceMagnitude;  // Negative X is left
        break;
    }
  }
  
  // Apply point source fields (like magnets)
  for (const field of context.pointSourceFields) {
    // Calculate distance from field source
    const dx = field.position.x - position.x;
    const dy = field.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check max range
    if (field.maxRange && distance > field.maxRange) {
      continue;
    }
    
    // Prevent division by zero
    if (distance < 1) {
      continue;
    }
    
    // Calculate force magnitude with falloff
    const forceMagnitude = field.strength / Math.pow(distance, field.falloffExponent);
    
    // Normalize direction vector and apply force
    // Positive strength = attractor (pulls toward source)
    // Negative strength = repulsor (pushes away from source)
    fx += (dx / distance) * forceMagnitude;
    fy += (dy / distance) * forceMagnitude;
  }
  
  return { fx, fy };
};

/**
 * @deprecated - No longer used with spring-based physics model
 * Calculate follow speed multiplier based on manipulator effectiveness (OBSOLETE)
 * 
 * Previously used in position-based drag system to scale cursor following.
 * Replaced by spring force scaling in spring-damper physics model.
 * Effectiveness now directly scales spring stiffness instead.
 * Will be removed in future cleanup.
 * 
 * @param manipulatorEffectiveness - Effectiveness value from 0 to 1
 * @returns Speed multiplier from 0 to 1
 */
export const calculateFollowSpeed = (manipulatorEffectiveness: number): number => {
  return Math.max(0, Math.min(1, manipulatorEffectiveness));
};

