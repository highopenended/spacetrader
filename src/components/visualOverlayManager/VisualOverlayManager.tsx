import React from 'react';
import { useQuickBarStore } from '../../stores';
import { OVERLAY_MANIFEST } from './overlays/overlayManifest';

interface VisualOverlayManagerProps {}

const DEFAULT_OVERLAY_Z = 2500;

const VisualOverlayManager: React.FC<VisualOverlayManagerProps> = () => {
  // Get quick bar flags from store
  const quickBarFlags = useQuickBarStore(state => state.quickBarFlags);
  // Keep overlays mounted briefly after they deactivate to allow exit animations
  const [mounted, setMounted] = React.useState<Record<string, { exiting: boolean }>>({});

  React.useEffect(() => {
    OVERLAY_MANIFEST.forEach(({ id, isActive }) => {
      const active = isActive(quickBarFlags);
      setMounted(prev => {
        const next = { ...prev };
        const entry = next[id];
        if (active) {
          if (!entry) next[id] = { exiting: false };
        } else {
          if (entry && !entry.exiting) {
            next[id] = { exiting: true };
            // Remove after exit duration
            window.setTimeout(() => {
              setMounted(curr => {
                const copy = { ...curr };
                delete copy[id];
                return copy;
              });
            }, 800); // match shutdown animation length
          }
        }
        return next;
      });
    });
  }, [quickBarFlags]);

  const entriesToRender = OVERLAY_MANIFEST
    .filter(({ id }) => mounted[id])
    .sort((a, b) => (a.zIndex ?? DEFAULT_OVERLAY_Z) - (b.zIndex ?? DEFAULT_OVERLAY_Z));

  if (entriesToRender.length === 0) return null;

  return (
    <>
      {entriesToRender.map(({ id, Component }) => (
        <Component key={id} isExiting={mounted[id].exiting} />
      ))}
    </>
  );
};

export default VisualOverlayManager;


