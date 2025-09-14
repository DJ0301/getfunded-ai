import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ open, onClose, message, type = 'success', duration = 3500 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`toast-container ${type}`} role="status" aria-live="polite">
      <div className="toast">
        <div className="toast-icon" aria-hidden>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={onClose} aria-label="Close notification">×</button>
      </div>
    </div>
  );
}
