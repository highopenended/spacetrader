/**
 * Clock Store (Zustand)
 * 
 * Global clock system that manages timing for all game systems.
 * Provides centralized pause/resume, time scaling, and subscriber management.
 * 
 * Key Features:
 * - 60fps requestAnimationFrame loop
 * - Global pause/resume functionality  
 * - Time scaling for speed control (0=paused, 1=normal, 2=2x speed, etc.)
 * - Subscriber pattern for components that need frame updates
 * - Performance metrics for debugging
 */

import { create } from 'zustand';
import { ClockSubscriber, ClockMetrics } from '../types/clockTypes';

interface ClockState {
  // ===== TIMING STATE =====
  /** Whether the clock is paused (overrides timeScale) */
  isPaused: boolean;
  
  /** Time scale multiplier (0=paused, 1=normal, 2=2x speed, etc.) */
  timeScale: number;
  
  /** Total number of ticks since clock started */
  tickCount: number;
  
  /** Timestamp of last tick for deltaTime calculation */
  lastTickTime: number;
  
  /** Whether the clock loop is currently running */
  isRunning: boolean;
  
  // ===== SUBSCRIBER MANAGEMENT =====
  /** Map of active subscribers by ID */
  subscribers: Map<string, ClockSubscriber>;
  
  // ===== PERFORMANCE METRICS =====
  /** Current performance metrics */
  metrics: ClockMetrics;
  
  /** Frame time history for FPS calculation (last 60 frames) */
  frameTimeHistory: number[];
  
  // ===== INTERNAL STATE =====
  /** RequestAnimationFrame ID for cleanup */
  rafId: number | null;
}

interface ClockActions {
  // ===== CLOCK CONTROL =====
  /** Start the clock loop */
  startClock: () => void;
  
  /** Stop the clock loop */
  stopClock: () => void;
  
  /** Pause the clock (stops time but keeps loop running) */
  pauseClock: () => void;
  
  /** Resume the clock */
  resumeClock: () => void;
  
  /** Set time scale multiplier */
  setTimeScale: (scale: number) => void;
  
  // ===== SUBSCRIBER MANAGEMENT =====
  /** Subscribe to clock ticks */
  subscribe: (subscriber: ClockSubscriber) => void;
  
  /** Unsubscribe from clock ticks */
  unsubscribe: (subscriberId: string) => void;
  
  /** Get subscriber by ID */
  getSubscriber: (subscriberId: string) => ClockSubscriber | undefined;
  
  // ===== INTERNAL METHODS =====
  /** Process a single clock tick (called by rAF loop) */
  tick: (timestamp: number) => void;
  
  /** Update performance metrics */
  updateMetrics: (frameTime: number) => void;
  
  // ===== RESET =====
  /** Reset clock state */
  resetClock: () => void;
}

type ClockStore = ClockState & ClockActions;

const initialState: ClockState = {
  isPaused: false,
  timeScale: 1.0,
  tickCount: 0,
  lastTickTime: 0,
  isRunning: false,
  subscribers: new Map(),
  metrics: {
    fps: 0,
    averageFrameTime: 0,
    subscriberCount: 0,
    totalTicks: 0,
    lastTickProcessingTime: 0
  },
  frameTimeHistory: [],
  rafId: null
};

export const useClockStore = create<ClockStore>((set, get) => ({
  ...initialState,

  // ===== CLOCK CONTROL =====
  startClock: () => {
    const state = get();
    if (state.isRunning) return;
    
    const tick = (timestamp: number) => {
      get().tick(timestamp);
      const currentState = get();
      if (currentState.isRunning) {
        const rafId = requestAnimationFrame(tick);
        set({ rafId });
      }
    };
    
    set({ 
      isRunning: true, 
      lastTickTime: performance.now() 
    });
    
    const rafId = requestAnimationFrame(tick);
    set({ rafId });
  },

  stopClock: () => {
    const state = get();
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
    }
    set({ 
      isRunning: false, 
      rafId: null 
    });
  },

  pauseClock: () => {
    set({ isPaused: true });
  },

  resumeClock: () => {
    set({ isPaused: false });
  },

  setTimeScale: (scale: number) => {
    // Clamp time scale to reasonable bounds
    const clampedScale = Math.max(0, Math.min(10, scale));
    set({ timeScale: clampedScale });
  },

  // ===== SUBSCRIBER MANAGEMENT =====
  subscribe: (subscriber: ClockSubscriber) => {
    set(state => {
      const newSubscribers = new Map(state.subscribers);
      newSubscribers.set(subscriber.id, subscriber);
      return { subscribers: newSubscribers };
    });
  },

  unsubscribe: (subscriberId: string) => {
    set(state => {
      const newSubscribers = new Map(state.subscribers);
      newSubscribers.delete(subscriberId);
      return { subscribers: newSubscribers };
    });
  },

  getSubscriber: (subscriberId: string) => {
    return get().subscribers.get(subscriberId);
  },

  // ===== INTERNAL METHODS =====
  tick: (timestamp: number) => {
    const state = get();
    
    // Calculate delta time
    const deltaTime = timestamp - state.lastTickTime;
    
    // Skip if delta time is too large (likely a pause/resume)
    if (deltaTime > 100) {
      set({ lastTickTime: timestamp });
      return;
    }
    
    // Calculate scaled delta time
    const effectiveTimeScale = state.isPaused ? 0 : state.timeScale;
    const scaledDeltaTime = deltaTime * effectiveTimeScale;
    
    // Update tick count
    const newTickCount = state.tickCount + 1;
    
    // Process subscribers
    const processingStartTime = performance.now();
    
    if (!state.isPaused && state.subscribers.size > 0) {
      // Sort subscribers by priority (lower priority numbers execute first)
      const sortedSubscribers = Array.from(state.subscribers.values())
        .sort((a, b) => (a.priority || 0) - (b.priority || 0));
      
      // Execute subscriber callbacks
      for (const subscriber of sortedSubscribers) {
        try {
          subscriber.callback(deltaTime, scaledDeltaTime, newTickCount);
        } catch (error) {
          console.error(`Clock subscriber "${subscriber.id}" error:`, error);
        }
      }
    }
    
    const processingTime = performance.now() - processingStartTime;
    
    // Update metrics
    get().updateMetrics(deltaTime);
    
    // Update state
    set({ 
      tickCount: newTickCount,
      lastTickTime: timestamp,
      metrics: {
        ...state.metrics,
        totalTicks: newTickCount,
        subscriberCount: state.subscribers.size,
        lastTickProcessingTime: processingTime
      }
    });
  },

  updateMetrics: (frameTime: number) => {
    set(state => {
      // Update frame time history (keep last 60 frames)
      const newHistory = [...state.frameTimeHistory, frameTime];
      if (newHistory.length > 60) {
        newHistory.shift();
      }
      
      // Calculate average frame time and FPS
      const averageFrameTime = newHistory.reduce((sum, time) => sum + time, 0) / newHistory.length;
      const fps = averageFrameTime > 0 ? Math.round(1000 / averageFrameTime) : 0;
      
      return {
        frameTimeHistory: newHistory,
        metrics: {
          ...state.metrics,
          fps,
          averageFrameTime: Math.round(averageFrameTime * 100) / 100
        }
      };
    });
  },

  // ===== RESET =====
  resetClock: () => {
    const state = get();
    
    // Stop the clock first
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
    }
    
    // Clear all subscribers
    const newSubscribers = new Map();
    
    // Reset to initial state
    set({
      ...initialState,
      subscribers: newSubscribers
    });
  }
}));
