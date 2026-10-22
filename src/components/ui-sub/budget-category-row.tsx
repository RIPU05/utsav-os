'use client';

import React from 'react';
import { formatCurrency } from '@/lib/budget-engine';
import { CurrencyCode } from '@/lib/constants';

/**
 * Props for the BudgetCategoryRow component.
 */
export interface BudgetCategoryRowProps {
  /** Category ID */
  id: string;
  /** Category display name */
  name: string;
  /** Flag indicating actual spend exceeds the hard cap */
  isOverCap: boolean;
  /** Minimum range estimate */
  minEstimate: number;
  /** Target planning allocation */
  targetEstimate: number;
  /** Optional hard cap limit */
  capLimit?: number;
  /** Current verified expenditure */
  actualSpent: number;
  /** Proportion of total budget envelope */
  percentOfBudget: number;
  /** Category scope notes */
  notes?: string;
  /** ISO 4217 Currency Code */
  currency: CurrencyCode;
  /** Callback invoked when the user modifies actual spent */
  onUpdateSpent: (categoryId: string, newSpent: number) => void;
}

/**
 * Atomic table row rendering a single budget category within the master ledger.
 *
 * @param {BudgetCategoryRowProps} props - Component properties.
 * @returns {React.ReactElement} The table row element.
 */
export function BudgetCategoryRow({
  id,
  name,
  isOverCap,
  minEstimate,
  targetEstimate,
  capLimit,
  actualSpent,
  percentOfBudget,
  notes = '—',
  currency,
  onUpdateSpent,
}: BudgetCategoryRowProps): React.ReactElement {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const parsed = Number(e.target.value);
    onUpdateSpent(id, Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
  };

  return (
    <tr className="hover:bg-paper-subtle/40 transition-colors">
      <td className="p-4 font-semibold text-ink">
        <div className="flex items-center gap-1.5">
          <span>{name}</span>
          {isOverCap && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-state-error/20 text-state-error font-bold">
              Cap Exceeded
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-right font-mono text-ink-muted">
        {formatCurrency(minEstimate, currency)}
      </td>
      <td className="p-4 text-right font-mono font-bold text-ink">
        {formatCurrency(targetEstimate, currency)}
      </td>
      <td className="p-4 text-right font-mono text-ink-muted">
        {capLimit ? formatCurrency(capLimit, currency) : '—'}
      </td>
      <td className="p-4 text-right font-mono">
        <input
          type="number"
          aria-label={`Actual spend for ${name}`}
          value={actualSpent || ''}
          placeholder="0"
          onChange={handleInputChange}
          className="w-24 text-right p-1 rounded border border-rule bg-paper text-ink font-mono focus:border-accent"
        />
      </td>
      <td className="p-4 text-right font-mono text-ink-muted">{percentOfBudget}%</td>
      <td className="p-4 text-xs text-ink-muted max-w-xs leading-relaxed">{notes || '—'}</td>
    </tr>
  );
}
