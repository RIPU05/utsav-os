'use client';

import React, { useState } from 'react';
import { usePlan } from '../plan-context';
import { VENDOR_STATUS_PIPELINE, VendorStatus } from '@/lib/constants';
import { calculatePipelineSummary } from '@/lib/vendor-engine';
import { VendorPipelineCard } from '@/components/ui-sub';
import { Info } from 'lucide-react';

/**
 * Tab component for vendor discovery, procurement pipeline tracking,
 * and contract clause risk screening.
 *
 * @returns {React.ReactElement | null} The rendered vendor tab screen.
 */
export function TabVendors(): React.ReactElement | null {
  const { activePlan, updateVendorStatus } = usePlan();
  const [pipelineFilter, setPipelineFilter] = useState<string>('All');

  if (!activePlan) return null;

  const summary = calculatePipelineSummary(activePlan.vendors);

  const filteredVendors =
    pipelineFilter === 'All'
      ? activePlan.vendors
      : activePlan.vendors.filter((v) => {
          if (pipelineFilter === 'Lead') return v.status === 'Lead' || v.status === 'Shortlisted';
          if (pipelineFilter === 'Quoted') return v.status === 'Quoted' || v.status === 'Contacted';
          if (pipelineFilter === 'Signed') return v.status === 'Signed' || v.status === 'Booked';
          if (pipelineFilter === 'Paid') return v.status === 'Paid';
          return true;
        });

  const handleVendorStatusChange = (vendorId: string, newStatus: VendorStatus): void => {
    updateVendorStatus(vendorId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {VENDOR_STATUS_PIPELINE.map((stage) => {
          let count = 0;
          if (stage === 'Lead') count = summary.leadCount;
          if (stage === 'Quoted') count = summary.quotedCount;
          if (stage === 'Signed') count = summary.signedCount;
          if (stage === 'Paid') count = summary.paidCount;

          const isSelected = pipelineFilter === stage;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => setPipelineFilter(isSelected ? 'All' : stage)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent'
                  : 'border-rule bg-paper-card hover:bg-paper-subtle'
              }`}
            >
              <span className="text-[11px] font-mono uppercase text-ink-muted block">
                {stage} Pipeline
              </span>
              <div className="font-serif text-2xl font-bold text-ink mt-0.5">{count}</div>
              <span className="text-[11px] text-ink-faint mt-1 block">
                {stage === 'Signed' || stage === 'Paid' ? 'Legally Committed' : 'Discovery Phase'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contract & Ethics Guardrail Banner */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-serif font-black text-lg text-ink">
              Vendor Screening &amp; Contract Procurement Protocol
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
              Track vendor lifecycle across the 4-stage procurement pipeline:{' '}
              <strong>Lead &rarr; Quoted &rarr; Signed &rarr; Paid</strong>. Review key questions
              and analyze contract terms to ensure critical cancellation, overtime, and indemnity
              clauses are verified before signing.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', ...VENDOR_STATUS_PIPELINE].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setPipelineFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
              pipelineFilter === f
                ? 'bg-accent text-accent-text'
                : 'border border-rule bg-paper text-ink-muted hover:text-ink'
            }`}
          >
            {f} {f === 'All' ? `(${activePlan.vendors.length})` : ''}
          </button>
        ))}
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <VendorPipelineCard
            key={vendor.id}
            vendor={vendor}
            currency={activePlan.currency}
            onStatusChange={handleVendorStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
