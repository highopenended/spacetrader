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
import ChronoTrackApp from '../components/scr-apps/chronoTrackApp/listItem/ChronoTrackAppItem';
import { AppDefinition, AppType, AppTier } from '../types/scrAppListState';

// Standard tier costs for basic utility apps
const STANDARD_TIERS: AppTier[] = [
  { tier: 1, flatUpgradeCost: 100, flatDowngradeCost: 100, monthlyCost: 10, information: 'Basic functionality with standard features' },
  { tier: 2, flatUpgradeCost: 200, flatDowngradeCost: 200, monthlyCost: 20, information: 'Enhanced capabilities and improved interface' },
  { tier: 3, flatUpgradeCost: 300, flatDowngradeCost: 300, monthlyCost: 30, information: 'Advanced features with automation systems' },
  { tier: 4, flatUpgradeCost: 400, flatDowngradeCost: 400, monthlyCost: 40, information: 'Premium tier with full feature suite' }
];

// Master registry of ALL possible apps (current + future)
export const APP_REGISTRY: Record<string, AppDefinition> = {
  // Core apps (always available, can't be deleted)
  credits: {
    id: 'credits',
    name: 'Credits',
    component: CreditsApp,
    deletable: false,
    description: 'Track your current credit balance',
    tiers: STANDARD_TIERS,
    defaultToggles: {
      creditsReadoutEnabled: true
    }
  },
  scrAppStore: {
    id: 'scrAppStore',
    name: 'SCR-App Store',
    component: ScrAppStore,
    deletable: false,
    description: 'Install and manage applications',
    tiers: STANDARD_TIERS
  },
  
  // Standard apps (deletable, purchasable)
  jobTitle: {
    id: 'jobTitle',
    name: 'Job Title',
    component: JobTitleApp,
    deletable: true,
    description: 'View your current career progression',
    tiers: STANDARD_TIERS,
    defaultToggles: {
      jobTitleReadoutEnabled: true
    }
  },
  age: {
    id: 'age',
    name: 'Age Tracker',
    component: AgeApp,
    deletable: true,
    description: 'Monitor your character age',
    tiers: STANDARD_TIERS
  },
  date: {
    id: 'date',
    name: 'Date Tracker',
    component: DateApp,
    deletable: true,
    description: 'Current in-game date and time',
    tiers: STANDARD_TIERS
  },
  purgeZone: {
    id: 'purgeZone',
    name: 'Purge Zone',
    component: PurgeZoneApp,
    deletable: true,
    description: 'Purge zone management interface',
    tiers: STANDARD_TIERS
  },
  chronoTrack: {
    id: 'chronoTrack',
    name: 'ChronoTrack',
    component: ChronoTrackApp,
    deletable: true,
    description: 'Unified time and age tracking interface',
    tiers: STANDARD_TIERS,
    defaultToggles: {
      dateReadoutEnabled: true
    }
  },

  // Future apps (not implemented yet)
  scanner: {
    id: 'scanner',
    name: 'Cargo Scanner',
    component: CreditsApp, // Placeholder
    deletable: true,
    description: 'Scan nearby cargo opportunities',
    unlockRequirements: ['bayBoss'],
    tiers: [
      { tier: 1, flatUpgradeCost: 500, flatDowngradeCost: 100, monthlyCost: 50, information: 'Basic cargo scanning capabilities' },
      { tier: 2, flatUpgradeCost: 700, flatDowngradeCost: 200, monthlyCost: 70, information: 'Enhanced scanning range and detail' },
      { tier: 3, flatUpgradeCost: 900, flatDowngradeCost: 300, monthlyCost: 90, information: 'Advanced cargo analysis and prediction' },
      { tier: 4, flatUpgradeCost: 1200, flatDowngradeCost: 400, monthlyCost: 120, information: 'Military-grade deep space scanning' }
    ]
  },
  navMap: {
    id: 'navMap',
    name: 'Navigation Map',
    component: CreditsApp, // Placeholder
    deletable: true,
    description: 'Enhanced navigation capabilities',
    unlockRequirements: ['scrapCaptain'],
    tiers: [
      { tier: 1, flatUpgradeCost: 750, flatDowngradeCost: 100, monthlyCost: 75, information: 'Basic sector navigation mapping' },
      { tier: 2, flatUpgradeCost: 950, flatDowngradeCost: 200, monthlyCost: 95, information: 'Multi-sector route planning' },
      { tier: 3, flatUpgradeCost: 1200, flatDowngradeCost: 300, monthlyCost: 120, information: 'Hazard detection and avoidance' },
      { tier: 4, flatUpgradeCost: 1500, flatDowngradeCost: 400, monthlyCost: 150, information: 'Quantum jump gate network access' }
    ]
  }
};

// Default apps that start installed (for now)
export const DEFAULT_INSTALLED_APPS: AppType[] = [
  'credits',
  'jobTitle', 
  // 'age',
  // 'date',
  // 'purgeZone',
  'chronoTrack',
  'scrAppStore'
];

export const DRAG_CONSTANTS = {
  ITEM_TYPE: 'SCR_APP',
  ANIMATION_DURATION: 200
}; 