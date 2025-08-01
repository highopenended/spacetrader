/**
 * Window State Type Definitions
 * 
 * Contains types for window management system.
 * Separate from game state as windows are UI concerns.
 */

import React from 'react';

export interface WindowData {
  id: string;
  appType: string;
  title: string;
  content: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
} 