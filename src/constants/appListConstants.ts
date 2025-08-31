/**
 * SCR App List Constants
 * 
 * Master registry of all possible apps and default configuration.
 * Apps are installed/purchased through gameplay but defined here.
 */

import CreditsApp from '../components/scr-apps/creditsApp/listItem/CreditsAppItem';
import JobTitleApp from '../components/scr-apps/jobTitleApp/listItem/JobTitleAppItem';
import ScrAppStore from '../components/scr-apps/scrAppStoreApp/listItem/ScrAppStoreItem';
import PurgeZoneApp from '../components/scr-apps/purgeZoneApp/listItem/PurgeZoneAppItem';
import ChronoTrackApp from '../components/scr-apps/chronoTrackApp/listItem/ChronoTrackAppItem';
import CacheSyncApp from '../components/scr-apps/cacheSyncApp/listItem/CacheSyncAppItem';
import { AppDefinition, AppType } from '../types/appListState';
import DumpsterVisionApp from '../components/scr-apps/dumpsterVisionApp/listItem/DumpsterVisionAppItem';

// Master registry of ALL possible apps (current + future)
export const APP_REGISTRY: Record<string, AppDefinition> = {
  // Core apps (always available, can't be deleted)
  credits: {
    id: 'credits',
    name: 'Credits',
    component: CreditsApp,
    deletable: false,
    description: 'Track your current credit balance',
    purchaseCost: 100,
    maintenanceCost: 10,
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
    purchaseCost: 100,
    maintenanceCost: 10
  },
  
  // Standard apps (deletable, purchasable)
  jobTitle: {
    id: 'jobTitle',
    name: 'Job Title',
    component: JobTitleApp,
    deletable: true,
    description: 'View your current career progression',
    purchaseCost: 100,
    maintenanceCost: 10,
    defaultToggles: {
      jobTitleReadoutEnabled: true
    }
  },

  purgeZone: {
    id: 'purgeZone',
    name: 'Purge Zone',
    component: PurgeZoneApp,
    deletable: true,
    description: 'Purge zone management interface',
    purchaseCost: 100,
    maintenanceCost: 10
  },
  chronoTrack: {
    id: 'chronoTrack',
    name: 'ChronoTrack',
    component: ChronoTrackApp,
    deletable: true,
    description: 'Unified time and age tracking interface',
    purchaseCost: 100,
    maintenanceCost: 10,
    defaultToggles: {
      dateReadoutEnabled: true
    }
  },
  cacheSync: {
    id: 'cacheSync',
    name: 'Cache Sync',
    component: CacheSyncApp,
    deletable: true,
    description: 'Save and load game progress',
    purchaseCost: 0,
    maintenanceCost: 0
  },

  dumpsterVision: {
    id: 'dumpsterVision',
    name: 'Dumpster Vision',
    component: DumpsterVisionApp,
    deletable: true,
    description: 'Dumpster scanning interface',
    purchaseCost: 100,
    maintenanceCost: 10
  },

  // Future apps (not implemented yet)
  scanner: {
    id: 'scanner',
    name: 'Cargo Scanner',
    component: CreditsApp, // Placeholder
    deletable: true,
    description: 'Scan nearby cargo opportunities',
    unlockRequirements: ['bayBoss'],
    purchaseCost: 500,
    maintenanceCost: 50
  },
  navMap: {
    id: 'navMap',
    name: 'Navigation Map',
    component: CreditsApp, // Placeholder
    deletable: true,
    description: 'Enhanced navigation capabilities',
    unlockRequirements: ['scrapCaptain'],
    purchaseCost: 750,
    maintenanceCost: 75
  }
};

// Default apps that start installed (for now)
export const DEFAULT_INSTALLED_APPS: AppType[] = [
  'credits',
  'jobTitle', 
  // 'purgeZone',
  'chronoTrack',
  'scrAppStore'
];
