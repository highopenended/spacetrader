import React, { useState, useCallback } from 'react';
import './TerminalScreen.css';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { DOM_IDS } from '../../constants/domIds';
import SortableItem from '../scr-apps/SortableItem';
import DockWindowsButton from './DockWindowsButton';
import TerminalToggle from './TerminalToggle';
import { useDragContext } from '../../contexts/DragContext';
import { Z_LAYERS } from '../../constants/zLayers';

interface TerminalScreenProps {
  credits: number;
  gameTime: any; // Simplified type since we're not importing GameTime
  gamePhase: any; // Simplified type since we're not importing GamePhase
  isOnline?: boolean;
  onAppClick?: (appType: string, title: string, content?: React.ReactNode) => void;
  apps: any[];
  appOrder: string[];
  pendingDeleteAppId?: string | null;
  openAppTypes?: Set<string>;
  onDockWindows?: () => void;
  appPropsMap: Record<string, any>; // Pre-built app props from App.tsx
  shouldCollapse?: boolean; // Collapse trigger from parent (e.g., when work mode begins)
}

const TerminalScreen: React.FC<TerminalScreenProps> = ({
  isOnline = true,
  onAppClick,
  apps,
  appOrder,
  pendingDeleteAppId = null,
  openAppTypes = new Set(),
  onDockWindows,
  appPropsMap,
  shouldCollapse
}) => {
  // Terminal state
  const [terminalMode, setTerminalMode] = useState<'expanded' | 'collapsed'>('expanded');

  // Get drag context for visual feedback
  const { overId } = useDragContext();

  // WINDOW DOCKING SYSTEM: Make terminal droppable for window docking
  const { setNodeRef } = useDroppable({
    id: DOM_IDS.TERMINAL_DOCK,
  });

  const isDockActive = overId === DOM_IDS.TERMINAL_DOCK;



  // Toggle handler for expand/collapse
  const handleToggle = useCallback(() => {
    if (terminalMode === 'collapsed') {
      setTerminalMode('expanded');
    } else {
      setTerminalMode('collapsed');
    }
  }, [terminalMode]);

  // Collapse the terminal when instructed by parent (e.g., entering work mode)
  React.useEffect(() => {
    shouldCollapse ? setTerminalMode('collapsed') : setTerminalMode('expanded')
  }, [shouldCollapse]);

  // Render an app based on its configuration
  const renderApp = (appConfig: any) => {
    if (!appConfig) return null;

    const AppComponent = appConfig.component;
    const appProps = appPropsMap[appConfig.id]; // Use pre-built props from App.tsx

    return (
      <AppComponent
        {...appProps}
      />
    );
  };

  // Calculate height based on mode
  const getTerminalHeight = () => {
    switch (terminalMode) {
      case 'expanded':
        return '100vh';
      case 'collapsed':
        return 'auto'; // Let CSS handle the height
      default:
        return '100vh';
    }
  };

  return (
    <div
      className={`terminal-screen ${terminalMode}`}
      style={{ height: getTerminalHeight(), zIndex: Z_LAYERS.TERMINAL_BASE }}
    >
      <div className="terminal-header">
        <div className="terminal-title">
          SCRAPCOM TERMINAL
          {terminalMode === 'collapsed' && <span className="minimize-indicator"> [MIN]</span>}
        </div>
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <div className="status-light"></div>
          <div className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
        </div>
      </div>

      <div className="terminal-controls">
        <DockWindowsButton
          onDockWindows={onDockWindows || (() => { })}
          hasOpenWindows={openAppTypes.size > 0}
          openWindowCount={openAppTypes.size}
        />
        <TerminalToggle
          isMinimized={terminalMode === 'collapsed'}
          onToggle={handleToggle}
        />
      </div>

      <div
        ref={setNodeRef}
        className={`terminal-content${isDockActive ? ' dock-active' : ''}`}
      >
        <SortableContext
          items={appOrder}
          strategy={verticalListSortingStrategy}
        >
          {apps
            .filter((appConfig) => {
              const isPendingDelete = pendingDeleteAppId === appConfig.id;
              const isWindowOpen = openAppTypes.has(appConfig.id);
              return !isPendingDelete && !isWindowOpen;
            })
            .map((appConfig) => (
              <SortableItem
                key={appConfig.id}
                id={appConfig.id}
                onAppClick={() => onAppClick?.(appConfig.id, appConfig.name)}
              >
                {renderApp(appConfig)}
              </SortableItem>
            ))
          }
        </SortableContext>
      </div>


      <div className="terminal-scanlines" style={{ zIndex: Z_LAYERS.TERMINAL_SCANLINES }}></div>
    </div>
  );
};

export default TerminalScreen; 