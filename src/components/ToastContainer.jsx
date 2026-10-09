import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useAuth();

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '380px',
      width: '100%'
    }}>
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1.15rem',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              borderLeft: `5px solid ${isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6'}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              animation: 'toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isSuccess && <CheckCircle2 color="#10b981" size={20} />}
            {isError && <AlertCircle color="#ef4444" size={20} />}
            {(isWarning || toast.type === 'info') && <Info color={isWarning ? "#f59e0b" : "#3b82f6"} size={20} />}
            
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
