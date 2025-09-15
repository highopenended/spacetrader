/**
 * useClockSubscription Hook
 * 
 * Convenient hook for components to subscribe to the global clock.
 * Automatically handles subscription/unsubscription on mount/unmount.
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   useClockSubscription('my-component', (deltaTime, scaledDeltaTime) => {
 *     // Update component state based on time
 *     updatePosition(scaledDeltaTime);
 *   }, { priority: 1, name: 'My Component Physics' });
 *   
 *   return <div>My Component</div>;
 * };
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';
import { useClockStore } from '../stores';
import { ClockTickCallback } from '../types/clockTypes';

interface UseClockSubscriptionOptions {
  /** Execution priority (lower numbers execute first) */
  priority?: number;
  
  /** Human-readable name for debugging */
  name?: string;
  
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean;
}

/**
 * Subscribe to global clock ticks
 * @param id - Unique identifier for this subscription
 * @param callback - Function to call on each tick
 * @param options - Optional configuration
 */
export const useClockSubscription = (
  id: string,
  callback: ClockTickCallback,
  options: UseClockSubscriptionOptions = {}
) => {
  const { priority = 0, name, enabled = true } = options;
  
  // Store actions
  const subscribe = useClockStore(state => state.subscribe);
  const unsubscribe = useClockStore(state => state.unsubscribe);
  
  // Stable callback ref to avoid re-subscriptions
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  // Memoized subscriber object
  const subscriber = useCallback(() => ({
    id,
    callback: (deltaTime: number, scaledDeltaTime: number, tickCount: number) => {
      callbackRef.current(deltaTime, scaledDeltaTime, tickCount);
    },
    priority,
    name: name || id
  }), [id, priority, name]);

  useEffect(() => {
    if (!enabled) return;
    
    // Subscribe to clock
    subscribe(subscriber());
    
    // Cleanup on unmount or dependency change
    return () => {
      unsubscribe(id);
    };
  }, [id, enabled, subscribe, unsubscribe, subscriber]);
  
  // Return unsubscribe function for manual control
  return useCallback(() => {
    unsubscribe(id);
  }, [id, unsubscribe]);
};

/**
 * Hook for one-time clock subscription setup
 * Useful for components that need to set up subscriptions once
 * and then manage them manually.
 */
export const useClockSubscriptionManager = () => {
  const subscribe = useClockStore(state => state.subscribe);
  const unsubscribe = useClockStore(state => state.unsubscribe);
  const getSubscriber = useClockStore(state => state.getSubscriber);
  
  return {
    subscribe,
    unsubscribe,
    getSubscriber,
    isSubscribed: useCallback((id: string) => {
      return getSubscriber(id) !== undefined;
    }, [getSubscriber])
  };
};
