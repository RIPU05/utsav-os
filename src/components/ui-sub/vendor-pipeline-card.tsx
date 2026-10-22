'use client';

import { VendorItem, VendorStatus } from '@/lib/schemas';
import { CurrencyCode, VENDOR_STATUS_PIPELINE } from '@/lib/constants';
import { formatCurrency } from '@/lib/budget-engine';
import { analyzeContractTerms } from '@/lib/vendor-engine';
import { Building, ShieldAlert, HelpCircle } from 'lucide-react';

/**
 * Props for the VendorPipelineCard component.
 */
export interface VendorPipelineCardProps {
  /** The vendor item entity */
  vendor: VendorItem;
  /** ISO 4217 Currency Code */
  currency: CurrencyCode;
  /** Callback fired when user transitions vendor status */
  onStatusChange: (vendorId: string, newStatus: VendorStatus) => void;
}

/**
 * Atomic card rendering a single vendor in the 4-stage procurement machine
 * (Lead -> Quoted -> Signed -> Paid) with contract clause risk scoring.
 *
 * @param {VendorPipelineCardProps} props - Component properties.
 * @returns {React.ReactElement} The vendor card element.
 */
export function VendorPipelineCard({
  vendor,
  currency,
  onStatusChange,
}: VendorPipelineCardProps): React.ReactElement {
  const contractAnalysis = analyzeContractTerms(vendor.contractTermsSummary || vendor.notes || '');

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onStatusChange(vendor.id, e.target.value as VendorStatus);
  };

  const scoreColorClass =
    contractAnalysis.score >= 80
      ? 'text-state-success'
      : contractAnalysis.score >= 40
        ? 'text-state-warning'
        : 'text-state-error';

  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header: Title & Verification */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-accent" aria-hidden="true" />
            <h3 className="font-serif font-black text-base text-ink">{vendor.categoryName}</h3>
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
              {vendor.quoteAmount ? formatCurrency(vendor.quoteAmount, currency) : 'Pending Quote'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-ink-muted uppercase block">
              Contract Clause Score
            </span>
            <span className={`text-xs font-mono font-bold ${scoreColorClass}`}>
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
              <span className="text-ink-muted">{contractAnalysis.missingClauses.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Pipeline Transition Selector */}
      <div className="pt-4 border-t border-rule flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-ink-muted">Pipeline Stage:</span>
        <select
          value={vendor.status}
          onChange={handleStatusSelect}
          aria-label={`Update procurement status for ${vendor.categoryName}`}
          className="min-h-[40px] rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs font-bold text-ink focus:border-accent"
        >
          {VENDOR_STATUS_PIPELINE.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
