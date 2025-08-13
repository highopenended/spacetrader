import { QuickBarFlags } from '../../../types/quickBarState';
import React from 'react';
import DumpsterVisionOverlay from './DumpsterVisionOverlay';

export interface VisualOverlayEntry {
  id: string;
  Component: React.ComponentType<{ isExiting?: boolean }>;
  isActive: (flags: QuickBarFlags) => boolean;
  zIndex?: number;
}

export const OVERLAY_MANIFEST: VisualOverlayEntry[] = [
  {
    id: 'dumpsterVision',
    Component: DumpsterVisionOverlay,
    isActive: (flags) => flags.isActiveDumpsterVision,
    zIndex: 3000,
  },
];


