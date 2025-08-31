import { useCallback, useMemo, useState } from 'react';
import { UPGRADE_REGISTRY } from '../constants/upgradeRegistry';
import { PurchasedUpgrades, UpgradeDefinition, UpgradeId } from '../types/upgradeState';

/**
 * Upgrades State Hook (single-instance)
 *
 * Central controller for upgrade purchase states. This hook is intended to be
 * called once in App.tsx and its API passed down to windows via props, similar
 * to toggles and quick bar.
 *
 * Credits are read from the caller and updates are applied via the provided
 * updateCredits function. No persistence is implemented here.
 */
export const useUpgradesState = (
  credits: number,
  updateCredits: (delta: number) => void
) => {
  const [purchased, setPurchased] = useState<PurchasedUpgrades>({});

  const getDefinition = useCallback((id: UpgradeId): UpgradeDefinition | undefined => {
    return UPGRADE_REGISTRY[id];
  }, []);

  const isPurchased = useCallback((id: UpgradeId): boolean => {
    return Boolean(purchased[id]);
  }, [purchased]);

  const getUpgradesForApp = useCallback((appId: string): UpgradeDefinition[] => {
    return Object.values(UPGRADE_REGISTRY).filter(u => u.appId === appId);
  }, []);

  const canPurchase = useCallback((id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    if (purchased[id]) return false;
    if (def.dependencies && def.dependencies.some(dep => !purchased[dep])) return false;
    if (credits < def.cost) return false;
    return true;
  }, [credits, purchased]);

  const purchase = useCallback((id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    if (!canPurchase(id)) return false;
    updateCredits(-def.cost);
    setPurchased(prev => ({ ...prev, [id]: true }));
    return true;
  }, [canPurchase, updateCredits]);

  const refund = useCallback((id: UpgradeId): boolean => {
    const def = UPGRADE_REGISTRY[id];
    if (!def) return false;
    if (!purchased[id]) return false;
    if (!def.refundable) return false;
    // Full refund by default; can be adjusted per-design later
    updateCredits(def.cost);
    setPurchased(prev => ({ ...prev, [id]: false }));
    return true;
  }, [purchased, updateCredits]);

  const clearUpgradesForApp = useCallback((appId: string): void => {
    // Find all upgrades for this app and remove them from purchased state
    const upgradesForApp = Object.values(UPGRADE_REGISTRY).filter(u => u.appId === appId);
    if (upgradesForApp.length === 0) return;
    
    setPurchased(prev => {
      const updated = { ...prev };
      upgradesForApp.forEach(upgrade => {
        delete updated[upgrade.id];
      });
      return updated;
    });
  }, []);

  const api = useMemo(() => ({
    purchased,
    isPurchased,
    getDefinition,
    getUpgradesForApp,
    canPurchase,
    purchase,
    refund,
    clearUpgradesForApp,
  }), [purchased, isPurchased, getDefinition, getUpgradesForApp, canPurchase, purchase, refund, clearUpgradesForApp]);

  return api;
};


