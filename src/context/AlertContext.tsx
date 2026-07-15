import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AlertType = 'success' | 'error' | 'info';

interface Alert {
  id: string;
  message: string;
  detail?: string;
  type: AlertType;
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  resolve: ((value: boolean) => void) | null;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, detail?: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const ALERT_META: Record<AlertType, { title: string; icon: React.ReactNode; accent: string; glow: string }> = {
  success: {
    title: 'Guul / Success',
    icon: <CheckCircle2 size={22} />,
    accent: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/25',
  },
  error: {
    title: 'Khalad / Error',
    icon: <AlertCircle size={22} />,
    accent: 'from-rose-500 to-red-500',
    glow: 'shadow-rose-500/25',
  },
  info: {
    title: 'Fariin / Notice',
    icon: <Info size={22} />,
    accent: 'from-indigo-500 to-violet-500',
    glow: 'shadow-indigo-500/25',
  },
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    title: 'Xaqiijin',
    resolve: null,
  });

  const showAlert = useCallback((message: string, type: AlertType = 'info', detail?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setAlerts(prev => [...prev, { id, message, type, detail }]);

    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, detail ? 8000 : 5500);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showConfirm = useCallback((message: string, title: string = 'Xaqiijin'): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        title,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback((value: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmState]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Toast notification cards */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-[min(420px,calc(100vw-2.5rem))] w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {alerts.map(alert => {
            const meta = ALERT_META[alert.type];
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-2xl ${meta.glow}`}
              >
                {/* Accent stripe */}
                <div className={`h-1 w-full bg-gradient-to-r ${meta.accent}`} />

                <div className="p-4 flex gap-3.5">
                  {/* Icon bubble */}
                  <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${meta.accent} shadow-lg`}>
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        {meta.title}
                      </p>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="shrink-0 -mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Close notification"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                      {alert.message}
                    </p>
                    {alert.detail && (
                      <p className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 break-all leading-relaxed">
                        {alert.detail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto-dismiss progress bar */}
                <motion.div
                  className={`h-0.5 bg-gradient-to-r ${meta.accent} origin-left`}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: alert.detail ? 8 : 5.5, ease: 'linear' }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm modal card */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30">
                  <HelpCircle size={26} />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Xaqiijin / Confirm
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">{confirmState.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50/80 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  onClick={() => handleConfirm(false)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Jooji
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 rounded-xl transition-all"
                >
                  Haa, Waan Hubaa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
