'use client';

import React, { useState } from 'react';
import { usePlan } from '../plan-context';
import { VENDOR_STATUS_PIPELINE, VendorStatus } from '@/lib/constants';
import {
  calculatePipelineSummary,
  analyzeContractTerms,
  compareVendorQuotes,
} from '@/lib/vendor-engine';
import { formatCurrency } from '@/lib/budget-engine';
import {
  ShieldAlert,
  HelpCircle,
  Building,
  Info,
  FileCheck2,
  CheckCircle2,
  Scale,
  Receipt,
  FileText,
} from 'lucide-react';

export function TabVendors() {
  const { activePlan, updateVendorStatus } = usePlan();
  const [pipelineFilter, setPipelineFilter] = useState<string>('All');
  const [selectedVendorForAnalysis, setSelectedVendorForAnalysis] = useState<string | null>(null);

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
              <div className="font-serif text-2xl font-bold text-ink mt-0.5">
                {count}
              </div>
              <span className="text-[11px] text-ink-faint mt-1 block">
                {stage === 'Signed' || stage === 'Paid'
                  ? 'Legally Committed'
                  : 'Discovery Phase'}
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
              Track vendor lifecycle across the 4-stage procurement pipeline: <strong>Lead &rarr; Quoted &rarr; Signed &rarr; Paid</strong>.
              Review key questions and analyze contract terms to ensure critical cancellation, overtime, and indemnity clauses are verified before signing.
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
        {filteredVendors.map((vendor) => {
          const contractAnalysis = analyzeContractTerms(
            vendor.contractTermsSummary || vendor.notes || ''
          );

          return (
            <div
              key={vendor.id}
              className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header: Title & Verification */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-accent" aria-hidden="true" />
                    <h3 className="font-serif font-black text-base text-ink">
                      {vendor.categoryName}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/30">
                    <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                    {vendor.verifyWithVendorNotice || 'Verify with vendor'}
                  </span>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed mb-4">
                  {vendor.vendorTypeDescription}
                </p>

                {/* Quote and Contract Value Fields */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-rule bg-paper-subtle/40 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">
                      Agreed Quote / Bid
                    </span>
                    <span className="text-xs font-mono font-bold text-ink">
                      {vendor.quoteAmount
                        ? formatCurrency(vendor.quoteAmount, activePlan.currency)
                        : 'Pending Quote'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">
                      Contract Clause Score
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        contractAnalysis.score >= 80
                          ? 'text-state-success'
                          : contractAnalysis.score >= 40
                          ? 'text-state-warning'
                          : 'text-state-error'
                      }`}
                    >
                      {contractAnalysis.score}/100 ({contractAnalysis.riskRating})
                    </span>
                  </div>
                </div>

                {/* Screening Questions Checklist */}
                <div className="p-3.5 rounded-xl border border-rule bg-paper-subtle/50 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-2">
                    <HelpCircle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>Key Questions to Ask Candidates:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-muted leading-relaxed">
                    {vendor.questionsToAsk.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>

                {/* Contract Clauses Verified vs Missing */}
                <div className="text-[11px] space-y-1 mb-4 text-ink-muted">
                  <div>
                    <span className="font-semibold text-ink">Protected Clauses: </span>
                    {contractAnalysis.foundClauses.length > 0 ? (
                      <span className="text-state-success font-medium">
                        {contractAnalysis.foundClauses.join(', ')}
                      </span>
                    ) : (
                      <span className="text-state-error">None verified</span>
                    )}
                  </div>
                  {contractAnalysis.missingClauses.length > 0 && (
                    <div>
                      <span className="font-semibold text-state-warning">Missing Clauses: </span>
                      <span className="text-ink-muted">
                        {contractAnalysis.missingClauses.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Pipeline Transition Selector */}
              <div className="pt-4 border-t border-rule flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-ink-muted">Pipeline Stage:</span>
                <select
                  value={vendor.status}
                  onChange={(e) =>
                    updateVendorStatus(vendor.id, e.target.value as VendorStatus)
                  }
                  aria-label={`Update procurement status for ${vendor.categoryName}`}
                  className="min-h-[44px] rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs font-bold text-ink focus:border-accent"
                >
                  {VENDOR_STATUS_PIPELINE.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
