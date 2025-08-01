/**
 * CRITICAL ARCHITECTURAL RULE - READ BEFORE MAKING CHANGES:
 * 
 * SINGLE INSTANCE PATTERN: Each custom hook that manages state should be called 
 * exactly once at the top level of your app (App.tsx). This prevents the 
 * "multiple state instances" problem that keeps recurring.
 * 
 * ✅ CORRECT: State hooks only called in App.tsx, passed down as props
 * ❌ WRONG: Calling useGameState(), useWindowManager(), etc. in child components
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
import { useWindowManager } from './hooks/useWindowManager';
import { useDragHandler_Apps } from './hooks/useDragHandler_Apps';
import { useCustomCollisionDetection } from './hooks/useCustomCollisionDetection';
import { usePurgeZoneDrag } from './hooks/usePurgeZoneDrag';
import { useSaveLoad } from './hooks/useSaveLoad';
import { WindowData } from './types/gameState';
import PurgeConfirmPopup from './components/ui/PurgeConfirmPopup';
import { renderWindow } from './constants/windowRegistry';

import { DndContext, DragOverlay, useSensor, PointerSensor } from '@dnd-kit/core';
import { getAppPropsMap } from './utils/appPropsBuilder';
import { ToggleProvider } from './contexts/ToggleContext';
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
    resetGame,
    beginWorkSession,
    setGameBackground,
    encodeGameState,
    decodeGameState,
    getAppTierData,
    changeAppTier
  } = useGameState();

  // Set up app drag handler
  const { dragState, handleDragStart, handleDragOver, handleDragEnd } = useDragHandler_Apps({
    installedApps,
    onAppsReorder: reorderApps,
    onAppUninstall: uninstallApp
  });

  const {
    windows,
    updateWindowPosition,
    updateWindowSize,
    openOrCloseWindow,
    closeWindow,
    closeWindowsByAppType,
    bringToFront,
    dockAllWindows,
    encodeWindowState,
    decodeWindowState
  } = useWindowManager();

  // Create save/load functions with all encode/decode functions
  const {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  } = useSaveLoad(credits, updateCredits, encodeGameState, decodeGameState, encodeWindowState, decodeWindowState);

  // Use purge zone drag hook
  const {
    purgeNodeDragState,
    pendingDelete,
    overId,
    handleUnifiedDragStart,
    handleUnifiedDragEnd,
    handleConfirmPurge,
    handleCancelPurge,
    setOverId
  } = usePurgeZoneDrag({
    closeWindowsByAppType,
    uninstallApp,
    installAppOrder
  });



  // Use custom collision detection hook
  const { customCollisionDetection } = useCustomCollisionDetection();


  const renderWindowComponent = (window: WindowData) => {
    const gameState = {
      credits,
      gameTime,
      gamePhase,
      overId,
      purgeNodeDragState,
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

    const windowManager = {
      closeWindow,
      updateWindowPosition,
      updateWindowSize,
      bringToFront
    };

    return renderWindow(window, gameState, windowManager);
  };

  // Build app props map for TerminalScreen
  const appPropsMap = getAppPropsMap(apps, { credits, gameTime, gamePhase });

  // Combined props object
  const componentProps = {
    toggleProvider: {
      installedApps,
      gameMode,
      onBeginWorkSession: beginWorkSession,
      credits,
      gameTime,
      gamePhase
    },
    dndContext: {
      collisionDetection: customCollisionDetection,
      onDragStart: (event: any) => handleUnifiedDragStart(event, handleDragStart),
      onDragOver: (event: any) => setOverId(event.over?.id ?? null),
      onDragEnd: (event: any) => handleUnifiedDragEnd(event, apps, appOrder, handleDragEnd),
      sensors: [
        useSensor(PointerSensor, {
          activationConstraint: { distance: 10 },
        }),
      ]
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
      resetGame,
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
        // PURGE NODE DRAG SYSTEM: Position overlay at mouse cursor for purge indicator
        ...(purgeNodeDragState.isPurgeNodeDragging && purgeNodeDragState.mousePosition && {
          position: 'fixed' as const,
          left: purgeNodeDragState.mousePosition.x - 6, // Center 12px indicator on cursor
          top: purgeNodeDragState.mousePosition.y - 6,
          transform: 'none', // Override @dnd-kit's transform
          pointerEvents: 'none' as const
        })
      }
    }
  };

  // DragOverlay content helper
  const renderDragOverlayContent = () => {
    // PURGE NODE DRAG SYSTEM: Tiny mouse-cursor-sized indicator for window deletion
    if (purgeNodeDragState.isPurgeNodeDragging) {
      return (
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
              title={`Deleting: ${purgeNodeDragState.draggedWindowTitle}`}
            />
      );
    }
    
    // STANDARD DRAG SYSTEM: Full app preview for app list reordering
    if (dragState.isDragging && dragState.draggedAppId) {
      const appConfig = apps.find(app => app.id === dragState.draggedAppId);
      if (!appConfig) return null;
      
      const AppComponent = appConfig.component;
      const appProps = appPropsMap[appConfig.id];

      return (
            <div 
              className={`sortable-item dragging`}
              style={{ opacity: 0.8, position: 'relative' }}
            >
          <AppComponent {...appProps} />
        </div>
      );
    }
    
    return null;
  };

  return (
    <ToggleProvider {...componentProps.toggleProvider}>
      <DndContext {...componentProps.dndContext}>

        <div className="App">
          <GameBackground backgroundId={gameBackground} />
          <DataReadout />
          <TerminalScreen {...componentProps.terminalScreen} />
          <AdminToolbar {...componentProps.adminToolbar} />
          <PurgeConfirmPopup {...componentProps.purgeConfirm} />
          {windows.map(renderWindowComponent)}

          {gameMode === 'workMode' && <WorkScreen />}
    
          <DragOverlay {...componentProps.dragOverlay}>
            {renderDragOverlayContent()}
        </DragOverlay>
      </div>
      </DndContext>
    </ToggleProvider>
  );
}

export default App;
