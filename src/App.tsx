import React, { useState } from 'react';
import { useRoutes, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import SuperAdmin from './components/SuperAdmin';
import SchoolAdmin from './components/SchoolAdmin';
import ResultPortal from './components/ResultPortal';
import FeeCheckingPortal from './components/FeeCheckingPortal';
import ReceiptVerification from './components/ReceiptVerification';
import NotFound from './components/NotFound';
import SuspendedUserModal from './components/SuspendedUserModal';
import { 
  KeyRound, Users, Sparkles, Database, GraduationCap, ArrowRight, ShieldAlert,
  HelpCircle, BookOpen, AlertCircle, Building2, Terminal
} from 'lucide-react';

function FirebaseDatabaseInfo() {
  return (
    <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          <Database size={13} className="text-emerald-500 shrink-0" />
          Firebase Database Status
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live / Online
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px]">
        <div>
          <span className="text-slate-400">Project ID:</span> <span className="font-semibold text-slate-700">ileyshub</span>
        </div>
        <div>
          <span className="text-slate-400">Database:</span> <span className="font-semibold text-slate-700">Cloud Firestore</span>
        </div>
        <div>
          <span className="text-slate-400">Sync:</span> <span className="font-semibold text-slate-700">Real-time (Active)</span>
        </div>
        <div>
          <span className="text-slate-400">Security:</span> <span className="font-semibold text-slate-700">Fully Encrypted</span>
        </div>
      </div>
    </div>
  );
}

function FirebaseDatabaseInfoDark() {
  return (
    <div className="mt-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider text-[10px]">
          <Database size={13} className="text-cyan-500 shrink-0" />
          Secure Node Status
        </div>
        <div className="flex items-center gap-1 bg-cyan-950/50 text-cyan-400 px-2 py-0.5 rounded-full font-semibold text-[10px] border border-cyan-500/20">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
          Synchronized
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px]">
        <div>
          <span className="text-slate-500">Project ID:</span> <span className="font-semibold text-slate-300">ileyshub</span>
        </div>
        <div>
          <span className="text-slate-500">Database:</span> <span className="font-semibold text-slate-300">Cloud Firestore</span>
        </div>
        <div>
          <span className="text-slate-500">Sync:</span> <span className="font-semibold text-slate-300">Real-time Live</span>
        </div>
        <div>
          <span className="text-slate-500">Security:</span> <span className="font-semibold text-slate-300">Rules Hardened</span>
        </div>
      </div>
    </div>
  );
}

function LoginLayout() {
  const { login, loading, error } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (err: any) {
      setLoginError(err.message || String(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col justify-between text-slate-900 selection:bg-slate-200">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 card-shadow transition-all">
          
          {/* Brand Logo and Header */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="inline-flex p-3 bg-black text-white rounded-2xl shadow-sm mb-1">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white rounded-md"></div>
              </div>
            </div>
            
            <h1 className="text-xl md:text-2xl font-sans font-bold tracking-tight text-slate-900">
              IleysHub SaaS Management
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Authorized staff portal for academic management, student tracking, and reporting.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {loading ? 'Authenticating secure connection...' : 'Secure Account Sign In'}
            </button>
          </form>



        </div>
      </div>

      {/* Footer Branding */}
      <footer className="py-6 border-t border-slate-200/50 text-center text-xs text-slate-400 bg-white">
        <p className="font-medium">© 2026 IleysHub. Built for school administration and memorization networks.</p>
      </footer>
    </div>
  );
}

function SuperAdminLoginLayout() {
  const { login, loading } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role !== 'superadmin') {
        setLoginError('Access denied. This portal is for Super Admin only.');
      } else {
        navigate('/superadmin');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#111827] p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">

          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 mb-2">
              <KeyRound size={28} />
            </div>
            <h1 className="text-xl font-bold text-white">Super Admin Login</h1>
          </div>

          {/* Error */}
          {loginError && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#1f2937] border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-sm text-white placeholder-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#1f2937] border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-sm text-white placeholder-slate-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <KeyRound size={16} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}



function AppContent() {
  const { currentUser, loading } = useApp();

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex p-3 bg-black text-white rounded-2xl shadow-sm animate-pulse">
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">Xaqiijinta Ammaanka...</p>
        </div>
      </div>
    );
  }

  return <RoutesContainer currentUser={currentUser} />;
}

function RoutesContainer({ currentUser }: { currentUser: any }) {
  const { currentOrg } = useApp();
  // Route definitions utilizing useRoutes
  const element = useRoutes([
    {
      path: '/',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <Navigate to="/portal/dashboard" replace />
        )
      ) : (
        <LoginLayout />
      )
    },
    {
      path: '/superadmin/login',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <Navigate to="/portal/dashboard" replace />
        )
      ) : (
        <SuperAdminLoginLayout />
      )
    },
    {
      path: '/superadmin',
      element: currentUser?.role === 'superadmin' ? (
        <SuperAdmin />
      ) : (
        <Navigate to="/superadmin/login" replace />
      )
    },
    {
      path: '/portal',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <Navigate to="/portal/dashboard" replace />
        )
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/portal/:tab',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <SchoolAdmin />
        )
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/portal/students/:studentId',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <SchoolAdmin />
        )
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/portal/teachers/:teacherId',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <SchoolAdmin />
        )
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/portal/subjects/:subjectId',
      element: currentUser ? (
        currentUser.role === 'superadmin' && !currentOrg ? (
          <Navigate to="/superadmin" replace />
        ) : (
          <SchoolAdmin />
        )
      ) : (
        <Navigate to="/" replace />
      )
    },
    {
      path: '/results',
      element: (
        <div className="relative">
          <div className="bg-slate-900 p-3 flex justify-between items-center text-white text-xs border-b border-slate-800">
            <div className="flex items-center gap-1">
              <GraduationCap size={15} className="text-white" />
              <span className="font-bold">Student Transcript Access</span>
            </div>
            <Link 
              to="/"
              className="bg-black hover:bg-slate-800 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer border border-slate-700"
            >
              ← Back to System Login
            </Link>
          </div>
          <ResultPortal />
        </div>
      )
    },
    {
      path: '/check-fee/:orgId',
      element: (
        <div className="relative">
          <div className="bg-emerald-900 p-3 flex justify-between items-center text-white text-xs border-b border-emerald-800">
            <div className="flex items-center gap-1">
              <Database size={15} className="text-white" />
              <span className="font-bold">Student Fee Checking Access</span>
            </div>
            <Link 
              to="/"
              className="bg-black/50 hover:bg-black/70 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer border border-emerald-700/50"
            >
              ← Back to System Login
            </Link>
          </div>
          <FeeCheckingPortal />
        </div>
      )
    },
    {
      path: '/verify-receipt',
      element: <ReceiptVerification />
    },
    {
      path: '*',
      element: <NotFound />
    }
  ]);

  return <>{element}</>;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <SuspendedUserModal />
    </AppProvider>
  );
}

