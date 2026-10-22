'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Properties accepted by the {@link ErrorBoundary} component.
 */
export interface ErrorBoundaryProps {
  /** The child elements guarded by this error boundary */
  children: ReactNode;
  /** Optional custom fallback element to render upon uncaught exceptions */
  fallback?: ReactNode;
}

/**
 * Internal state for the {@link ErrorBoundary} component.
 */
export interface ErrorBoundaryState {
  /** Indicates whether an uncaught error was caught */
  hasError: boolean;
  /** The caught error instance, or null if healthy */
  error: Error | null;
}

/**
 * Application-level Error Boundary component providing graceful fault isolation,
 * WCAG-compliant alert notifications, and local state recovery for workspace tabs.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <WorkspaceContent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  /**
   * Static lifecycle invoked after an error has been thrown by a descendant component.
   *
   * @param {Error} error - The thrown exception.
   * @returns {ErrorBoundaryState} The updated error state to trigger fallback rendering.
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle invoked after an error has been caught to log diagnostic diagnostics.
   *
   * @param {Error} error - The uncaught error instance.
   * @param {ErrorInfo} errorInfo - React component stack information.
   * @returns {void}
   */
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[UtsavOS ErrorBoundary] Uncaught UI render error:', error, errorInfo);
    }
  }

  /**
   * Resets the boundary state to attempt re-rendering the children tree.
   *
   * @returns {void}
   */
  public handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto my-12 max-w-xl rounded-2xl border border-state-error/40 bg-state-error-subtle p-8 text-ink shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-state-error/15 p-2 text-state-error shrink-0">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif font-black text-lg text-ink">
                Something went wrong rendering this view
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                An unexpected error occurred while rendering the workspace. Your planning data in
                local storage remains safe.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 rounded-lg bg-paper-subtle p-3 font-mono text-xs text-state-error overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-text hover:bg-accent-hover transition-colors min-h-[44px]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl border border-rule bg-paper px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-subtle transition-colors min-h-[44px]"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
