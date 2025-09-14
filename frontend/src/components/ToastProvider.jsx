import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext({ success: () => {}, error: () => {}, info: () => {} });

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  const show = useCallback((msg, t = 'success') => {
    setMessage(msg);
    setType(t);
    setOpen(true);
  }, []);

  const ctx = useMemo(() => ({
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info')
  }), [show]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <Toast open={open} onClose={() => setOpen(false)} message={message} type={type} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
