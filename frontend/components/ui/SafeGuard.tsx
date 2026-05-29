import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SafeGuard extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.warn('Uncaught Exception captured by SafeGuard:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d0e12] flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#13151a] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-850 p-8 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Danger Icon with pulse animation */}
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 mb-6 animate-bounce">
              <AlertOctagon className="h-10 w-10" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Application Workspace Crashed
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 leading-relaxed max-w-md mx-auto">
              Our Workspace Nexus boundary caught an unexpected UI rendering crash. 
              The application state has been securely preserved and isolated.
            </p>

            {/* Error Detail Box */}
            <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-150 dark:border-slate-850/80 p-4 mb-6 text-left overflow-auto max-h-48 text-left">
              <span className="font-bold text-xs text-rose-600 dark:text-rose-400 block mb-1">
                Crash Exception Log:
              </span>
              <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all leading-normal whitespace-pre-wrap">
                {this.state.error?.toString() || 'Unknown Javascript Runtime Exception'}
              </p>
              {this.state.errorInfo && (
                <p className="font-mono text-[10px] text-slate-400 dark:text-slate-550 mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </p>
              )}
            </div>

            {/* Recovery Action Triggers */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Hard Reset & Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </button>
            </div>

            {/* Small suggestion footer */}
            <div className="mt-8 text-[11px] text-slate-400 dark:text-slate-500">
              💡 Tip: If you frequently witness sandbox crashes, clear your browser cookies and private sandbox LocalStorage caches.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
