'use client';

import React from 'react';
import { usePlan } from '../plan-context';
import { History, Undo2, RotateCcw, Clock } from 'lucide-react';

/**
 * Plan Version History and Undo tab allowing hosts to review immutable past snapshots
 * and revert unintended budget modifications or schedule date shifts.
 *
 * @returns {React.ReactElement | null} The history dashboard element or null.
 */
export function TabHistory(): React.ReactElement | null {
  const { activePlan, planHistory, undoLastChange, setActivePlan, announce } = usePlan();

  if (!activePlan) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-2xl text-ink">
            Version History &amp; Reversion Stack
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Every budget rebalance, date shift, or major mutation creates an immutable version
            checkpoint.
          </p>
        </div>
        {planHistory.length > 0 && (
          <button
            type="button"
            onClick={undoLastChange}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors shrink-0"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            <span>Undo Last Mutation</span>
          </button>
        )}
      </div>

      {/* Active Version Card */}
      <div className="rounded-2xl border-2 border-accent/40 bg-accent-subtle/30 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent text-accent-text uppercase">
            Active Current Version (v{activePlan.version})
          </span>
          <span className="text-xs font-mono text-ink-muted">
            Updated: {new Date(activePlan.updatedAt).toLocaleString()}
          </span>
        </div>
        <h3 className="font-serif font-bold text-base text-ink mt-2">{activePlan.title}</h3>
        <p className="text-xs text-ink-muted mt-1">
          {activePlan.guestCount} Guests &bull; {activePlan.timeline.length} Milestones &bull;{' '}
          {activePlan.vendors.length} Vendors
        </p>
      </div>

      {/* Historical Stack */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-lg text-ink">
          Previous Version Checkpoints ({planHistory.length})
        </h3>
        {planHistory.length === 0 ? (
          <div className="p-8 text-center border border-rule rounded-2xl bg-paper-card text-ink-muted text-xs">
            No previous checkpoints recorded. Modify the budget, dates, or vendor statuses to build
            version history.
          </div>
        ) : (
          planHistory.map((historicalPlan, idx) => (
            <div
              key={`${historicalPlan.id}-hist-${idx}`}
              className="p-4 rounded-xl border border-rule bg-paper-card flex items-center justify-between gap-4 hover:border-accent transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-ink">
                    v{historicalPlan.version}
                  </span>
                  <span className="text-xs font-medium text-ink-muted">{historicalPlan.title}</span>
                </div>
                <span className="text-[11px] font-mono text-ink-faint block mt-0.5">
                  Saved at {new Date(historicalPlan.updatedAt).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActivePlan(historicalPlan);
                  announce(`Restored plan to v${historicalPlan.version}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule text-xs font-bold text-ink hover:bg-paper-subtle transition-colors min-h-[36px]"
              >
                <RotateCcw className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>Restore This Version</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
