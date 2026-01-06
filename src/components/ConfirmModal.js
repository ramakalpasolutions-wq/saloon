'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ConfirmModalContext = createContext();

export function ConfirmModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModal({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'default',
        onConfirm: () => {
          resolve(true);
          setModal(null);
        },
        onCancel: () => {
          resolve(false);
          setModal(null);
        },
      });
    });
  }, []);

  return (
    <ConfirmModalContext.Provider value={confirm}>
      {children}
      {modal && <ConfirmModal {...modal} />}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmModalProvider');
  }
  return context;
}

function ConfirmModal({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) {
  const typeStyles = {
    default: {
      icon: '❓',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700',
    },
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: '⚠',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'ℹ',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const style = typeStyles[type] || typeStyles.default;

  // Handle escape key to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <>
      {/* Backdrop with HIGHER z-index */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={onCancel}
      />

      {/* Modal with HIGHEST z-index */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center pt-8 pb-4">
            <div className={`${style.iconBg} w-20 h-20 rounded-full flex items-center justify-center`}>
              <span className={`text-4xl ${style.iconText}`}>{style.icon}</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {title}
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onCancel}
              type="button"
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              type="button"
              className={`flex-1 px-6 py-3 ${style.confirmBtn} text-white rounded-xl transition-colors font-semibold`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
