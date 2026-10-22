'use client';

import React from 'react';
import { formatCurrency } from '@/lib/budget-engine';
import { CurrencyCode } from '@/lib/constants';
import { calculateCommitmentPercent, clampPercentage } from '@/lib/ui-math';

export const DEFAULT_BAR_COLORS: readonly string[] = [
  'bg-amber-600 dark:bg-amber-500',
  'bg-emerald-600 dark:bg-emerald-500',
  'bg-cyan-600 dark:bg-cyan-400',
  'bg-indigo-600 dark:bg-indigo-400',
  'bg-teal-600 dark:bg-teal-400',
  'bg-orange-600 dark:bg-orange-400',
  'bg-blue-600 dark:bg-blue-400',
  'bg-rose-600 dark:bg-rose-400',
];

/**
 * Props for the BudgetStackedBar component.
 */
export interface BudgetStackedBarProps {
  /** Individual category breakdowns with percentage allocations */
  categoryBreakdowns: Array<{
    id: string;
    name: string;
    targetEstimate: number;
    percentOfBudget: number;
  }>;
  /** Contingency buffer percentage */
  contingencyPercent: number;
  /** Contingency absolute numerical amount */
  contingencyAmount: number;
  /** Tax and service charge percentage */
  taxServiceChargePercent: number;
  /** Tax and service charge absolute amount */
  taxServiceChargeAmount: number;
  /** Total sum committed across all allocations */
  totalCommitted: number;
  /** Declared total event budget */
  totalBudget: number;
  /** ISO 4217 Currency Code */
  currency: CurrencyCode;
  /** Whether the committed total exceeds the budget envelope */
  isOverBudget: boolean;
}

/**
 * Visual stacked progress bar rendering budget proportions with WCAG accessible attributes.
 *
 * @param {BudgetStackedBarProps} props - Component properties.
 * @returns {React.ReactElement} The rendered stacked bar and interactive legend.
 */
export function BudgetStackedBar({
  categoryBreakdowns,
  contingencyPercent,
  contingencyAmount,
  taxServiceChargePercent,
  taxServiceChargeAmount,
  totalCommitted,
  totalBudget,
  currency,
  isOverBudget,
}: BudgetStackedBarProps): React.ReactElement {
  const commitmentPercent = calculateCommitmentPercent(totalCommitted, totalBudget);

  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif font-bold text-base sm:text-lg text-ink">
          Allocation Distribution (Stacked Ledger Bar)
        </h2>
        <span className="text-xs font-mono font-bold">
          {isOverBudget ? (
            <span className="text-state-error">100%+ Committed</span>
          ) : (
            <span className="text-state-success">{commitmentPercent}% Committed</span>
          )}
        </span>
      </div>

      {/* Accessible Stacked Progress Bar */}
      <div
        role="progressbar"
        aria-label="Category allocation distribution bar"
        aria-valuenow={clampPercentage(commitmentPercent, 0, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-6 w-full rounded-full bg-paper-subtle overflow-hidden flex shadow-inner"
      >
        {categoryBreakdowns.map((item, idx) => {
          const width = clampPercentage(item.percentOfBudget, 0, 100);
          if (width <= 0) return null;
          return (
            <div
              key={item.id}
              style={{ width: `${width}%` }}
              title={`${item.name}: ${item.percentOfBudget}% (${formatCurrency(item.targetEstimate, currency)})`}
              className={`${DEFAULT_BAR_COLORS[idx % DEFAULT_BAR_COLORS.length]} h-full transition-all hover:opacity-80`}
            />
          );
        })}
        <div
          style={{
            width: `${clampPercentage((contingencyAmount / totalBudget) * 100, 0, 100)}%`,
          }}
          title={`Contingency Buffer: ${formatCurrency(contingencyAmount, currency)}`}
          className="bg-zinc-400 dark:bg-zinc-600 h-full hover:opacity-80"
        />
        <div
          style={{
            width: `${clampPercentage((taxServiceChargeAmount / totalBudget) * 100, 0, 100)}%`,
          }}
          title={`Taxes & Fees: ${formatCurrency(taxServiceChargeAmount, currency)}`}
          className="bg-zinc-500 dark:bg-zinc-700 h-full hover:opacity-80"
        />
      </div>

      {/* Interactive Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-muted">
        {categoryBreakdowns.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${DEFAULT_BAR_COLORS[idx % DEFAULT_BAR_COLORS.length]}`}
              aria-hidden="true"
            />
            <span className="font-medium text-ink">{item.name}</span>
            <span className="text-ink-faint font-mono">({item.percentOfBudget}%)</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden="true" />
          <span>Contingency ({contingencyPercent}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 dark:bg-zinc-700" aria-hidden="true" />
          <span>Taxes &amp; Fees ({taxServiceChargePercent}%)</span>
        </div>
      </div>
    </div>
  );
}
