import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ModalAlert {
  title: string;
  message: string;
  type: NotificationType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  toasts: ToastMessage[];
  activeModal: ModalAlert | null;
  showToast: (message: string, type?: NotificationType, title?: string, duration?: number) => void;
  showModal: (alert: ModalAlert) => void;
  closeToast: (id: string) => void;
  closeModal: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Plain JS Helper to trigger a premium toast notification anywhere in the codebase (even outside React)
export const triggerNotification = (
  message: string,
  type: NotificationType = 'info',
  title?: string,
  duration = 4000
) => {
  window.dispatchEvent(
    new CustomEvent('workspace_show_notification', {
      detail: { message, type, title, duration },
    })
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<ModalAlert | null>(null);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeModal = useCallback(() => {
    if (activeModal?.onCancel) {
      activeModal.onCancel();
    }
    setActiveModal(null);
  }, [activeModal]);

  const showModal = useCallback((alert: ModalAlert) => {
    setActiveModal(alert);
  }, []);

  const showToast = useCallback(
    (message: string, type: NotificationType = 'info', title?: string, duration = 4000) => {
      if (type === 'error') {
        setActiveModal({
          title: title || 'Error Encountered',
          message,
          type: 'error',
          confirmLabel: 'OK'
        });
        return;
      }
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          closeToast(id);
        }, duration);
      }
    },
    [closeToast, setActiveModal]
  );

  // Set up listeners for the custom event and global system rejections
  useEffect(() => {
    const handleNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string;
        type?: NotificationType;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail) {
        const { message, type = 'info', title, duration } = customEvent.detail;
        showToast(message, type, title, duration);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      // Suppress ResizeObserver, browser runtime extension noise, or benign Vite WebSocket/HMR disconnects
      let errorMsg = event.message || '';
      let errorStack = '';
      if (event.error) {
        errorMsg = errorMsg || event.error.message || '';
        errorStack = event.error.stack || '';
      }
      const combined = `${errorMsg} ${errorStack}`.toLowerCase();
      
      if (
        combined.includes('resizeobserver') || 
        combined.includes('script error') || 
        combined.includes('extension') ||
        combined.includes('websocket') ||
        combined.includes('web socket') ||
        combined.includes('closed without opened') ||
        combined.includes('vite') ||
        combined.includes('hmr') ||
        combined.includes('sockjs')
      ) {
        return;
      }
      showToast(event.message || 'An unexpected background runtime exception occurred.', 'error', 'System Background Exception');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let msg = 'An asynchronous background operations process encountered a connection issue.';
      let reasonStr = '';
      try {
        reasonStr = reason ? (typeof reason === 'string' ? reason : reason.message || JSON.stringify(reason)) : '';
      } catch (e) {
        reasonStr = String(reason);
      }
      
      if (typeof reason === 'string') {
        msg = reason;
      } else if (reason && typeof reason === 'object') {
        msg = reason.message || reason.response?.data?.message || msg;
      }
      
      const lowercaseMsg = msg.toLowerCase();
      const lowercaseReason = reasonStr.toLowerCase();
      
      if (
        lowercaseMsg.includes('canceled') || 
        lowercaseMsg.includes('cancelled') || 
        lowercaseMsg.includes('auth/me') ||
        lowercaseMsg.includes('unauthenticated') ||
        lowercaseMsg.includes('expired') ||
        lowercaseMsg.includes('websocket') ||
        lowercaseMsg.includes('web socket') ||
        lowercaseMsg.includes('closed without opened') ||
        lowercaseMsg.includes('vite') ||
        lowercaseReason.includes('websocket') ||
        lowercaseReason.includes('web socket') ||
        lowercaseReason.includes('closed without opened') ||
        lowercaseReason.includes('vite') ||
        lowercaseReason.includes('hmr') ||
        lowercaseReason.includes('sockjs') ||
        (reason && typeof reason === 'object' && (
          ('type' in reason && String(reason.type).toLowerCase().includes('websocket')) ||
          ('target' in reason && String(reason.target).toLowerCase().includes('websocket'))
        ))
      ) {
        return; // Do not spam for session expiry, canceled requests, or benign Vite WebSocket / HMR disconnects
      }

      showToast(msg, 'error', 'System Operation Event');
    };

    window.addEventListener('workspace_show_notification', handleNotificationEvent);
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('workspace_show_notification', handleNotificationEvent);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showToast]);

  // Intercept console.warn and console.error for specific database / config warnings to show as popups
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      originalWarn.apply(console, args);

      const message = args
        .map((arg) => {
          if (!arg) return '';
          if (arg instanceof Error) return arg.message || arg.stack || String(arg);
          if (typeof arg === 'object') {
            try {
              return arg.message || JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      const lowerMessage = message.toLowerCase();
      if (
        lowerMessage.includes('enableindexeddbpersistence') ||
        lowerMessage.includes('firestore(12.14.0)') ||
        lowerMessage.includes('live firestore getall query failed') ||
        lowerMessage.includes('live firestore getbyslug query failed') ||
        lowerMessage.includes('missing or insufficient permissions')
      ) {
        setActiveModal({
          title: lowerMessage.includes('permission') ? 'Database Access Restricted' : 'Database Client Warning',
          message: message,
          type: 'warning',
          confirmLabel: 'Acknowledge'
        });
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);

      const message = args
        .map((arg) => {
          if (!arg) return '';
          if (arg instanceof Error) return arg.message || arg.stack || String(arg);
          if (typeof arg === 'object') {
            try {
              return arg.message || JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      const lowerMessage = message.toLowerCase();
      if (
        lowerMessage.includes('missing or insufficient permissions') ||
        (lowerMessage.includes('firestore') && lowerMessage.includes('failed'))
      ) {
        setActiveModal({
          title: 'Database Security Block',
          message: message,
          type: 'error',
          confirmLabel: 'OK'
        });
      }
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [setActiveModal]);

  // Override window.alert globally!
  useEffect(() => {
    const originalAlert = window.alert;
    
    window.alert = (message: string) => {
      // Determine if it looks like an error, success, or standard info
      const msgLower = message?.toLowerCase() || '';
      let type: NotificationType = 'info';
      let title = 'Notification';

      if (
        msgLower.includes('failed') || 
        msgLower.includes('error') || 
        msgLower.includes('denied') || 
        msgLower.includes('restricted') ||
        msgLower.includes('invalid') ||
        msgLower.includes('incorrect')
      ) {
        type = 'error';
        title = 'Action Failed';
      } else if (
        msgLower.includes('success') || 
        msgLower.includes('saved') || 
        msgLower.includes('created') || 
        msgLower.includes('updated') ||
        msgLower.includes('uploaded') ||
        msgLower.includes('seeded')
      ) {
        type = 'success';
        title = 'Success';
      } else if (msgLower.includes('warning') || msgLower.includes('attention') || msgLower.includes('please check')) {
        type = 'warning';
        title = 'Attention Required';
      }

      // Display as our premium popup modal dialog
      setActiveModal({
        title,
        message,
        type,
        confirmLabel: 'Acknowledge',
        onConfirm: () => {},
      });
      
      // Also log it or fallback to console
      console.log(`[Intercepted Native Alert] ${message}`);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const handleModalConfirm = () => {
    if (activeModal?.onConfirm) {
      activeModal.onConfirm();
    }
    setActiveModal(null);
  };

  return (
    <NotificationContext.Provider value={{ toasts, activeModal, showToast, showModal, closeToast, closeModal }}>
      {children}

      {/* Floating Toast Containers */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-top-4 
              ${
                toast.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-850 text-emerald-850 dark:text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-850 text-rose-850 dark:text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-850 text-amber-850 dark:text-amber-200'
                  : 'bg-indigo-50 dark:bg-slate-900/90 border-indigo-105 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-500" />}
            </div>

            <div className="flex-grow">
              {toast.title && <h4 className="font-bold text-sm tracking-tight mb-0.5">{toast.title}</h4>}
              <p className="text-xs font-medium leading-relaxed opacity-90">{toast.message}</p>
            </div>

            <button
              onClick={() => closeToast(toast.id)}
              className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Immersive Modal Error / Alert Dialogue Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#13151a] w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-850 overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            {/* Modal Colored Accent Bar */}
            <div
              className={`h-1.5 w-full ${
                activeModal.type === 'success'
                  ? 'bg-emerald-500'
                  : activeModal.type === 'error'
                  ? 'bg-rose-500'
                  : activeModal.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-indigo-650'
              }`}
            />

            <div className="p-6">
              <div className="flex gap-4">
                <div
                  className={`shrink-0 p-3 rounded-xl ${
                    activeModal.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : activeModal.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : activeModal.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {activeModal.type === 'success' && <CheckCircle2 className="h-6 w-6" />}
                  {activeModal.type === 'error' && <AlertCircle className="h-6 w-6" />}
                  {activeModal.type === 'warning' && <AlertTriangle className="h-6 w-6" />}
                  {activeModal.type === 'info' && <Info className="h-6 w-6" />}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {activeModal.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {activeModal.message}
                  </p>
                </div>
              </div>

              {/* Troubleshooting / Context Specific Suggestions for Common Errors */}
              {activeModal.type === 'error' && (
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850/80 text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
                  <span className="font-bold text-slate-705 dark:text-slate-300 block mb-0.5">💡 Quick Troubleshooting Guideline:</span>
                  {activeModal.message.toLowerCase().includes('network') || activeModal.message.toLowerCase().includes('connection') ? (
                    <span>This seems like an offline or server connectivity issue. Check your wifi, verify the server status, or refresh the action.</span>
                  ) : activeModal.message.toLowerCase().includes('permission') || activeModal.message.toLowerCase().includes('access denied') ? (
                    <span>This operation requires administrator permissions, or you may need to log in with appropriate developer credentials to unlock it.</span>
                  ) : activeModal.message.toLowerCase().includes('delete') ? (
                    <span>If this workspace contains subfolders or lists, guarantee all active objects are disconnected before applying heavy deletion actions.</span>
                  ) : (
                    <span>Try reloading the workspace page, checking your input fields, or opening the application in a new dedicated window tab.</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2">
                {activeModal.cancelLabel && (
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 font-bold text-xs transition-all uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    {activeModal.cancelLabel}
                  </button>
                )}
                <button
                  onClick={handleModalConfirm}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 shadow-md ${
                    activeModal.type === 'error'
                      ? 'bg-rose-600 hover:bg-rose-705 text-white focus:ring-rose-500'
                      : activeModal.type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-705 text-white focus:ring-emerald-500'
                      : activeModal.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-705 text-white focus:ring-amber-500'
                      : 'bg-indigo-600 hover:bg-indigo-705 text-white focus:ring-indigo-500'
                  }`}
                >
                  {activeModal.confirmLabel || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
