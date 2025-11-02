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
  xPx: number; // left position in screen pixels (derived from world units via camera)
  bottomPx: number; // bottom position in screen pixels (from bottom of viewport)
  label: string;
  // Scrap center in screen pixels for connector lines
  cxPx?: number; // center x in screen pixels
  cyPx?: number; // center y in screen pixels (from bottom of viewport)
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
  updateAnchorPosition: (id: string, position: { xPx: number; bottomPx: number; cxPx?: number; cyPx?: number }) => void;
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