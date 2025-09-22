/**
 * Upgrades State Store (Zustand)
 * 
 * Central controller for upgrade purchase states using Zustand.
 * Handles upgrade purchases, refunds, and state management.
 * Gets credits directly from gameStore for transactions.
 */

import { create } from 'zustand';
import { UPGRADE_REGISTRY } from '../constants/upgradeRegistry';
import { PurchasedUpgrades, UpgradeDefinition, UpgradeId } from '../types/upgradeState';
import { useGameStore } from './gameStore';
import { useQuickBarStore } from './quickBarStore';

interface UpgradesState {
  purchased: PurchasedUpgrades;
  appUpgradeInProgress: boolean;
  currentUpgradeId: UpgradeId | null;
}

interface UpgradesActions {
  // Core upgrade operations
  purchase: (id: UpgradeId) => boolean;
  completeUpgrade: () => void;
  refund: (id: UpgradeId) => boolean;
  clearUpgradesForApp: (appId: string) => void;
  
  // Query functions
  isPurchased: (id: UpgradeId) => boolean;
  canPurchase: (id: UpgradeId) => boolean;
  getDefinition: (id: UpgradeId) => UpgradeDefinition | undefined;
  getUpgradesForApp: (appId: string) => UpgradeDefinition[];
  
  // Save/load functions
  encodeUpgradesState: () => PurchasedUpgrades;
  decodeUpgradesState: (state: PurchasedUpgrades) => boolean;
  
  // Reset function
  resetUpgrades: () => void;
}

type UpgradesStore = UpgradesState & UpgradesActions;

const initialUpgradesState: UpgradesState = {
  purchased: {},
  appUpgradeInProgress: false,
  currentUpgradeId: null,
};

export const useUpgradesStore = create<UpgradesStore>((set, get) => ({
  ...initialUpgradesState,

  // ===== QUERY FUNCTIONS =====
  getDefinition: (id: UpgradeId): UpgradeDefinition | undefined => {
    return UPGRADE_REGISTRY[id];
  },

  isPurchased: (id: UpgradeId): boolean => {
    return Boolean(get().purchased[id]);
  },

  getUpgradesForApp: (appId: string): UpgradeDefinition[] => {
    return Object.values(UPGRADE_REGISTRY).filter(u => u.appId === appId);
  },

  canPurchase: (id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    
    const state = get();
    if (state.purchased[id]) return false;
    
    // Block purchases if upgrade is in progress
    if (state.appUpgradeInProgress) return false;
    
    if (def.dependencies && def.dependencies.some(dep => !state.purchased[dep])) return false;
    
    // Get current credits from gameStore
    const credits = useGameStore.getState().credits;
    if (credits < def.cost) return false;
    
    return true;
  },

  // ===== UPGRADE OPERATIONS =====
  purchase: (id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    
    if (!get().canPurchase(id)) return false;
    
    // Deduct credits from gameStore immediately
    const updateCredits = useGameStore.getState().updateCredits;
    updateCredits(-def.cost);
    
    // Start upgrade process (don't mark as purchased yet)
    set(state => ({
      ...state,
      appUpgradeInProgress: true,
      currentUpgradeId: id
    }));
    
    // Update quick bar flag to show overlay
    useQuickBarStore.getState().setQuickBarFlag('isUpgradeInProgress', true);
    
    return true;
  },

  completeUpgrade: (): void => {
    const state = get();
    if (!state.currentUpgradeId) return;
    
    // Now mark as purchased
    set(prevState => ({
      ...prevState,
      purchased: { ...prevState.purchased, [state.currentUpgradeId!]: true },
      appUpgradeInProgress: false,
      currentUpgradeId: null
    }));
    
    // Update quick bar flag to hide overlay
    useQuickBarStore.getState().setQuickBarFlag('isUpgradeInProgress', false);
  },

  refund: (id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    
    const state = get();
    if (!state.purchased[id]) return false;
    if (!def.refundable) return false;
    
    // Find all upgrades that depend on this one and refund them first
    const dependentUpgrades = Object.values(UPGRADE_REGISTRY)
      .filter(upgrade => upgrade.dependencies?.includes(id))
      .filter(upgrade => state.purchased[upgrade.id]);
    
    // Refund dependent upgrades first (recursively)
    for (const dependent of dependentUpgrades) {
      get().refund(dependent.id);
    }
    
    // Refund credits to gameStore (full refund by default)
    const updateCredits = useGameStore.getState().updateCredits;
    updateCredits(def.cost);
    
    // Mark as not purchased
    set(prevState => ({
      purchased: { ...prevState.purchased, [id]: false }
    }));
    
    return true;
  },

  clearUpgradesForApp: (appId: string): void => {
    // Find all upgrades for this app and remove them from purchased state
    const upgradesForApp = Object.values(UPGRADE_REGISTRY).filter(u => u.appId === appId);
    if (upgradesForApp.length === 0) return;
    
    set(state => {
      const updated = { ...state.purchased };
      upgradesForApp.forEach(upgrade => {
        delete updated[upgrade.id];
      });
      return { purchased: updated };
    });
  },

  // ===== SAVE/LOAD FUNCTIONS =====
  encodeUpgradesState: (): PurchasedUpgrades => {
    const state = get();
    return { ...state.purchased };
  },

  decodeUpgradesState: (state: PurchasedUpgrades): boolean => {
    try {
      // Validate the incoming state
      if (!state || typeof state !== 'object') return false;
      
      // Validate that all values are booleans
      const valuesValid = Object.values(state).every(value => typeof value === 'boolean');
      if (!valuesValid) {
        console.error('Invalid upgrades state format - all values must be booleans');
        return false;
      }

      // Validate that all keys exist in the upgrade registry
      const keysValid = Object.keys(state).every(key => UPGRADE_REGISTRY[key as UpgradeId]);
      if (!keysValid) {
        console.error('Invalid upgrades state format - unknown upgrade IDs');
        return false;
      }

      set({ purchased: { ...state } });
      return true;
    } catch (error) {
      console.error('Failed to decode upgrades state:', error);
      return false;
    }
  },

  // ===== RESET FUNCTION =====
  resetUpgrades: () => {
    set(initialUpgradesState);
  }
}));
