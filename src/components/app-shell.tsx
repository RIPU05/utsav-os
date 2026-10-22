'use client';

import React from 'react';
import { Navigation } from './navigation';
import { usePlan } from './plan-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { liveAnnouncement } = usePlan();

  return (
    <div className="flex min-h-screen w-full bg-paper">
      {/* Primary Navigation Rail */}
      <Navigation />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {children}
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
