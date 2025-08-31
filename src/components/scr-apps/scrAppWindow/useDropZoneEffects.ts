/**
 * Drop Zone Effects Hook (colocated with ScrAppWindow)
 *
 * Handles all visual effects when windows are dragged over drop zones.
 * Consolidates the repetitive conditional styling from ScrAppWindow.tsx.
 */

import { useMemo } from 'react';
import { DOM_IDS } from '../../../constants/domIds';

interface DropZoneEffects {
  isOverPurgeZone: boolean;
  isOverTerminalDock: boolean;
  windowStyles: React.CSSProperties;
  headerStyles: React.CSSProperties;
  buttonStyles: React.CSSProperties;
  contentStyles: React.CSSProperties;
  resizeHandleStyles: React.CSSProperties;
  showDockOverlay: boolean;
  debugText: string | null;
}

export const useWindowDropZoneEffects = (
  overId: string | null,
  draggedAppType: string | null,
  appType: string
): DropZoneEffects => {
  const isOverPurgeZone = (overId === DOM_IDS.PURGE_ZONE_WINDOW || overId === DOM_IDS.PURGE_ZONE_WORKMODE) && draggedAppType === appType;
  const isOverTerminalDock = overId === DOM_IDS.TERMINAL_DOCK && draggedAppType === appType;

  const effects = useMemo((): DropZoneEffects => {
    // Base styles (no effects)
    const baseStyles: React.CSSProperties = {};

    // Purge zone styles (red corruption)
    const purgeStyles = {
      background:
        'linear-gradient(135deg, #1a0000 0%, #330000 50%, #1a0000 100%), repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(255, 0, 0, 0.1) 2px, rgba(255, 0, 0, 0.1) 4px)',
      borderColor: '#ff0000',
      boxShadow:
        '0 0 10px rgba(255, 0, 0, 0.6), inset 0 0 20px rgba(255, 0, 0, 0.1), 0 0 30px rgba(255, 0, 0, 0.3)',
      filter: 'contrast(1.08) brightness(1.04)',
      animation: 'terminal-corruption 0.18s infinite, surge-cycle 6s infinite',
      color: '#ff4444',
      textShadow: '0 0 2px #ff0000, 0 0 6px #ff0000'
    };

    // Terminal dock styles (green glow)
    const dockStyles = {
      background: 'linear-gradient(135deg, #001a00 0%, #002a00 100%)',
      borderColor: '#4a4',
      boxShadow: '0 0 8px rgba(68, 170, 68, 0.4), inset 0 0 15px rgba(68, 170, 68, 0.1)',
      color: '#4a4',
      textShadow: '0 0 2px #4a4, 0 0 6px #4a4'
    };

    if (isOverPurgeZone) {
      return {
        isOverPurgeZone: true,
        isOverTerminalDock: false,
        windowStyles: {
          ...purgeStyles,
          transform: undefined,
          transition: undefined
        },
        headerStyles: {
          background: 'linear-gradient(135deg, #2a0000 0%, #440000 100%)',
          borderBottomColor: '#ff0000',
          boxShadow: '0 0 5px rgba(255, 0, 0, 0.5)',
          textShadow: '0 0 2px #ff0000, 0 0 6px #ff0000'
        },
        buttonStyles: {
          background: 'linear-gradient(135deg, #2a0a0a 0%, #440000 100%)',
          borderColor: '#ff0000',
          color: '#ff4444',
          textShadow: '0 0 2px #ff0000',
          boxShadow: '0 0 4px rgba(255, 0, 0, 0.3)'
        },
        contentStyles: {
          filter: undefined,
          transition: undefined
        },
        resizeHandleStyles: {
          background:
            'linear-gradient(135deg, transparent 0%, transparent 40%, #ff0000 50%, transparent 60%, transparent 100%)',
          filter: 'drop-shadow(0 0 2px #ff0000)'
        },
        showDockOverlay: false,
        debugText: 'PURGE RISK'
      };
    }

    if (isOverTerminalDock) {
      return {
        isOverPurgeZone: false,
        isOverTerminalDock: true,
        windowStyles: {
          ...dockStyles,
          transform: 'scale(0.85)',
          transition: 'transform 0.2s ease-out'
        },
        headerStyles: {
          background: 'linear-gradient(135deg, #002a00 0%, #004400 100%)',
          borderBottomColor: '#4a4',
          boxShadow: '0 0 5px rgba(68, 170, 68, 0.5)',
          textShadow: '0 0 2px #4a4, 0 0 6px #4a4'
        },
        buttonStyles: {
          background: 'linear-gradient(135deg, #0a2a0a 0%, #004400 100%)',
          borderColor: '#4a4',
          color: '#4a4',
          textShadow: '0 0 2px #4a4',
          boxShadow: '0 0 4px rgba(68, 170, 68, 0.3)'
        },
        contentStyles: {
          filter: 'blur(2px)',
          transition: 'filter 0.2s ease-out'
        },
        resizeHandleStyles: {
          background:
            'linear-gradient(135deg, transparent 0%, transparent 40%, #4a4 50%, transparent 60%, transparent 100%)',
          filter: 'drop-shadow(0 0 2px #4a4)'
        },
        showDockOverlay: true,
        debugText: 'DOCK READY'
      };
    }

    // No effects
    return {
      isOverPurgeZone: false,
      isOverTerminalDock: false,
      windowStyles: baseStyles,
      headerStyles: baseStyles,
      buttonStyles: baseStyles,
      contentStyles: baseStyles,
      resizeHandleStyles: baseStyles,
      showDockOverlay: false,
      debugText: null
    };
  }, [isOverPurgeZone, isOverTerminalDock]);

  return effects;
};


