'use client';

import React from 'react';
import { formatCurrency } from '@/lib/budget-engine';
import { CurrencyCode } from '@/lib/constants';
import { ShieldCheck, Receipt } from 'lucide-react';

/**
 * Props for the BudgetLedgerSummaryRows component.
 */
export interface BudgetLedgerSummaryRowsProps {
  contingencyPercent: number;
  contingencyAmount: number;
  taxServiceChargePercent: number;
  taxServiceChargeAmount: number;
  subtotalMin: number;
  totalCommitted: number;
  totalActualSpent: number;
  totalBudget: number;
  remainingBudget: number;
  isOverBudget: boolean;
  currency: CurrencyCode;
}

/**
 * Atomic table rows rendering contingency reserve, statutory fees, and grand total commitments.
 *
 * @param {BudgetLedgerSummaryRowsProps} props - Component properties.
 * @returns {React.ReactElement} The table summary rows fragment.
 */
export function BudgetLedgerSummaryRows({
  contingencyPercent,
  contingencyAmount,
  taxServiceChargePercent,
  taxServiceChargeAmount,
  subtotalMin,
  totalCommitted,
  totalActualSpent,
  totalBudget,
  remainingBudget,
  isOverBudget,
  currency,
}: BudgetLedgerSummaryRowsProps): React.ReactElement {
  const commitmentRatio = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;
  const remainingColorClass = isOverBudget ? 'text-state-error' : 'text-state-success';

  return (
    <>
      {/* Contingency Line */}
      <tr className="bg-paper-subtle/30 font-medium">
        <td className="p-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <span>Contingency Reserve ({contingencyPercent}%)</span>
        </td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right font-mono font-bold">
          {formatCurrency(contingencyAmount, currency)}
        </td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right font-mono text-ink-muted">{contingencyPercent}%</td>
        <td className="p-4 text-xs text-ink-muted">
          Reserve fund for unforeseen weather, logistics, or vendor overtime.
        </td>
      </tr>

      {/* Statutory Tax Line */}
      <tr className="bg-paper-subtle/30 font-medium">
        <td className="p-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <span>Statutory Taxes &amp; Fees ({taxServiceChargePercent}%)</span>
        </td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right font-mono font-bold">
          {formatCurrency(taxServiceChargeAmount, currency)}
        </td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right font-mono text-ink-muted">{taxServiceChargePercent}%</td>
        <td className="p-4 text-xs text-ink-muted">
          Statutory GST, venue hospitality charges, and local licensing permits.
        </td>
      </tr>

      {/* Grand Total Row */}
      <tr className="bg-paper-subtle font-black border-t-2 border-rule">
        <td className="p-4 text-sm font-serif">Total Committed Budget</td>
        <td className="p-4 text-right font-mono text-ink-muted">
          {formatCurrency(subtotalMin, currency)}
        </td>
        <td className="p-4 text-right font-mono text-base text-accent">
          {formatCurrency(totalCommitted, currency)}
        </td>
        <td className="p-4 text-right text-ink-muted">—</td>
        <td className="p-4 text-right font-mono text-accent">
          {formatCurrency(totalActualSpent, currency)}
        </td>
        <td className="p-4 text-right font-mono">{commitmentRatio}%</td>
        <td className="p-4 text-xs font-normal text-ink-muted">
          Remaining Envelope:{' '}
          <strong className={remainingColorClass}>
            {formatCurrency(remainingBudget, currency)}
          </strong>
        </td>
      </tr>
    </>
  );
}
