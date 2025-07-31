/**
 * Custom Collision Detection Hook
 * 
 * Handles complex collision detection logic for the dual drag system.
 * Supports multiple drop zones: purge zone, terminal dock, and sortable list.
 * Provides priority-based collision detection for different drag types.
 */

import { useCallback } from 'react';
import { rectIntersection } from '@dnd-kit/core';

/**
 * Custom collision detection to allow dropping on multiple zones
 * (purge zone, terminal dock, sortable list)
 */
export const useCustomCollisionDetection = () => {
  const customCollisionDetection = useCallback((args: any) => {
    const collisions = rectIntersection(args);
    
    // PREVENTION: Block PurgeZone window from detecting itself as a valid drop target
    // This prevents visual feedback (red effects, "PURGE RISK") from showing during self-targeting
    if (args.active?.data?.current?.type === 'window-purge-node' && 
        args.active?.data?.current?.appType === 'purgeZone') {
      // Remove purge-zone-window from collisions for PurgeZone window drag
      const filteredCollisions = collisions.filter(c => c.id !== 'purge-zone-window');
      
      // Still allow terminal dock detection for PurgeZone window
      const terminalDock = filteredCollisions.find(c => c.id === 'terminal-dock-zone');
      if (terminalDock) return [terminalDock];
      
      return filteredCollisions;
    }
    
    // WINDOW PURGE NODE DRAG SYSTEM: Apply priority only for window deletion drags
    if (args.active?.data?.current?.type === 'window-purge-node') {
      const purgeZone = collisions.find(c => c.id === 'purge-zone-window');
      const terminalDock = collisions.find(c => c.id === 'terminal-dock-zone');
      
      if (purgeZone) return [purgeZone];
      if (terminalDock) return [terminalDock];
      
      return collisions;
    }
    
    // APP LIST DRAG SYSTEM: Use normal sortable behavior for app reordering
    // Don't apply any priority - let @dnd-kit handle normal sortable collisions
    // Filter out terminal-dock-zone so app list drags never trigger docking behavior
    const filteredCollisions = collisions.filter(c => c.id !== 'terminal-dock-zone');
    return filteredCollisions;
  }, []);

  return { customCollisionDetection };
}; 