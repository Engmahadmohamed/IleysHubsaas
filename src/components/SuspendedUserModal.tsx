import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Mail, Phone, X, Lock } from 'lucide-react';

export default function SuspendedUserModal() {
  const { suspendedUser, setSuspendedUser } = useApp();

  if (!suspendedUser) return null;

  return (
    <div 
      id="suspended-user-modal-overlay" 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
    >
      <div 
        id="suspended-user-modal-card" 
        className="bg-white dark:bg-slate-900 border border-red-100 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-up"
      >
        {/* Close Button */}
        <button
          onClick={() => setSuspendedUser(null)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Xir Fariinta"
        >
          <X size={18} />
        </button>

        {/* Warning Header */}
        <div className="bg-red-50 dark:bg-red-950/20 p-6 flex flex-col items-center text-center border-b border-red-100/50 dark:border-slate-800/80">
          <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full shadow-inner mb-3 ring-8 ring-red-50 dark:ring-red-950/10">
            <ShieldAlert size={32} className="animate-bounce" />
          </div>
          
          <h2 className="text-lg md:text-xl font-bold text-red-800 dark:text-red-400">
            Akoonkaaga Waa La Hakinay!
          </h2>
          <p className="text-xs text-red-600 dark:text-red-500 font-medium tracking-wide uppercase mt-1">
            Account Suspended / Inactive
          </p>
        </div>

        {/* Account Details */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-500 shadow-xs border border-slate-100 dark:border-slate-700">
              <Lock size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akoonka La Xiray</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {suspendedUser.fullName || 'Isticmaale IleysHub'}
              </p>
              <p className="text-xs text-slate-500 font-mono truncate">
                {suspendedUser.email}
              </p>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="space-y-3 text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
            <p className="border-l-2 border-red-500 pl-3 font-medium text-slate-700 dark:text-slate-200">
              Nidaamka IleysHub wuxuu muujinayaa in akoonkan ama dugsiga ku xiran uu hadda yahay mid aan firfircoonayn (Suspended).
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs pl-3">
              This means you cannot access school resources, marks management, or administrative panels until reactivated.
            </p>
          </div>

          {/* Help & Support Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Fadlan la xiriir Maamulka / Support</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a 
                href="mailto:support@ileyshub.com"
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium transition-all"
              >
                <Mail size={14} className="text-slate-400" />
                <span>support@ileyshub.com</span>
              </a>
              <div 
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium"
              >
                <Phone size={14} className="text-slate-400" />
                <span>+252 61 555 1111</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setSuspendedUser(null)}
            className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all text-center cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            Fahmay & Xir Fariinta (Dismiss)
          </button>
        </div>
      </div>
    </div>
  );
}
