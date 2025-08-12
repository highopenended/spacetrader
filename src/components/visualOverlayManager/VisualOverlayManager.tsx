import React from 'react';
import { QuickBarFlags } from '../../types/quickBarState';
import { OVERLAY_MANIFEST } from './overlays/overlayManifest';

interface VisualOverlayManagerProps {
  quickBarFlags: QuickBarFlags;
}

const DEFAULT_OVERLAY_Z = 2500;

const VisualOverlayManager: React.FC<VisualOverlayManagerProps> = ({ quickBarFlags }) => {
  const activeOverlays = OVERLAY_MANIFEST.filter(entry => entry.isActive(quickBarFlags))
    .sort((a, b) => (a.zIndex ?? DEFAULT_OVERLAY_Z) - (b.zIndex ?? DEFAULT_OVERLAY_Z));

  if (activeOverlays.length === 0) return null;

  return (
    <>
      {activeOverlays.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
};

export default VisualOverlayManager;


