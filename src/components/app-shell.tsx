'use client';

import React from 'react';
import { Navigation } from './navigation';
import { usePlan } from './plan-context';
import { ErrorBoundary } from './error-boundary';

/**
 * Props for the application layout shell.
 */
export interface AppShellProps {
  /** Page content to render in main view */
  children: React.ReactNode;
}

/**
 * Root responsive application shell providing navigation rail, main viewport,
 * accessibility live region, and top-level error boundary.
 *
 * @param {AppShellProps} props - Layout shell properties.
 * @returns {React.ReactElement} The rendered application layout.
 */
export function AppShell({ children }: AppShellProps): React.ReactElement {
  const { liveAnnouncement } = usePlan();

  return (
    <div className="flex min-h-screen w-full bg-paper">
      {/* Primary Navigation Rail */}
      <Navigation />

      {/* Main Content Area guarded by Error Boundary */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* WCAG 2.1 AA Screen Reader Live Announcement Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>
    </div>
  );
}
