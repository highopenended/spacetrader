/**
 * MIGRATED TO ZUSTAND ARCHITECTURE:
 * 
 * Game state is now managed by Zustand stores instead of custom hooks.
 * This eliminates prop drilling and allows components to directly access
 * only the state they need, preventing unnecessary re-renders.
 * 
 * ✅ ZUSTAND PATTERN: Components use selective store subscriptions
 * ❌ OLD PATTERN: All state passed down as props from App.tsx
 * 
 * Benefits:
 * - No more massive prop objects
 * - Selective subscriptions prevent unnecessary re-renders
 * - Components declare exactly what state they need
 * - Automatic single instance pattern (stores are singletons)
 */

import React from 'react';
import TerminalScreen from './components/terminalScreen/TerminalScreen';
import AdminToolbar from './components/adminToolbar/AdminToolbar';
import WorkScreen from './components/workMode/workScreen/WorkScreen';
import GameBackground from './components/gameBackgrounds/GameBackground';
import { useGameStore, useUpgradesStore, useToggleStore, useWindowStore } from './stores';
import { useSaveLoad } from './hooks/useSaveLoad';
import { WindowData } from './types/windowState';

import { renderWindow } from './constants/windowRegistry';
import { resetGame } from './utils/resetGameUtils';
import { UIProvider, UIPopupComponent } from './contexts/UIContext';
import DragManager from './components/DragManager';

import DataReadout from './components/DataReadout';
import QuickKeysBar from './components/quickKeys/QuickKeysBar';
import KeyboardManager from './components/KeyboardManager';
import QuickBarManager from './components/QuickBarManager';
import VisualOverlayManager from './components/visualOverlayManager/VisualOverlayManager';
import GameOptionsGear from './components/gameOptions/gameOptionsGear/GameOptionsGear';
import GameOptionsMenu from './components/gameOptions/gameOptionsMenu/GameOptionsMenu';
import { useQuickBarState } from './hooks/useQuickBarState';
import { useProfileState } from './hooks/useProfileState';
import { useEndingsState } from './hooks/useEndingsState';
import { ENDINGS_REGISTRY } from './constants/endingsRegistry';
import EndingCutscene from './components/endings/EndingCutscene';

