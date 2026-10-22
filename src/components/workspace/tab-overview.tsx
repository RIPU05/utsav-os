'use client';

import React from 'react';
import { usePlan } from '../plan-context';
import { calculateBudgetSummary, formatCurrency } from '@/lib/budget-engine';
import { calculatePermitReadiness, calculateVolunteerStaffing } from '@/lib/community-engine';
import { calculatePipelineSummary } from '@/lib/vendor-engine';
import {
  Calendar,
  Users,
  Coins,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

/**
 * Executive overview tab summarizing cross-domain event metrics:
 * budget commitments, timeline milestones, vendor pipeline, and community readiness.
 *
 * @returns {React.ReactElement | null} The overview dashboard element or null.
 */
export function TabOverview(): React.ReactElement | null {
  const { activePlan, setActiveTab } = usePlan();

  if (!activePlan) return null;

  const budgetSummary = calculateBudgetSummary(activePlan.budget, activePlan.totalBudget);
  const pipelineSummary = calculatePipelineSummary(activePlan.vendors);
  const completedTasks = activePlan.timeline.filter((t) => t.completed).length;

  const isCommunity = activePlan.eventType === 'Community Event';
  const permitReport = isCommunity
    ? calculatePermitReadiness(activePlan.permits, activePlan.date)
    : null;
  const volunteerReport = isCommunity
    ? calculateVolunteerStaffing(activePlan.volunteerShifts)
    : null;

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget KPI */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs font-mono uppercase mb-1">
            <span>Committed Budget</span>
            <Coins className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-black text-ink">
            {formatCurrency(budgetSummary.totalCommitted, activePlan.currency)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-ink-muted">Budget Cap:</span>
            <span className="font-mono font-semibold text-ink">
              {formatCurrency(budgetSummary.totalBudget, activePlan.currency)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className={`h-full ${budgetSummary.isOverBudget ? 'bg-state-error' : 'bg-state-success'}`}
              style={{
                width: `${Math.min(100, (budgetSummary.totalCommitted / budgetSummary.totalBudget) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Milestone Progress KPI */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs font-mono uppercase mb-1">
            <span>Milestone Readiness</span>
            <CheckCircle2 className="h-4 w-4 text-state-success" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-black text-ink">
            {Math.round((completedTasks / activePlan.timeline.length) * 100)}%
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-ink-muted">
            <span>Tasks Completed:</span>
            <span className="font-mono font-semibold text-ink">
              {completedTasks} / {activePlan.timeline.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-state-success"
              style={{
                width: `${Math.round((completedTasks / activePlan.timeline.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Vendor Procurement KPI */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs font-mono uppercase mb-1">
            <span>Vendor Pipeline</span>
            <FileCheck2 className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-black text-ink">
            {pipelineSummary.signedCount + pipelineSummary.paidCount} / {activePlan.vendors.length}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-ink-muted">
            <span>Signed / Paid:</span>
            <span className="font-mono font-semibold text-accent">
              {formatCurrency(pipelineSummary.totalCommittedContractValue, activePlan.currency)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{
                width: `${Math.round(((pipelineSummary.signedCount + pipelineSummary.paidCount) / activePlan.vendors.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Community or Capacity KPI */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs font-mono uppercase mb-1">
            <span>{isCommunity ? 'Permit Compliance' : 'Venue Density'}</span>
            <Users className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-black text-ink">
            {isCommunity && permitReport
              ? `${permitReport.readinessPercent}%`
              : activePlan.capacity
                ? `${activePlan.capacity.densitySqFtPerGuest} sq.ft`
                : 'Safe'}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-ink-muted">
            <span>{isCommunity ? 'Approved Permits:' : 'Guest Allocation:'}</span>
            <span className="font-mono font-semibold text-ink">
              {isCommunity && permitReport
                ? `${permitReport.approvedCount} / ${permitReport.totalPermits}`
                : `${activePlan.guestCount.toLocaleString()} guests`}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-state-info"
              style={{
                width: isCommunity && permitReport ? `${permitReport.readinessPercent}%` : '85%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Style & Cultural Vision Card */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-mono font-bold uppercase mb-1">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Host Vision &amp; Style Directive</span>
            </div>
            <h2 className="font-serif font-black text-xl text-ink">{activePlan.styleCulture}</h2>
            {activePlan.nonNegotiables && (
              <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                <strong>Non-Negotiable Priorities:</strong> {activePlan.nonNegotiables}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('creative')}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-accent-subtle text-accent text-xs font-bold hover:bg-accent/20 transition-colors shrink-0"
          >
            <span>Ideate with AI</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 2-Column Split: Key Milestones & Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Urgent Milestones */}
        <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg text-ink">Upcoming Deadlines</h3>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View Full Timeline &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {activePlan.timeline.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl border border-rule bg-paper-subtle/40 hover:bg-paper-subtle transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink">{task.title}</h4>
                  <span className="text-[11px] text-ink-muted">
                    Due {task.dueDate} &bull; {task.owner}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-accent-subtle text-accent">
                  {task.phase}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Creative Highlights */}
        <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg text-ink">
              Thematic &amp; Sensory Concepts
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('creative')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Explore AI Ideas &rarr;
            </button>
          </div>
          <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
            {activePlan.ideas.themes.map((theme, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-rule bg-paper-subtle/30">
                <span className="font-bold text-ink block mb-0.5">Concept {idx + 1}:</span>
                {theme}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
