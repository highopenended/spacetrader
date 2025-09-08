/**
 * Anchors State Store (Zustand)
 * 
 * Clean, high-performance anchor management for visual overlays.
 * Follows single responsibility principle - store manages state, components handle throttling.
 * 
 * Features:
 * - Immediate, reliable updates
 * - Selective subscriptions for optimal performance
 * - Simple, maintainable API
 * - No complex throttling logic (handled by callers)
 */

import { create } from 'zustand';

export interface Anchor {
  id: string;
  xVw: number; // left position in vw
  bottomVh: number; // bottom position in vh
  label: string;
  // Scrap center in viewport units for connector lines
  cxVw?: number; // center x in vw
  cyVh?: number; // center y in vh (from bottom)
}

interface AnchorsState {
  anchors: Anchor[];
}

interface AnchorsActions {
  /**
   * Set all anchors immediately
   * @param anchors - Complete anchor array
   */
  setAnchors: (anchors: Anchor[]) => void;
  
  /**
   * Clear all anchors immediately
   */
  clearAnchors: () => void;
  
  /**
   * Update single anchor position
   * @param id - Anchor ID
   * @param position - New position data
   */
  updateAnchorPosition: (id: string, position: { xVw: number; bottomVh: number; cxVw?: number; cyVh?: number }) => void;
}

type AnchorsStore = AnchorsState & AnchorsActions;

export const useAnchorsStore = create<AnchorsStore>((set) => ({
  // ===== STATE =====
  anchors: [],

  // ===== ACTIONS =====
  setAnchors: (anchors) => {
    set({ anchors });
  },

  clearAnchors: () => {
    set({ anchors: [] });
  },

  updateAnchorPosition: (id, position) => {
    set((state) => ({
      anchors: state.anchors.map(anchor => 
        anchor.id === id 
          ? { ...anchor, ...position }
          : anchor
      )
    }));
  },
}));