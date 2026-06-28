import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-between text-slate-100 selection:bg-slate-800">
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full space-y-8 bg-[#111827] p-8 rounded-3xl border border-slate-800 shadow-2xl text-center"
        >
          {/* Animated Hazard Icon */}
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-3xl border border-amber-500/20 shadow-lg mb-2">
            <ShieldAlert size={40} className="animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold font-mono tracking-tight text-white">404</h1>
            <h2 className="text-lg font-bold text-slate-200">Bogga Lama Helin / Page Not Found</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Waan ka xunnahay, bogga aad raadinayso ee <code className="px-1.5 py-0.5 bg-slate-900 rounded text-amber-400 font-mono text-[11px]">{location.pathname}</code> ma jiro ama waa laga raray meeshaan.
            </p>
          </div>

          {/* Separation line */}
          <div className="border-t border-slate-800 my-2"></div>

          {/* Direct Action Links */}
          <div className="space-y-3 pt-2">
            <Link
              to="/"
              className="w-full py-3 bg-white hover:bg-slate-100 text-black font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <Home size={14} /> Ku laabo Bogga Hore (Back to Home)
            </Link>

            <Link
              to="/results"
              className="w-full py-3 bg-[#1f2937] hover:bg-[#374151] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700 active:scale-95"
            >
              <HelpCircle size={14} /> Portal-ka Transcript-ka Ardayda
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Security Footer */}
      <footer className="py-6 border-t border-slate-950 text-center text-xs text-slate-600 bg-[#060a12]">
        <p className="font-mono">SECURITY BOUNDARY CHECK // ERROR NODE: 404_NOT_FOUND</p>
      </footer>
    </div>
  );
}
