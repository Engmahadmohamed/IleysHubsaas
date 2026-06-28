import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AlertType = 'success' | 'error' | 'info';

interface Alert {
  id: string;
  message: string;
  type: AlertType;
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  resolve: ((value: boolean) => void) | null;
}

interface AlertContextType {
  showAlert: (message: string, type: AlertType) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    title: 'Xaqiijin', // Default Somali for "Confirmation"
    resolve: null,
  });

  const showAlert = useCallback((message: string, type: AlertType) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 6000);
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
      
      {/* Toast Alerts */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-xl ${
                alert.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' :
                alert.type === 'error' ? 'bg-rose-50/95 border-rose-200 text-rose-900' :
                'bg-blue-50/95 border-blue-200 text-blue-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {alert.type === 'success' && <CheckCircle2 size={20} className="text-emerald-600" />}
                {alert.type === 'error' && <AlertCircle size={20} className="text-rose-600" />}
                {alert.type === 'info' && <Info size={20} className="text-blue-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug">{alert.message}</p>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className={`shrink-0 p-1.5 rounded-full transition-colors ${
                  alert.type === 'success' ? 'hover:bg-emerald-200/50 text-emerald-700' :
                  alert.type === 'error' ? 'hover:bg-rose-200/50 text-rose-700' :
                  'hover:bg-blue-200/50 text-blue-700'
                }`}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmState.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => handleConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors"
                >
                  Jooji (Cancel)
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-xl transition-all"
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
