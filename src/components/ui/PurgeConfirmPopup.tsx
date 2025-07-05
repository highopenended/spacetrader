import React, { useEffect, useRef } from 'react';
import './PurgeConfirmPopup.css';

interface PurgeConfirmPopupProps {
  open: boolean;
  appName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PurgeConfirmPopup: React.FC<PurgeConfirmPopupProps> = ({ open, appName, onConfirm, onCancel }) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="purge-popup-overlay">
      <div className="purge-popup">
        <div className="purge-title">PURGE APP?</div>
        <div className="purge-app-name">{appName}</div>
        <div className="purge-popup-actions">
          <button ref={confirmRef} className="purge-btn confirm" onClick={onConfirm}>
            [PURGE]
          </button>
          <button className="purge-btn cancel" onClick={onCancel}>
            [ABORT]
          </button>
        </div>
        {/* Scanlines overlay must be last to appear on top of all content */}
        <div className="purge-popup-scanlines" />
      </div>
    </div>
  );
};

export default PurgeConfirmPopup; 