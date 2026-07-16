import React, { useState } from 'react';
import { useRoutes, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { generateThemeVars } from './lib/themeUtils';
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
        <p className="font-medium">© 2026 IleysHub.All rights reserved.</p>
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
  const { currentUser, currentOrg, loading } = useApp();
  const location = useLocation();
  const isPublicPortal =
    location.pathname === '/results' ||
    location.pathname === '/verify-receipt' ||
    location.pathname.startsWith('/check-fee');

  if (loading && !currentUser && !isPublicPortal) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex">
        {/* Sidebar Skeleton (hidden on mobile) */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-4 space-y-6">
          <div className="h-8 bg-slate-200 rounded-xl w-3/4 animate-pulse"></div>
          <div className="space-y-3 mt-8">
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 bg-slate-200 rounded-xl w-1/3 animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Main Content Area */}
          <div className="bg-white border border-slate-100 rounded-2xl flex-1 p-6 flex flex-col space-y-4">
            <div className="h-6 bg-slate-200 rounded-lg w-1/4 animate-pulse mb-4"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-12 bg-slate-100 rounded-xl w-1/4 animate-pulse"></div>
                <div className="h-12 bg-slate-100 rounded-xl w-1/2 animate-pulse"></div>
                <div className="h-12 bg-slate-100 rounded-xl w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const themeVars = generateThemeVars(currentOrg?.themeColor);

  return (
    <div style={themeVars} className="min-h-screen bg-slate-50">
      <RoutesContainer currentUser={currentUser} />
    </div>
  );
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
      element: <ResultPortal />
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

