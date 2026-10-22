'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlan } from '../plan-context';
import { ReplanDiffResponse, EventPlan } from '@/lib/schemas';
import { formatCurrency } from '@/lib/budget-engine';
import {
  X,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

/**
 * Accessible modal dialog enabling dynamic budget, guest count, and date replanning
 * with side-by-side diff confirmation.
 *
 * @returns {React.ReactElement | null} The dialog element or null if closed.
 */
export function ReplanModal(): React.ReactElement | null {
  const { activePlan, isReplanOpen, setIsReplanOpen, setActivePlan, announce } = usePlan();

  const [proposedBudget, setProposedBudget] = useState<number>(activePlan?.totalBudget || 0);
  const [proposedGuests, setProposedGuests] = useState<number>(activePlan?.guestCount || 0);
  const [proposedDate, setProposedDate] = useState<string>(activePlan?.date || '');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [categoryNewTarget, setCategoryNewTarget] = useState<number>(0);

  const [isCalculating, setIsCalculating] = useState(false);
  const [proposedDiff, setProposedDiff] = useState<ReplanDiffResponse | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (activePlan) {
      setProposedBudget(activePlan.totalBudget);
      setProposedGuests(activePlan.guestCount);
      setProposedDate(activePlan.date);
      if (activePlan.budget.categories[0]) {
        setSelectedCatId(activePlan.budget.categories[0].id);
        setCategoryNewTarget(activePlan.budget.categories[0].targetEstimate);
      }
    }
  }, [activePlan]);

  const handleClose = React.useCallback(() => {
    setIsReplanOpen(false);
    setProposedDiff(null);
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [setIsReplanOpen]);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (isReplanOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        } else if (e.key === 'Tab' && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isReplanOpen, handleClose]);

  if (!isReplanOpen || !activePlan) return null;

  const handleCalculateReplan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    announce('Calculating optimal budget rebalancing adjustments...');

    try {
      const payload = {
        currentPlan: activePlan,
        changes: {
          totalBudget: proposedBudget !== activePlan.totalBudget ? proposedBudget : undefined,
          guestCount: proposedGuests !== activePlan.guestCount ? proposedGuests : undefined,
          eventDate: proposedDate !== activePlan.date ? proposedDate : undefined,
          modifiedCategory:
            selectedCatId && categoryNewTarget > 0
              ? { categoryId: selectedCatId, newTargetEstimate: categoryNewTarget }
              : undefined,
        },
      };

      const res = await fetch('/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Rebalancing service unavailable');
      }

      const diff: ReplanDiffResponse = await res.json();
      setProposedDiff(diff);
      announce('Proposed rebalancing diff generated.');
    } catch {
      // Deterministic fallback diff calculation if AI service is busy
      const diffBudgetRatio = proposedBudget / activePlan.totalBudget;
      const rebalancedCategories = activePlan.budget.categories.map((c) => ({
        ...c,
        targetEstimate: Math.round(c.targetEstimate * diffBudgetRatio),
        minEstimate: Math.round(c.minEstimate * diffBudgetRatio),
        maxEstimate: Math.round(c.maxEstimate * diffBudgetRatio),
      }));

      setProposedDiff({
        summaryOfChanges: `Proportionally adjusted allocations across all categories by ${Math.round((diffBudgetRatio - 1) * 100)}% to fit new envelope.`,
        why: 'Maintains healthy ratios across all planned categories while aligning strictly with revised budget constraints.',
        tradeOffOptions: [
          'Option A: Prioritize venue and catering while reducing decor and entertainment.',
          'Option B: Retain full entertainment scale and negotiate tiered menu packages.',
        ],
        affectedBudgetCategories: rebalancedCategories,
        affectedTimelineTasks: activePlan.timeline,
      });
      announce('Fallback deterministic rebalancing computed.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyDiff = () => {
    if (!proposedDiff) return;

    const mergedCategories = activePlan.budget.categories.map((c) => {
      const updated = proposedDiff.affectedBudgetCategories.find((u) => u.id === c.id);
      return updated ? { ...c, ...updated } : c;
    });

    const newVersion: EventPlan = {
      ...activePlan,
      totalBudget: proposedBudget,
      guestCount: proposedGuests,
      date: proposedDate,
      budget: {
        ...activePlan.budget,
        categories: mergedCategories,
        contingencyPercent:
          proposedDiff.newContingencyPercent ?? activePlan.budget.contingencyPercent,
      },
      updatedAt: new Date().toISOString(),
      version: activePlan.version + 1,
    };

    setActivePlan(newVersion);
    announce(`Applied rebalancing diff. Created version ${newVersion.version}.`);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-rule bg-paper-card p-6 sm:p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rule">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-subtle text-accent">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="replan-dialog-title" className="font-serif font-black text-xl text-ink">
                Budget-Aware Rebalancing Engine
              </h2>
              <p className="text-xs text-ink-muted">
                Adjust key constraints to calculate optimal allocation trade-offs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-paper-subtle transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Rebalancing Input Form */}
        <form onSubmit={handleCalculateReplan} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="replan-budget" className="text-xs font-semibold text-ink block mb-1">
                Target Budget ({activePlan.currency}):
              </label>
              <input
                id="replan-budget"
                type="number"
                value={proposedBudget}
                onChange={(e) => setProposedBudget(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper text-sm font-mono text-ink focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="replan-guests" className="text-xs font-semibold text-ink block mb-1">
                Guest Count:
              </label>
              <input
                id="replan-guests"
                type="number"
                value={proposedGuests}
                onChange={(e) => setProposedGuests(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper text-sm font-mono text-ink focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="replan-date" className="text-xs font-semibold text-ink block mb-1">
                Celebration Date:
              </label>
              <input
                id="replan-date"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper text-sm text-ink focus:border-accent"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isCalculating}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isCalculating ? 'Calculating Diff...' : 'Compute Rebalanced Diff'}</span>
            </button>
          </div>
        </form>

        {/* Proposed Diff Review Block */}
        {proposedDiff && (
          <div className="mt-6 pt-6 border-t border-rule space-y-4">
            <div className="p-4 rounded-2xl border border-accent/40 bg-accent-subtle/30">
              <span className="text-[11px] font-mono font-bold uppercase text-accent block mb-1">
                Executive Rebalancing Rationale
              </span>
              <h3 className="font-serif font-black text-base text-ink mb-1">
                {proposedDiff.summaryOfChanges}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">{proposedDiff.why}</p>
            </div>

            {/* Trade-off Options */}
            <div>
              <span className="text-xs font-bold text-ink block mb-2">
                Evaluated Trade-Off Options:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-ink-muted leading-relaxed">
                {proposedDiff.tradeOffOptions.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            </div>

            {/* Before vs After Allocation Preview */}
            <div className="rounded-xl border border-rule overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-subtle text-ink-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Current Target</th>
                    <th className="p-3 text-right">Proposed Target</th>
                    <th className="p-3 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  {proposedDiff.affectedBudgetCategories.map((newCat) => {
                    const current = activePlan.budget.categories.find((c) => c.id === newCat.id);
                    const currentVal = current?.targetEstimate || 0;
                    const diffVal = newCat.targetEstimate - currentVal;

                    return (
                      <tr key={newCat.id}>
                        <td className="p-3 font-sans font-medium text-ink">{newCat.name}</td>
                        <td className="p-3 text-right text-ink-muted">
                          {formatCurrency(currentVal, activePlan.currency)}
                        </td>
                        <td className="p-3 text-right font-bold text-ink">
                          {formatCurrency(newCat.targetEstimate, activePlan.currency)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            diffVal > 0
                              ? 'text-state-warning'
                              : diffVal < 0
                                ? 'text-state-success'
                                : 'text-ink-muted'
                          }`}
                        >
                          {diffVal > 0 ? `+${diffVal.toLocaleString()}` : diffVal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Commit or Discard Actions */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProposedDiff(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-rule text-xs font-semibold text-ink hover:bg-paper-subtle transition-colors"
              >
                Discard Proposal
              </button>
              <button
                type="button"
                onClick={handleApplyDiff}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Apply Rebalanced Version (v{activePlan.version + 1})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
