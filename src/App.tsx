/**
 * CRITICAL ARCHITECTURAL RULE - READ BEFORE MAKING CHANGES:
 * 
 * SINGLE INSTANCE PATTERN: Each custom hook that manages state should be called 
 * exactly once at the top level of your app (App.tsx). This prevents the 
 * "multiple state instances" problem that keeps recurring.
 * 
 * ✅ CORRECT: State hooks only called in App.tsx, passed down as props
 * ❌ WRONG: Calling useGameState(), useWindowState(), etc. in child components
 * 
 * This rule prevents:
 * - Multiple state instances getting out of sync
 * - Save/load working with different state than UI
 * - Components showing different values for same data
 * 
 * ENFORCE THIS PATTERN: If you need state in a component, get it from props,
 * not by calling the hook directly.
 */

import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import WorkScreen from './components/workMode/workScreen/WorkScreen';
import GameBackground from './components/gameBackgrounds/GameBackground';
import { useGameState } from './hooks/useGameState';
import { useWindowState } from './hooks/useWindowState';
import { useDragHandler_Router } from './hooks/useDragHandler_Router';
import { useSaveLoad } from './hooks/useSaveLoad';
import { useToggleState } from './hooks/useToggleState';
import { WindowData } from './types/windowState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';
import { renderWindow } from './constants/windowRegistry';
import { resetGame } from './utils/resetGameUtils';

import { DndContext, DragOverlay, useSensor, PointerSensor } from '@dnd-kit/core';
import { getAppPropsMap } from './utils/appPropsBuilder';
import DataReadout from './components/DataReadout';

