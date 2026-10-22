'use client';

import React from 'react';

/**
 * Props for the BudgetStatCard component.
 */
export interface BudgetStatCardProps {
  /** Uppercase metric label (e.g. "Total Envelope", "Actual Spent") */
  label: string;
  /** Formatted currency string or primary metric */
  formattedValue: string;
  /** Explanatory subtext below the value */
  subtext: string;
  /** Highlight accent color for value text */
  isAccent?: boolean;
}

/**
 * Atomic KPI card for displaying budget summary metrics.
 *
 * @param {BudgetStatCardProps} props - Component properties.
 * @returns {React.ReactElement} The rendered KPI card.
 */
export function BudgetStatCard({
  label,
  formattedValue,
  subtext,
  isAccent = false,
}: BudgetStatCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs transition-shadow hover:shadow-md">
      <span className="text-[11px] font-mono uppercase text-ink-muted block mb-1">
        {label}
      </span>
      <div
        className={`font-serif text-2xl font-bold ${
          isAccent ? 'text-accent' : 'text-ink'
        }`}
      >
        {formattedValue}
      </div>
      <span className="text-[11px] text-ink-faint mt-1 block">{subtext}</span>
    </div>
  );
}
