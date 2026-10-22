'use client';

import React from 'react';
import { AppShell } from '@/components/app-shell';
import { usePlan } from '@/components/plan-context';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { TabOverview } from '@/components/workspace/tab-overview';
import { TabBudget } from '@/components/workspace/tab-budget';
import { TabTimeline } from '@/components/workspace/tab-timeline';
import { TabVendors } from '@/components/workspace/tab-vendors';
import { TabCommunity } from '@/components/workspace/tab-community';
import { TabCreative } from '@/components/workspace/tab-creative';
import { TabRisks } from '@/components/workspace/tab-risks';
import { TabHistory } from '@/components/workspace/tab-history';
import { ReplanModal } from '@/components/workspace/replan-modal';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Interactive event workspace page routing across 8 specialized domain modules.
 *
 * @returns {React.ReactElement} The workspace page.
 */
export default function WorkspacePage(): React.ReactElement {
  const { activePlan, activeTab } = usePlan();

  return (
    <AppShell>
      {!activePlan ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="p-3 rounded-2xl bg-accent-subtle text-accent mb-4">
            <Sparkles className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif font-black text-2xl text-ink">
            No Active Plan Loaded
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
            Create an event plan or select one from our curated preset model library.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors"
            >
              New Plan
            </Link>
            <Link
              href="/saved"
              className="px-5 py-2.5 rounded-xl border border-rule text-xs font-semibold text-ink hover:bg-paper-subtle transition-colors"
            >
              Browse Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader />
          <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && <TabOverview />}
            {activeTab === 'budget' && <TabBudget />}
            {activeTab === 'timeline' && <TabTimeline />}
            {activeTab === 'vendors' && <TabVendors />}
            {activeTab === 'community' && <TabCommunity />}
            {activeTab === 'creative' && <TabCreative />}
            {activeTab === 'risks' && <TabRisks />}
            {activeTab === 'history' && <TabHistory />}
          </div>
          <ReplanModal />
        </div>
      )}
    </AppShell>
  );
}
