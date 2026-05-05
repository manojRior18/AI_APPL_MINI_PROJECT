import React, { useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext, useToast } from '../../hooks/useToast';

export { useToast };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, dismissToast }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-10 fade-in duration-300 ${bgColors[type] || bgColors.info}`}>
      <div className="shrink-0">{icons[type] || icons.info}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 leading-tight">{message}</p>
      </div>
      <button onClick={onDismiss} className="p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400">
        <X size={16} />
      </button>
    </div>
  );
};
