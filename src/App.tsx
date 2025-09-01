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
import { useSaveLoad } from './hooks/useSaveLoad';
import { useToggleState } from './hooks/useToggleState';
import { WindowData } from './types/windowState';

import { renderWindow } from './constants/windowRegistry';
import { resetGame } from './utils/resetGameUtils';
import { UIProvider, UIPopupComponent } from './contexts/UIContext';
import DragManager from './components/DragManager';

import { getAppPropsMap } from './utils/appPropsBuilder';
import DataReadout from './components/DataReadout';
import QuickKeysBar from './components/quickKeys/QuickKeysBar';
import KeyboardManager from './components/KeyboardManager';
import QuickBarManager from './components/QuickBarManager';
import VisualOverlayManager from './components/visualOverlayManager/VisualOverlayManager';
import GameOptionsGear from './components/gameOptions/gameOptionsGear/GameOptionsGear';
import GameOptionsMenu from './components/gameOptions/gameOptionsMenu/GameOptionsMenu';
import { useQuickBarState } from './hooks/useQuickBarState';
import { useUpgradesState } from './hooks/useUpgradesState';
import { useProfileState } from './hooks/useProfileState';
import { useEndingsState } from './hooks/useEndingsState';
import { ENDINGS_REGISTRY } from './constants/endingsRegistry';
import EndingCutscene from './components/endings/EndingCutscene';

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
    resetGameState,
    beginWorkSession,
    setGameBackground,
    encodeGameState,
    decodeGameState
  } = useGameState();

  // Upgrades state (single instance) - needs credits from useGameState
  const upgrades = useUpgradesState(credits, updateCredits);

  // Quick Bar state
  const { quickBarFlags, setQuickBarFlag, quickBarConfig } = useQuickBarState();

  // Enhanced uninstallApp that clears upgrades and turns off related features (defined later after endings state)

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

  // Profile state (single instance)
  const {
    profileState,
    setProfileName,
    addEndingAchieved,
    resetProfile,
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
    // Clear upgrades first
    upgrades.clearUpgradesForApp(appId);
    
    // Turn off Dumpster Vision if that app is being uninstalled
    if (appId === 'dumpsterVision') {
      setQuickBarFlag('isActiveDumpsterVision', false);
    }
    
    // Check for recursive purge ending (purge zone deleting itself)
    if (appId === 'purgeZone') {
      // Trigger the recursive purge ending
      const triggerData = {
        event: 'app-purged' as const,
        appId: appId,
        isWorkModePurge: false,
        isUpgradePurchased: upgrades.isPurchased,
        installedApps: installedApps.map(app => app.id)
      };
      
      // Trigger only the recursive purge ending
      const recursivePurgeRegistry = { recursivePurge: ENDINGS_REGISTRY.recursivePurge };
      checkForEndingTriggers(triggerData, recursivePurgeRegistry);
    }
    
    // Then uninstall app
    uninstallApp(appId);
  }, [upgrades, uninstallApp, setQuickBarFlag, installedApps, checkForEndingTriggers]);

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
    resetGame({
      resetGameState,
      resetWindowState,
      resetToggleState
    });
    // Note: Profile state is NOT reset when resetting game
  }, [resetGameState, resetWindowState, resetToggleState]);

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
      // Directly set the ending instead of going through the trigger system
      const endingState = { activeEnding };
      
      // We need to manually call the ending state setter here
      // For now, let's use the trigger system but with a more specific approach
      const triggerData = {
        event: 'app-purged' as const,
        appId: endingId,
        isWorkModePurge: false,
        isUpgradePurchased: upgrades.isPurchased,
        installedApps: installedApps.map(app => app.id)
      };
      
      // Create a single-ending registry for this test
      const singleEndingRegistry = { [endingId]: ending };
      checkForEndingTriggers(triggerData, singleEndingRegistry);
    }
  }, [checkForEndingTriggers, upgrades.isPurchased, installedApps]);




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

    const upgradeData = {
      isPurchased: upgrades.isPurchased,
      canPurchase: upgrades.canPurchase,
      purchase: upgrades.purchase,
      refund: upgrades.refund,
      getUpgradesForApp: upgrades.getUpgradesForApp
    };

    return renderWindow(window, windowController, windowManager, toggleData, quickBarData, upgradeData);
  };

  // Build app props map for TerminalScreen
  const appPropsMap = getAppPropsMap(apps, { credits, gameTime, gamePhase });

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
      credits,
      gameTime,
      gamePhase,
      isOnline: !isPaused,
      onAppClick: openOrCloseWindow,
      apps,
      appOrder,
      openAppTypes: new Set(windows.map(w => w.appType)),
      onDockWindows: dockAllWindows,
      appPropsMap,
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
    appPropsMap,
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
        appPropsMap={appPropsMap}
        reorderApps={reorderApps}
        uninstallApp={uninstallAppWithUpgradeClearing}
        closeWindowsByAppType={closeWindowsByAppType}
        installAppOrder={installAppOrder}
        openOrCloseWindow={openOrCloseWindow}
      >
        <div className="App">
          <GameBackground backgroundId={gameBackground} />
          <KeyboardManager installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} isUpgradePurchased={upgrades.isPurchased} />
          <QuickBarManager installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} isUpgradePurchased={upgrades.isPurchased} />
          <VisualOverlayManager quickBarFlags={quickBarFlags} />
          <GameOptionsGear onClick={handleOptionsClick} />
          <DataReadout {...componentProps.dataReadout} />
          <QuickKeysBar installedApps={installedApps} quickBarFlags={quickBarFlags} setQuickBarFlag={setQuickBarFlag} quickBarConfig={quickBarConfig} isUpgradePurchased={upgrades.isPurchased} />
          <TerminalScreen {...componentProps.terminalScreen} />
          <AdminToolbar {...componentProps.adminToolbar} />
          <UIPopupComponent />
          {windows.map(renderWindowComponent)}

          {gameMode === 'workMode' && <WorkScreen updateCredits={updateCredits} isUpgradePurchased={upgrades.isPurchased} installedApps={installedApps} />}
          
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
