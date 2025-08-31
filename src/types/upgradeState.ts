/**
 * Upgrade State Types
 *
 * Centralized typing for app upgrades. Upgrades are simple on/off purchases
 * referenced by a stable string id. They are grouped by `appId` but stored in
 * a flat registry for easy lookup and gating.
 */

export type UpgradeId = string;

export interface UpgradeDefinition {
  /** Stable unique id, e.g. "dumpsterVision.addQuickKey" */
  id: UpgradeId;
  /** The app this upgrade belongs to, e.g. "dumpsterVision" */
  appId: string;
  /** Display name shown in UI */
  label: string;
  /** Optional short description for detail text */
  description?: string;
  /** Purchase cost in credits */
  cost: number;
  /** If true, allow refund/downgrade flows */
  refundable?: boolean;
  /** Optional dependencies that must be purchased first */
  dependencies?: UpgradeId[];
}

export type UpgradeRegistry = Record<UpgradeId, UpgradeDefinition>;

/** Map of purchased states keyed by UpgradeId */
export type PurchasedUpgrades = Record<UpgradeId, boolean>;


