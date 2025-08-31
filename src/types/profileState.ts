/**
 * Profile State Types
 * 
 * Defines the structure for user profile management.
 * Profiles are independent of game sessions and persist across saves.
 */

export interface ProfileState {
  profileName: string;
  endingsAchieved: string[];
}
