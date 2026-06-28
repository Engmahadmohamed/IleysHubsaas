import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render cycle:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-6 text-slate-900 font-sans selection:bg-slate-200">
          <div className="max-w-xl w-full bg-white p-6 md:p-8 rounded-2xl border border-red-100 shadow-xl flex flex-col space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Nidaamka wuxuu la kulmay Cilad</h1>
                <p className="text-xs text-slate-500 font-medium">An unexpected error has occurred in the application</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-650">
                The application encountered a critical runtime error. This might be due to blocked local storage, iframe sandboxing, or invalid session state.
              </p>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                <p className="text-xs font-mono font-bold text-red-600 break-all">
                  {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2 text-[11px] font-mono text-slate-500 cursor-pointer">
                    <summary className="font-semibold hover:text-slate-700">Show component stack trace</summary>
                    <pre className="mt-2 overflow-x-auto max-h-48 p-2 bg-slate-100 rounded-lg text-left whitespace-pre-wrap leading-relaxed select-all">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-5">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw size={15} /> Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 text-slate-650 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-sm py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Reset Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
