import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UIState, UIActions, UIContextValue, UIPopup } from '../types/uiState';
import PopupConfirm from '../components/ui/Popup_Confirm';

// Create context
const UIContext = createContext<UIContextValue | undefined>(undefined);

// Initial state
const initialState: UIState = {
  isLoading: false,
  modals: {},
  popup: null
};

// Action types
type UIAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_MODAL'; payload: string }
  | { type: 'HIDE_MODAL'; payload: string }
  | { type: 'SHOW_POPUP'; payload: UIPopup }
  | { type: 'HIDE_POPUP' }
  | { type: 'RESET_UI' };

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SHOW_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: true } };
    case 'HIDE_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: false } };
    case 'SHOW_POPUP':
      return { ...state, popup: action.payload };
    case 'HIDE_POPUP':
      return { ...state, popup: null };
    case 'RESET_UI':
      return initialState;
    default:
      return state;
  }
};

// Provider component
interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [uiState, dispatch] = useReducer(uiReducer, initialState);

  const actions: UIActions = {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    showModal: (modalId: string) => dispatch({ type: 'SHOW_MODAL', payload: modalId }),
    hideModal: (modalId: string) => dispatch({ type: 'HIDE_MODAL', payload: modalId }),
    showPopup: (popup: UIPopup) => dispatch({ type: 'SHOW_POPUP', payload: popup }),
    hidePopup: () => dispatch({ type: 'HIDE_POPUP' }),
    resetUI: () => dispatch({ type: 'RESET_UI' })
  };

  const value: UIContextValue = {
    uiState,
    actions
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// Custom hook
export const useUIContext = (): UIContextValue => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}; 

// Basic popup component
export const UIPopupComponent: React.FC = () => {
  const { uiState, actions } = useUIContext();
  const { popup } = uiState;

  if (!popup) return null;

  const handleConfirm = () => {
    popup.onConfirm();
    actions.hidePopup();
  };

  const handleCancel = () => {
    if (popup.onCancel) {
      popup.onCancel();
    }
    actions.hidePopup();
  };

  return (
    <PopupConfirm
      title={popup.title}
      message={popup.message}
      confirmText={popup.confirmText}
      cancelText={popup.cancelText}
      type={popup.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}; 