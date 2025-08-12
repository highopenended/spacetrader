import { AppType } from './scrAppListState';

export interface QuickBarFlags {
  isActiveDumpsterVision: boolean;
}

export interface QuickKeyConfig {
  id: string; // unique identifier, often matches AppType
  label: string;
  shortcutKey: string;
  showInQuickBar: boolean;
  toggleFlagKey?: keyof QuickBarFlags;
  requiresAppId?: AppType; // if present, only show when this app is installed
}

export type QuickBarConfig = Record<string, QuickKeyConfig>;


