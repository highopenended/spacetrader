import React, { useEffect, useRef } from 'react';
import './Popup_Confirm.css';

interface PopupConfirmProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'alert' | 'goodNews' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

const Popup_Confirm: React.FC<PopupConfirmProps> = ({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'info',
  onConfirm, 
  onCancel 
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmRef.current) {
      confirmRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="popup-overlay">
      <div className={`popup popup-${type}`}>
        <div className="popup-title">{title}</div>
        <div className="popup-message">{message}</div>
        <div className="popup-actions">
          <button ref={confirmRef} className="popup-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="popup-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup_Confirm; 