function App() {  
  // ===== ZUSTAND GAME STORE SELECTORS =====
  // Core state - using selective subscriptions for better performance
  const credits = useGameStore(state => state.credits);
  const gamePhase = useGameStore(state => state.gamePhase);
  const gameTime = useGameStore(state => state.gameTime);
  const isPaused = useGameStore(state => state.isPaused);
  const apps = useGameStore(state => state.apps);
  const appOrder = useGameStore(state => state.appOrder);
  const installedApps = useGameStore(state => state.installedApps);
  const gameMode = useGameStore(state => state.gameMode);
  const gameBackground = useGameStore(state => state.gameBackground);

  // Actions - these don't cause re-renders when called
  const updateCredits = useGameStore(state => state.updateCredits);
  const setCredits = useGameStore(state => state.setCredits);
  const setGamePhase = useGameStore(state => state.setGamePhase);
  const advanceGamePhase = useGameStore(state => state.advanceGamePhase);
  const setGameTime = useGameStore(state => state.setGameTime);
  const pauseTime = useGameStore(state => state.pauseTime);
  const resumeTime = useGameStore(state => state.resumeTime);
  const installApp = useGameStore(state => state.installApp);
  const uninstallApp = useGameStore(state => state.uninstallApp);
  const reorderApps = useGameStore(state => state.reorderApps);
  const installAppOrder = useGameStore(state => state.installAppOrder);
  const getAvailableApps = useGameStore(state => state.getAvailableApps);
  const beginWorkSession = useGameStore(state => state.beginWorkSession);
  const setGameBackground = useGameStore(state => state.setGameBackground);
  const encodeGameState = useGameStore(state => state.encodeGameState);
  const decodeGameState = useGameStore(state => state.decodeGameState);


  // Quick Bar state
  const { quickBarFlags, setQuickBarFlag, quickBarConfig } = useQuickBarState();

  // Enhanced uninstallApp that clears upgrades and turns off related features (defined later after endings state)

  // ===== ZUSTAND WINDOW STORE SELECTORS =====
  // Window state - using selective subscriptions for better performance
  const windows = useWindowStore(state => state.windows);
  
  // Window actions - these don't cause re-renders when called
  const updateWindowPosition = useWindowStore(state => state.updateWindowPosition);
  const updateWindowSize = useWindowStore(state => state.updateWindowSize);
  const openOrCloseWindow = useWindowStore(state => state.openOrCloseWindow);
  const closeWindow = useWindowStore(state => state.closeWindow);
  const closeWindowsByAppType = useWindowStore(state => state.closeWindowsByAppType);
  const bringToFront = useWindowStore(state => state.bringToFront);
  const dockAllWindows = useWindowStore(state => state.dockAllWindows);
  const encodeWindowState = useWindowStore(state => state.encodeWindowState);
  const decodeWindowState = useWindowStore(state => state.decodeWindowState);

  // Toggle state from Zustand store (selective subscriptions)
  const toggleStates = useToggleStore(state => state.toggleStates);
  const setToggleState = useToggleStore(state => state.setToggleState);
  const encodeToggleState = useToggleStore(state => state.encodeToggleState);
  const decodeToggleState = useToggleStore(state => state.decodeToggleState);

  // Profile state (single instance)
  const {
    profileState,
    addEndingAchieved,
    encodeProfileState,
    decodeProfileState
  } = useProfileState();

  // Endings state (single instance) - needs addEndingAchieved from profile hook
  const {
    endingState,
    checkForEndingTriggers,
    clearActiveEnding
  } = useEndingsState(addEndingAchieved);

  // Enhanced uninstallApp that clears upgrades and turns off related features
  const uninstallAppWithUpgradeClearing = React.useCallback((appId: string) => {
    // Clear upgrades first - access upgradesStore directly
    const { clearUpgradesForApp } = useUpgradesStore.getState();
    clearUpgradesForApp(appId);
    
    // Turn off Dumpster Vision if that app is being uninstalled
    if (appId === 'dumpsterVision') {
      setQuickBarFlag('isActiveDumpsterVision', false);
    }
    
    // Check for recursive purge ending (purge zone deleting itself)
    if (appId === 'purgeZone') {
      // Trigger the recursive purge ending
      const { isPurchased } = useUpgradesStore.getState();
      const triggerData = {
        event: 'app-purged' as const,
        appId: appId,
        isWorkModePurge: false,
        isUpgradePurchased: isPurchased,
        installedApps: installedApps.map(app => app.id)
      };
      
      // Trigger only the recursive purge ending
      const recursivePurgeRegistry = { recursivePurge: ENDINGS_REGISTRY.recursivePurge };
      checkForEndingTriggers(triggerData, recursivePurgeRegistry);
    }
    
    // Then uninstall app
    uninstallApp(appId);
  }, [uninstallApp, setQuickBarFlag, installedApps, checkForEndingTriggers]);

  // Create save/load functions with all encode/decode functions
  const {
    saveToLocalCache,
    loadFromLocalCache,
    exportToFile,
    importFromFile,
    SAVE_COST
  } = useSaveLoad(credits, updateCredits, encodeGameState, decodeGameState, encodeWindowState, decodeWindowState, encodeToggleState, decodeToggleState, encodeProfileState, decodeProfileState);

  // Create reset function that coordinates all state resets
  const handleResetGame = React.useCallback(() => {
    resetGame();
    // Note: Profile state is NOT reset when resetting game
  }, []);

  // Options menu state
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = React.useState(false);

  // Options menu handlers
  const handleOptionsClick = React.useCallback(() => {
    setIsOptionsMenuOpen(true);
  }, []);

  const handleOptionsClose = React.useCallback(() => {
    setIsOptionsMenuOpen(false);
  }, []);

  // Admin trigger function for testing endings
  const triggerEnding = React.useCallback((endingId: string) => {
    console.log('triggerEnding: called with ID', endingId);
    const ending = ENDINGS_REGISTRY[endingId];
    console.log('triggerEnding: found ending', ending);
    
    if (ending) {
      // For admin testing, directly trigger the specific ending
      const activeEnding = {
        ending,
        triggeredAt: Date.now()
      };
      
      console.log('triggerEnding: setting active ending', activeEnding);

      
      // We need to manually call the ending state setter here
      // For now, let's use the trigger system but with a more specific approach
      const { isPurchased } = useUpgradesStore.getState();
      const triggerData = {
        event: 'app-purged' as const,
        appId: endingId,
        isWorkModePurge: false,
        isUpgradePurchased: isPurchased,
        installedApps: installedApps.map(app => app.id)
      };
      
      // Create a single-ending registry for this test
      const singleEndingRegistry = { [endingId]: ending };
      checkForEndingTriggers(triggerData, singleEndingRegistry);
    }
  }, [checkForEndingTriggers, installedApps]);




  const renderWindowComponent = (window: WindowData) => {
    const windowController = {
      credits,
      gameTime,
      gamePhase,
      gameMode,
      beginWorkSession,
      updateCredits,
      getAvailableApps,
      installedApps,
      installApp,
      encodeGameState,
      decodeGameState,
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

    const quickBarData = {
      quickBarFlags,
      setQuickBarFlag,
      quickBarConfig
    };

    const windowManager = {
      closeWindow,
      updateWindowPosition,
      updateWindowSize,
      bringToFront
    };

    // Note: Windows now access upgradesStore directly - no need to pass upgrade data as props
    return renderWindow(window, windowController, windowManager, toggleData, quickBarData);
  };


  // Combined props object - simplified and memoized
  const componentProps = React.useMemo(() => ({
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
      isOnline: !isPaused,
      onAppClick: openOrCloseWindow,
      apps,
      appOrder,
      openAppTypes: new Set(windows.map(w => w.appType)),
      onDockWindows: dockAllWindows,
      shouldCollapse: gameMode === 'workMode'
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
      setGameBackground,
      triggerEnding
    }
  }), [
    toggleStates,
    gameMode,
    beginWorkSession,
    credits,
    gameTime,
    gamePhase,
    installedApps,
    isPaused,
    openOrCloseWindow,
    apps,
    appOrder,
    windows,
    dockAllWindows,
    updateCredits,
    setCredits,
    setGamePhase,
    setGameTime,
    advanceGamePhase,
    pauseTime,
    resumeTime,
    handleResetGame,
    setGameBackground,
    triggerEnding
  ]);

  return (
    <UIProvider>
      <DragManager
        installedApps={installedApps}
        apps={apps}
        appOrder={appOrder}
        reorderApps={reorderApps}
        uninstallApp={uninstallAppWithUpgradeClearing}
        closeWindowsByAppType={closeWindowsByAppType}
        installAppOrder={installAppOrder}
        openOrCloseWindow={openOrCloseWindow}
      >
        <div className="App">
          <GameBackground backgroundId={gameBackground} />
          <KeyboardManager installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} />
          <QuickBarManager installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} />
          <VisualOverlayManager quickBarFlags={quickBarFlags} />
          <GameOptionsGear onClick={handleOptionsClick} />
          <DataReadout {...componentProps.dataReadout} />
          <QuickKeysBar installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} />
          <TerminalScreen {...componentProps.terminalScreen} />
          <AdminToolbar {...componentProps.adminToolbar} />
          <UIPopupComponent />
          {windows.map(renderWindowComponent)}

          {gameMode === 'workMode' && <WorkScreen updateCredits={updateCredits} installedApps={installedApps} />}
          
          {isOptionsMenuOpen && <GameOptionsMenu onClose={handleOptionsClose} profileState={profileState} />}
          
          {/* Ending cutscene overlay - renders on top of everything */}
          {endingState.activeEnding && (
            <EndingCutscene 
              activeEnding={endingState.activeEnding}
              onComplete={clearActiveEnding}
            />
          )}
        </div>
      </DragManager>
    </UIProvider>
  );
}

export default App;
