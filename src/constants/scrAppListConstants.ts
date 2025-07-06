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
import { AppDefinition, AppType } from '../types/scrAppListState';

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
    description: 'Track your current credit balance'
  },
  scrAppStore: {
    id: 'scrAppStore',
    name: 'SCR-App Store',
    title: 'App Store',
    component: ScrAppStore,
    category: 'core',
    cost: 0,
    deletable: false,
    description: 'Install and manage applications'
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
    description: 'View your current career progression'
  },
  age: {
    id: 'age',
    name: 'Age Tracker',
    title: 'Age Tracker',
    component: AgeApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'Monitor your character age'
  },
  date: {
    id: 'date',
    name: 'Date Tracker',
    title: 'Date Tracker',
    component: DateApp,
    category: 'utility',
    cost: 0, // Free for now
    deletable: true,
    description: 'Current in-game date and time'
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
    unlockRequirements: ['bayBoss']
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
    unlockRequirements: ['scrapCaptain']
  }
};

// Default apps that start installed (for now)
export const DEFAULT_INSTALLED_APPS: AppType[] = [
  'credits',
  'jobTitle', 
  'age',
  'date',
  'scrAppStore'
];

export const DRAG_CONSTANTS = {
  ITEM_TYPE: 'SCR_APP',
  DELETE_ZONE_ID: 'delete-zone',
  ANIMATION_DURATION: 200
}; 