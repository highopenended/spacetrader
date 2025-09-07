/**
 * UI State Store (Zustand)
 * 
 * Centralized UI state management using Zustand.
 * Handles loading states, modals, and popup notifications.
 * 
 * Note: UI state is intentionally transient and NOT persisted in save/load operations.
 * This includes loading states, modal visibility, and popup notifications.
 */

import { create } from 'zustand';
import { UIPopup } from '../types/uiState';

interface UIStoreState {
  // Loading state management
  isLoading: boolean;
  
  // Modal visibility management (keyed by modal ID)
  modals: Record<string, boolean>;
  
  // Popup notification state
  popup: UIPopup | null;
}

interface UIActions {
  // ===== LOADING STATE =====
  /**
   * Set global loading state
   * @param loading - Whether the app is in a loading state
   */
  setLoading: (loading: boolean) => void;
  
  // ===== MODAL MANAGEMENT =====
  /**
   * Show a modal by ID
   * @param modalId - Unique identifier for the modal
   */
  showModal: (modalId: string) => void;
  
  /**
   * Hide a modal by ID
   * @param modalId - Unique identifier for the modal
   */
  hideModal: (modalId: string) => void;
  
  // ===== POPUP MANAGEMENT =====
  /**
   * Show a popup notification with confirmation/alert functionality
   * @param popup - Popup configuration object
   */
  showPopup: (popup: UIPopup) => void;
  
  /**
   * Hide the current popup
   */
  hidePopup: () => void;
  
  // ===== RESET =====
  /**
   * Reset all UI state to initial values
   * Used during game reset operations
   */
  resetUI: () => void;
}

type UIStore = UIStoreState & UIActions;

// Initial state
const initialState: UIStoreState = {
  isLoading: false,
  modals: {},
  popup: null
};

/**
 * UI Store Hook
 * 
 * Provides centralized UI state management with selective subscriptions.
 * Components can subscribe to specific UI state slices for optimal performance.
 * 
 * @example
 * // Subscribe to specific state
 * const popup = useUIStore(state => state.popup);
 * const showPopup = useUIStore(state => state.showPopup);
 * 
 * // Use actions
 * showPopup({
 *   title: 'Confirm Action',
 *   message: 'Are you sure?',
 *   onConfirm: () => console.log('Confirmed')
 * });
 */
export const useUIStore = create<UIStore>((set, get) => ({
  // ===== STATE =====
  ...initialState,
  
  // ===== ACTIONS =====
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  showModal: (modalId: string) => {
    set(state => ({
      modals: { ...state.modals, [modalId]: true }
    }));
  },
  
  hideModal: (modalId: string) => {
    set(state => ({
      modals: { ...state.modals, [modalId]: false }
    }));
  },
  
  showPopup: (popup: UIPopup) => {
    set({ popup });
  },
  
  hidePopup: () => {
    set({ popup: null });
  },
  
  resetUI: () => {
    set(initialState);
  }
}));
