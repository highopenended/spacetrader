import React from 'react';
import PopupConfirm from '../components/ui/Popup_Confirm';
import { useUIStore } from '../stores'; 

// Basic popup component
export const UIPopupComponent: React.FC = () => {
  const popup = useUIStore(state => state.popup);
  const hidePopup = useUIStore(state => state.hidePopup);

  if (!popup) return null;

  const handleConfirm = () => {
    popup.onConfirm();
    hidePopup();
  };

  const handleCancel = () => {
    if (popup.onCancel) {
      popup.onCancel();
    }
    hidePopup();
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