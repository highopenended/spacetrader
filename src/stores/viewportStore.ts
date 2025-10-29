/**
 * Viewport State Store (Zustand)
 * 
 * Centralized viewport size tracking. Provides reactive viewport dimensions
 * that components can subscribe to, eliminating duplicate resize listeners.
 * 
 * Usage:
 *   const viewport = useViewportStore(state => state.viewport);
 *   // Access viewport.width and viewport.height
 */

import { create } from 'zustand';

interface ViewportState {
  width: number;
  height: number;
}

interface ViewportStore {
  viewport: ViewportState;
  updateViewport: (width: number, height: number) => void;
}

const initialViewport: ViewportState = {
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
};

export const useViewportStore = create<ViewportStore>((set) => ({
  viewport: initialViewport,
  
  updateViewport: (width: number, height: number) => {
    set({ viewport: { width, height } });
  },
}));

