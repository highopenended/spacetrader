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

  // Enhanced uninstallApp that clears upgrades
  const uninstallAppWithUpgradeClearing = React.useCallback((appId: string) => {
    // Clear upgrades first, then uninstall app
    upgrades.clearUpgradesForApp(appId);
    uninstallApp(appId);
  }, [upgrades, uninstallApp]);

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

  // Quick Bar state
  const { quickBarFlags, setQuickBarFlag, quickBarConfig } = useQuickBarState();

  // Profile state (single instance)
  const {
    profileState,
    setProfileName,
    addEndingAchieved,
    resetProfile,
    encodeProfileState,
    decodeProfileState
  } = useProfileState();

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
      setGameBackground
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
    setGameBackground
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
        </div>
      </DragManager>
    </UIProvider>
  );
}

export default App;