function App() {
  const {
    // Core state
    credits,
    gamePhase,
    gameTime,
    isPaused,
    apps,
    appOrder,
    installedApps,
    gameMode,
    gameBackground,

    // Actions
    updateCredits,
    setCredits,
    setGamePhase,
    advanceGamePhase,
    setGameTime,
    pauseTime,
    resumeTime,
    installApp,
    uninstallApp,
    reorderApps,
    installAppOrder,
    getAvailableApps,
    resetToDefaults,
    resetGameState,
    beginWorkSession,
    setGameBackground,
    encodeGameState,
    decodeGameState,
    getAppTierData,
    changeAppTier
  } = useGameState();

  const {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    closeWindow,
    closeWindowsByAppType,
    bringToFront,
    dockAllWindows,
    resetWindowState,
    encodeWindowState,
    decodeWindowState
  } = useWindowState();

  // Add toggle state hook (single instance pattern)
  const {
    toggleStates,
    setToggleState,
    resetToggleState,
    encodeToggleState,
    decodeToggleState
  } = useToggleState();

  // Create save/load functions with all encode/decode functions
  const {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  } = useSaveLoad(credits, updateCredits, encodeGameState, decodeGameState, encodeWindowState, decodeWindowState, encodeToggleState, decodeToggleState);

  // Create reset function that coordinates all state resets
  const handleResetGame = () => {
    resetGame({
      resetGameState,
      resetWindowState,
      resetToggleState
    });
  };

  // Use centralized drag handler router
  const {
    overId,
    setOverId,
    isOverTerminalDropZone,
    setIsOverTerminalDropZone,
    appDragMousePosition,
    pendingDelete,
    dragNodeState,
    dragState,
    customCollisionDetection,
    handleUnifiedDragStart,
    handleUnifiedDragEnd,
    handleConfirmPurge,
    handleCancelPurge
  } = useDragHandler_Router({
    installedApps,
    onAppsReorder: reorderApps,
    onAppUninstall: uninstallApp,
    closeWindowsByAppType,
    installAppOrder
  });


  const renderWindowComponent = (window: WindowData) => {
    const windowController = {
      credits,
      gameTime,
      gamePhase,
      gameMode,
      beginWorkSession,
      overId,
      dragNodeState,
      updateCredits,
      getAvailableApps,
      installedApps,
      installApp,
      encodeGameState,
      decodeGameState,
      getAppTierData,
      changeAppTier,
      encodeWindowState,
      decodeWindowState,
      saveToLocalCache,
      loadFromLocalCache,
      exportToFile,
      importFromFile,
      SAVE_COST
    };

    const toggleData = {
      toggleStates,
      setToggleState
    };

    const windowManager = {
      closeWindow,
      updateWindowPosition,
      updateWindowSize,
      bringToFront
    };

    return renderWindow(window, windowController, windowManager, toggleData);
  };

  // Build app props map for TerminalScreen
  const appPropsMap = getAppPropsMap(apps, { credits, gameTime, gamePhase });

  // Combined props object
  const componentProps = {
    dndContext: {
      collisionDetection: customCollisionDetection,
      onDragStart: handleUnifiedDragStart,
      onDragOver: (event: any) => {
        const newOverId = event.over?.id ?? null;
        setOverId(newOverId);
        
        // Check if we're over the TerminalScreen (either terminal-dock-zone or any app in the terminal)
        const isOverTerminal = newOverId === 'terminal-dock-zone' || 
                             (newOverId && event.active?.data?.current?.type === 'app-drag-node');
        setIsOverTerminalDropZone(isOverTerminal);
      },
              onDragEnd: (event: any) => {
          handleUnifiedDragEnd(event, apps, appOrder);
          
          // APP UNDOCK FEATURE: Open app as window when dropped outside terminal
          const { active, over } = event;
          if (active?.data?.current?.type === 'app-drag-node' && 
              !over && 
              !isOverTerminalDropZone) {
            // App was dropped outside terminal and not over any drop zone
            const appId = active.id;
            const appConfig = apps.find(app => app.id === appId);
            if (appConfig) {
                                      // Open window at drop coordinates (centered on drop point)
            if (appDragMousePosition) {
              openOrCloseWindow(appId, appConfig.name, undefined, appDragMousePosition);
            } else {
              openOrCloseWindow(appId, appConfig.name);
            }
            }
          }
          
          // Reset overId and terminal state when drag ends
          setOverId(null);
          setIsOverTerminalDropZone(false);
        },
      sensors: [
        useSensor(PointerSensor, {
          activationConstraint: { distance: 10 },
        }),
      ]
    },
    dataReadout: {
      toggleStates,
      gameMode,
      beginWorkSession,
      credits,
      gameTime,
      gamePhase,
      installedApps
    },
    terminalScreen: {
      credits,
      gameTime,
      gamePhase,
      isOnline: !isPaused,
      onAppClick: openOrCloseWindow,
      apps,
      appOrder,
      pendingDeleteAppId: pendingDelete.appId,
      openAppTypes: new Set(windows.map(w => w.appType)),
      overId,
      onDockWindows: dockAllWindows,
      appPropsMap
    },
    adminToolbar: {
      credits,
      gamePhase,
      gameTime,
      updateCredits,
      setCredits,
      setGamePhase,
      setGameTime,
      advanceGamePhase,
      isPaused,
      pauseTime,
      resumeTime,
      resetGame: handleResetGame,
      setGameBackground
    },
    purgeConfirm: {
      open: !!pendingDelete.appId,
      appName: pendingDelete.appId ? (apps.find((a: any) => a.id === pendingDelete.appId)?.name || pendingDelete.appId) : '',
      onConfirm: handleConfirmPurge,
      onCancel: handleCancelPurge
    },

    dragOverlay: {
      zIndex: 2000,
      dropAnimation: { duration: 0, easing: 'ease' },
      style: {
        // DRAG NODE SYSTEM: Position overlay at mouse cursor for drag indicator
        ...(dragNodeState.isDragNodeDragging && dragNodeState.mousePosition && {
          position: 'fixed' as const,
          left: dragNodeState.mousePosition.x - 6, // Center 12px indicator on cursor
          top: dragNodeState.mousePosition.y - 6,
          transform: 'none', // Override @dnd-kit's transform
          pointerEvents: 'none' as const
        })
      }
    }
  };

  // DragOverlay content helper (purely visual, for ghost image of app being dragged)
  const renderDragOverlay_AppGhost = () => {
    // STANDARD DRAG SYSTEM: Full app preview for app list reordering
    if (dragState.isDragging && dragState.draggedAppId) {
      const appConfig = apps.find(app => app.id === dragState.draggedAppId);
      if (!appConfig) return null;

      const AppComponent = appConfig.component;
      const appProps = appPropsMap[appConfig.id];

      return (
        <DragOverlay {...componentProps.dragOverlay}>
          <div
            className={`sortable-item dragging`}
            style={{ opacity: 0.8, position: 'relative' }}
          >
            <AppComponent {...appProps} />
          </div>
        </DragOverlay>
      );
    }

    return null;
  };

  const renderDragOverlay_PurgeNode = () => {
    // DRAG NODE SYSTEM: Tiny mouse-cursor-sized indicator for window deletion
    if (dragNodeState.isDragNodeDragging) {
      return (
        <DragOverlay {...componentProps.dragOverlay}>
          <div
            className="purge-node-drag-indicator"
            style={{
              width: '12px',
              height: '12px',
              background: 'linear-gradient(135deg, #ff4444 0%, #aa2222 100%)',
              border: '1px solid #ff6666',
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(255, 68, 68, 0.6)',
              opacity: 0.9,
              pointerEvents: 'none'
            }}
            title={`Deleting: ${dragNodeState.draggedWindowTitle}`}
          />
        </DragOverlay>
      );
    }

    return null;
  };

  return (
    <DndContext {...componentProps.dndContext}>
      <div className="App">
        <GameBackground backgroundId={gameBackground} />
        <DataReadout {...componentProps.dataReadout} />
        <TerminalScreen {...componentProps.terminalScreen} />
        <AdminToolbar {...componentProps.adminToolbar} />
        <PurgeConfirmPopup {...componentProps.purgeConfirm} />
        {windows.map(renderWindowComponent)}

        {gameMode === 'workMode' && <WorkScreen />}

        {/* Debug readout for overId and drag type */}
        {/* <div
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            zIndex: 9999,
            border: '1px solid #333',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
          }}
        >
          overId: {overId || 'null'}
          <br />
          dragType: {dragState.isDragging ? 'app-drag-node' : dragNodeState.isDragNodeDragging ? 'window-drag-node' : 'none'}
          <br />
          overTerminal: {isOverTerminalDropZone ? 'true' : 'false'}
          <br />
          appDragPos: {appDragMousePosition ? `${appDragMousePosition.x}, ${appDragMousePosition.y}` : 'null'}
        </div> */}

        {renderDragOverlay_AppGhost()}
        {renderDragOverlay_PurgeNode()}
      </div>
    </DndContext>
  );
}

export default App;
