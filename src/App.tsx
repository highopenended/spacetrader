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

import { renderWindow } from './constants/windowRegistry';
import { resetGame } from './utils/resetGameUtils';
import { UIProvider, UIPopupComponent } from './contexts/UIContext';
import DragManager from './components/DragManager';

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




  const renderWindowComponent = (window: WindowData) => {
    const     windowController = {
      credits,
      gameTime,
      gamePhase,
      gameMode,
      beginWorkSession,
      overId: currentOverId, // Updated by DragManager
      dragNodeState: currentDragNodeState, // Updated by DragManager
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

  // Track overId for visual feedback animations
  const [currentOverId, setCurrentOverId] = React.useState<any>(null);
  const [currentDragNodeState, setCurrentDragNodeState] = React.useState<any>({ draggedAppType: null });

  // Combined props object
  const componentProps = {
    dndContext: {
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
      openAppTypes: new Set(windows.map(w => w.appType)),
      overId: currentOverId, // Updated by DragManager
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
    

    dragOverlay: {
      zIndex: 2000,
      dropAnimation: { duration: 0, easing: 'ease' },
      style: {
        // DRAG NODE SYSTEM: Position overlay at mouse cursor for drag indicator
        // This will be handled by DragManager internally
      }
    }
  };



  return (
    <UIProvider>
      <DragManager
        installedApps={installedApps}
        apps={apps}
        appOrder={appOrder}
        appPropsMap={appPropsMap}
        componentProps={componentProps}
        reorderApps={reorderApps}
        uninstallApp={uninstallApp}
        closeWindowsByAppType={closeWindowsByAppType}
        installAppOrder={installAppOrder}
        openOrCloseWindow={openOrCloseWindow}
        onOverIdChange={setCurrentOverId}
        onDragNodeStateChange={setCurrentDragNodeState}
      >
        <div className="App">
          <GameBackground backgroundId={gameBackground} />
          <DataReadout {...componentProps.dataReadout} />
          <TerminalScreen {...componentProps.terminalScreen} />
          <AdminToolbar {...componentProps.adminToolbar} />
          <UIPopupComponent />
          {windows.map(renderWindowComponent)}

          {gameMode === 'workMode' && <WorkScreen />}

/
        </div>
      </DragManager>
    </UIProvider>
  );
}

export default App;
