import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-stone-950 border border-stone-800 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              Lowkey Cafe encountered an unexpected error while rendering.
            </p>

            {this.state.error?.message && (
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 mb-6 text-left text-xs font-mono text-rose-300 break-words">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-all active:scale-98"
              >
                <Home className="w-4 h-4" />
                <span>Reset & Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
