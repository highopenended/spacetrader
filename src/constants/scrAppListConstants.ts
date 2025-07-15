/**
 * SCR App List Constants
 * 
 * Master registry of all possible apps and default configuration.
 * Apps are installed/purchased through gameplay but defined here.
 */

import CreditsApp from '../components/scr-apps/creditsApp/listItem/CreditsAppItem';
import JobTitleApp from '../components/scr-apps/jobTitleApp/listItem/JobTitleAppItem';
import AgeApp from '../components/scr-apps/ageApp/listItem/AgeAppItem';
import DateApp from '../components/scr-apps/dateApp/listItem/DateAppItem';
import ScrAppStore from '../components/scr-apps/scrAppStoreApp/listItem/ScrAppStoreItem';
import PurgeZoneApp from '../components/scr-apps/purgeZoneApp/listItem/PurgeZoneAppItem';
import { AppDefinition, AppType, AppTier } from '../types/scrAppListState';

// Standard tier costs (same for all apps initially, can be customized per app later)
const STANDARD_TIERS: AppTier[] = [
  { tier: 1, flatUpgradeCost: 100, flatDowngradeCost: 100, monthlyCost: 10, information: 'app information' },
  { tier: 2, flatUpgradeCost: 200, flatDowngradeCost: 200, monthlyCost: 20, information: 'app information' },
  { tier: 3, flatUpgradeCost: 300, flatDowngradeCost: 300, monthlyCost: 30, information: 'app information' },
  { tier: 4, flatUpgradeCost: 400, flatDowngradeCost: 400, monthlyCost: 40, information: 'app information' }
];

// Master registry of ALL possible apps (current + future)
export const APP_REGISTRY: Record<string, AppDefinition> = {
  // Core apps (always available, can't be deleted)
  credits: {
    id: 'credits',
    name: 'Credits',
    title: 'Credits Tracker',
    component: CreditsApp,
    category: 'core',
    cost: 0,
    deletable: false,
    description: 'Track your current credit balance',
    tiers: STANDARD_TIERS
  },
  scrAppStore: {
    id: 'scrAppStore',
    name: 'SCR-App Store',
    title: 'App Store',
    component: ScrAppStore,
    category: 'core',
    cost: 0,
    deletable: false,
    description: 'Install and manage applications',
    tiers: STANDARD_TIERS
  },
  
  // Standard apps (deletable, purchasable)
  jobTitle: {
    id: 'jobTitle',
    name: 'Job Title',
    title: 'Job Title',
    component: JobTitleApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'View your current career progression',
    tiers: STANDARD_TIERS
  },
  age: {
    id: 'age',
    name: 'Age Tracker',
    title: 'Age Tracker',
    component: AgeApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'Monitor your character age',
    tiers: STANDARD_TIERS
  },
  date: {
    id: 'date',
    name: 'Date Tracker',
    title: 'Date Tracker',
    component: DateApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'Current in-game date and time',
    tiers: STANDARD_TIERS
  },
  purgeZone: {
    id: 'purgeZone',
    name: 'Purge Zone',
    title: 'Purge Zone',
    component: PurgeZoneApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'Purge zone management interface',
    tiers: STANDARD_TIERS
  },

  // Future apps (not implemented yet)
  scanner: {
    id: 'scanner',
    name: 'Cargo Scanner',
    title: 'Cargo Scanner',
    component: CreditsApp, // Placeholder
    category: 'trading',
    cost: 500,
    deletable: true,
    description: 'Scan nearby cargo opportunities',
    unlockRequirements: ['bayBoss'],
    tiers: STANDARD_TIERS
  },
  navMap: {
    id: 'navMap',
    name: 'Navigation Map',
    title: 'Nav Map',
    component: CreditsApp, // Placeholder
    category: 'navigation',
    cost: 750,
    deletable: true,
    description: 'Enhanced navigation capabilities',
    unlockRequirements: ['scrapCaptain'],
    tiers: STANDARD_TIERS
  }
};

// Default apps that start installed (for now)
export const DEFAULT_INSTALLED_APPS: AppType[] = [
  'credits',
  'jobTitle', 
  'age',
  'date',
  'purgeZone',
  'scrAppStore'
];

export const DRAG_CONSTANTS = {
  ITEM_TYPE: 'SCR_APP',
  ANIMATION_DURATION: 200
}; 