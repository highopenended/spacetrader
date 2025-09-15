 import React from 'react';
import { useQuickBarStore } from '../../stores';
import { OVERLAY_MANIFEST } from './overlays/overlayManifest';
import { AnimationState, ANIMATION_DURATIONS } from './types';

interface VisualOverlayManagerProps {}

const DEFAULT_OVERLAY_Z = 2500;

const VisualOverlayManager: React.FC<VisualOverlayManagerProps> = () => {
  // Get quick bar flags from store
  const quickBarFlags = useQuickBarStore(state => state.quickBarFlags);
  // Keep overlays mounted briefly after they deactivate to allow exit animations
  const [mounted, setMounted] = React.useState<Record<string, { exiting: boolean }>>({});
  // Track animation state for each overlay
  const [animationStates, setAnimationStates] = React.useState<Record<string, AnimationState>>({});
  // Track active timers for cleanup
  const timersRef = React.useRef<Record<string, { boot?: number; shutdown?: number }>>({});

  React.useEffect(() => {
    OVERLAY_MANIFEST.forEach(({ id, isActive }) => {
      const active = isActive(quickBarFlags);
      const currentAnimationState = animationStates[id] || 'idle';
      
      setMounted(prev => {
        const next = { ...prev };
        const entry = next[id];
        
        if (active) {
          // Overlay should be active
          if (!entry) {
            // Mount the overlay and start booting
            next[id] = { exiting: false };
            setAnimationStates(prevStates => ({
              ...prevStates,
              [id]: 'booting'
            }));
            
            // Set timer to complete boot sequence
            const bootTimer = window.setTimeout(() => {
              setAnimationStates(prevStates => ({
                ...prevStates,
                [id]: 'idle'
              }));
            }, ANIMATION_DURATIONS.BOOT_SEQUENCE);
            
            // Store timer for potential cleanup
            if (!timersRef.current[id]) timersRef.current[id] = {};
            timersRef.current[id].boot = bootTimer;
          } else if (currentAnimationState === 'shutting-down') {
            // Abort shutdown and start booting
            setAnimationStates(prevStates => ({
              ...prevStates,
              [id]: 'booting'
            }));
            
            // Clear any existing shutdown timer
            const shutdownTimer = (window as any)[`shutdownTimer_${id}`];
            if (shutdownTimer) {
              window.clearTimeout(shutdownTimer);
              delete (window as any)[`shutdownTimer_${id}`];
            }
            
            // Set new boot timer
            const bootTimer = window.setTimeout(() => {
              setAnimationStates(prevStates => ({
                ...prevStates,
                [id]: 'idle'
              }));
            }, ANIMATION_DURATIONS.BOOT_SEQUENCE);
            
            (window as any)[`bootTimer_${id}`] = bootTimer;
          }
        } else {
          // Overlay should be inactive
          if (entry && !entry.exiting) {
            // Start shutdown sequence
            next[id] = { exiting: true };
            setAnimationStates(prevStates => ({
              ...prevStates,
              [id]: 'shutting-down'
            }));
            
            // Clear any existing boot timer
            const bootTimer = (window as any)[`bootTimer_${id}`];
            if (bootTimer) {
              window.clearTimeout(bootTimer);
              delete (window as any)[`bootTimer_${id}`];
            }
            
            // Set shutdown timer
            const shutdownTimer = window.setTimeout(() => {
              setMounted(curr => {
                const copy = { ...curr };
                delete copy[id];
                return copy;
              });
              setAnimationStates(prevStates => {
                const next = { ...prevStates };
                delete next[id];
                return next;
              });
            }, ANIMATION_DURATIONS.SHUTDOWN_SEQUENCE);
            
            (window as any)[`shutdownTimer_${id}`] = shutdownTimer;
          }
        }
        return next;
      });
    });
  }, [quickBarFlags, animationStates]);

  const entriesToRender = OVERLAY_MANIFEST
    .filter(({ id }) => mounted[id])
    .sort((a, b) => (a.zIndex ?? DEFAULT_OVERLAY_Z) - (b.zIndex ?? DEFAULT_OVERLAY_Z));

  if (entriesToRender.length === 0) return null;

  return (
    <>
      {entriesToRender.map(({ id, Component }) => (
        <Component 
          key={id} 
          isExiting={mounted[id].exiting} 
          animationState={animationStates[id] || 'idle'}
        />
      ))}
    </>
  );
};

export default VisualOverlayManager;


