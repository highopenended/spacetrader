/**
 * Clock System Type Definitions
 * 
 * Type definitions for the global clock system that manages timing
 * for all game systems including physics, animations, and effects.
 */

/**
 * Clock subscriber callback function
 * @param deltaTime - Raw time elapsed since last frame (milliseconds)
 * @param scaledDeltaTime - Time scaled by timeScale (milliseconds)
 * @param tickCount - Total number of ticks since clock started
 */
export type ClockTickCallback = (
  deltaTime: number,
  scaledDeltaTime: number, 
  tickCount: number
) => void;

/**
 * Clock subscriber configuration
 */
export interface ClockSubscriber {
  /** Unique identifier for this subscriber */
  id: string;
  
  /** Callback function called on each clock tick */
  callback: ClockTickCallback;
  
  /** Optional execution priority (lower numbers execute first) */
  priority?: number;
  
  /** Optional human-readable name for debugging */
  name?: string;
}

/**
 * Clock performance metrics for debugging
 */
export interface ClockMetrics {
  /** Current frames per second */
  fps: number;
  
  /** Average frame time over last 60 frames */
  averageFrameTime: number;
  
  /** Number of active subscribers */
  subscriberCount: number;
  
  /** Total ticks since clock started */
  totalTicks: number;
  
  /** Time spent processing subscribers last frame (ms) */
  lastTickProcessingTime: number;
}
