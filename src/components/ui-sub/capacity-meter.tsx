'use client';

import React from 'react';
import { CapacityMetrics } from '@/lib/schemas';
import { Scale } from 'lucide-react';

/**
 * Props for the CapacityMeter component.
 */
export interface CapacityMeterProps {
  /** The NFPA 101 / National Building Code crowd capacity calculation metrics */
  capacityMetrics: CapacityMetrics;
}

/**
 * Atomic component rendering Life Safety Code venue capacity statistics,
 * density metrics, and egress safety recommendations.
 *
 * @param {CapacityMeterProps} props - Component properties.
 * @returns {React.ReactElement} The rendered capacity assessment card.
 */
export function CapacityMeter({ capacityMetrics }: CapacityMeterProps): React.ReactElement {
  const isSafe = capacityMetrics.safetyStatus === 'Safe';
  const isWarning = capacityMetrics.safetyStatus === 'Nearing Capacity';

  const statusColorClass = isSafe
    ? 'text-state-success'
    : isWarning
    ? 'text-state-warning'
    : 'text-state-error';

  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
        <h3 className="font-serif font-black text-lg text-ink">
          Life Safety Code Venue Assessment
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
        <div className="p-3 rounded-xl bg-paper-subtle/50">
          <span className="text-ink-muted block">Usable Venue Area:</span>
          <span className="font-mono font-bold text-ink text-sm">
            {capacityMetrics.venueAreaSqFt.toLocaleString()} sq.ft
          </span>
        </div>
        <div className="p-3 rounded-xl bg-paper-subtle/50">
          <span className="text-ink-muted block">Occupant Density:</span>
          <span className="font-mono font-bold text-ink text-sm">
            {capacityMetrics.densitySqFtPerGuest} sq.ft / guest
          </span>
        </div>
        <div className="p-3 rounded-xl bg-paper-subtle/50">
          <span className="text-ink-muted block">Max Safe Capacity:</span>
          <span className="font-mono font-bold text-ink text-sm">
            {capacityMetrics.maxSafeOccupancy.toLocaleString()} guests
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-rule bg-paper-card">
        <span className="text-xs text-ink-muted block">Regulatory Assessment:</span>
        <span className={`text-xs font-bold mt-0.5 block ${statusColorClass}`}>
          {capacityMetrics.safetyStatus}
        </span>
        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-ink-muted">
          {capacityMetrics.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
