import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, RotateCcw, Home, LifeBuoy } from 'lucide-react';
import { usePageMeta } from '../utils/seo';

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
          <AlertOctagon className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-4">
          Application Error
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-3">
          Something went wrong
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
          The application encountered an unexpected runtime error. We have logged this occurrence and our technical team will investigate.
        </p>

        {error && process.env.NODE_ENV !== 'production' && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-left font-mono text-xs overflow-auto max-h-40 mb-6">
            <p className="font-bold text-rose-400 mb-1">{error.toString()}</p>
            {error.componentStack && <pre className="text-slate-400 whitespace-pre-wrap">{error.componentStack}</pre>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 text-white font-semibold text-sm hover:bg-purple-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}

          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary
        });
      }
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    return this.props.children;
  }
}

export default function GeneralError() {
  usePageMeta({
    title: 'Error | Diversity Collective Ventura County',
    description: 'An unexpected error occurred. Diversity Collective Ventura County is here to assist.',
    canonicalPath: '/error'
  });

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
          <LifeBuoy className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3">
          Page or Service Error
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
          We encountered an issue displaying this page. Diversity Collective is actively maintaining all digital services.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 text-white font-semibold text-sm hover:bg-purple-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Contact DCVC
          </Link>
        </div>
      </div>
    </div>
  );
}

