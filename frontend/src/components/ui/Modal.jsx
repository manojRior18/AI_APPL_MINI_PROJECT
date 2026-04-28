import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative z-10 animate-in zoom-in-95 fade-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {title && (
          <div className="mb-6 pr-8">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
        )}

        <div className="mb-8">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
