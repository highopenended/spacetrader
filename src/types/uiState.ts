export interface UIPopup {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'alert' | 'goodNews' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface UIState {
  // Basic UI state structure - will expand as needed
  isLoading: boolean;
  modals: Record<string, boolean>;
  popup: UIPopup | null; // ← New
}

export interface UIActions {
  setLoading: (loading: boolean) => void;
  showModal: (modalId: string) => void;
  hideModal: (modalId: string) => void;
  showPopup: (popup: UIPopup) => void;
  hidePopup: () => void;
  resetUI: () => void;
}

export interface UIContextValue {
  uiState: UIState;
  actions: UIActions;
} 