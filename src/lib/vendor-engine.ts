/**
 * @fileoverview Vendor procurement engine and contract risk auditor.
 * Tracks the 4-stage procurement machine (Lead -> Quoted -> Signed -> Paid),
 * analyzes vendor contracts for missing protective clauses (cancellation, force majeure,
 * overtime caps, insurance), and performs multicriteria quote comparisons.
 */

import { VendorItem, VendorStatus } from './schemas';

/**
 * Summary metrics for the vendor procurement pipeline.
 */
export interface PipelineSummary {
  /** Count of vendors in Lead or Shortlisted discovery stages */
  leadCount: number;
  /** Count of vendors in Contacted or Quoted proposal stages */
  quotedCount: number;
  /** Count of vendors with signed agreements */
  signedCount: number;
  /** Count of vendors with fully settled invoices */
  paidCount: number;
  /** Total value of committed contracts and signed agreements */
  totalCommittedContractValue: number;
}

/**
 * Calculates metrics across the procurement pipeline (Lead -> Quoted -> Signed -> Paid).
 *
 * @param {VendorItem[]} vendors - Array of vendor items in the event plan.
 * @returns {PipelineSummary} Pipeline volume and financial commitment figures.
 * @throws {never} Safely returns zero counts for empty arrays.
 */
export function calculatePipelineSummary(vendors: VendorItem[]): PipelineSummary {
  let leadCount = 0;
  let quotedCount = 0;
  let signedCount = 0;
  let paidCount = 0;
  let totalCommittedContractValue = 0;

  for (const v of vendors) {
    if (v.status === 'Lead' || v.status === 'Shortlisted') {
      leadCount++;
    } else if (v.status === 'Quoted' || v.status === 'Contacted') {
      quotedCount++;
    } else if (v.status === 'Signed' || v.status === 'Booked') {
      signedCount++;
      totalCommittedContractValue += v.contractedAmount || v.quoteAmount || 0;
    } else if (v.status === 'Paid') {
      paidCount++;
      totalCommittedContractValue += v.contractedAmount || v.quoteAmount || 0;
    }
  }

  return {
    leadCount,
    quotedCount,
    signedCount,
    paidCount,
    totalCommittedContractValue,
  };
}

/**
 * Validates whether a state transition along the vendor pipeline is permitted.
 *
 * @param {VendorStatus} currentStatus - Existing vendor stage.
 * @param {VendorStatus} targetStatus - Proposed new stage.
 * @param {VendorItem} vendor - Vendor entity being updated.
 * @returns {{ allowed: boolean; reason?: string }} Result indicating whether transition is valid.
 * @throws {never}
 */
export function validateStatusTransition(
  currentStatus: VendorStatus,
  targetStatus: VendorStatus,
  vendor: VendorItem
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) return { allowed: true };

  // Can move forward or backward freely in procurement, but flag missing contract for Signed/Paid
  if (targetStatus === 'Signed' || targetStatus === 'Paid') {
    if (!vendor.quoteAmount && !vendor.contractedAmount) {
      return {
        allowed: false,
        reason: 'Please record an agreed quote or contract amount before moving to Signed or Paid.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Analyzes vendor contract terms for missing protective clauses.
 *
 * @param {string} termsText - Raw contract terms text or agreement notes.
 * @returns {{ score: number; foundClauses: string[]; missingClauses: string[]; riskRating: 'Low Risk' | 'Moderate Risk' | 'High Risk' }}
 * Contract compliance evaluation object.
 * @throws {never}
 */
export function analyzeContractTerms(termsText: string): {
  score: number; // 0 to 100
  foundClauses: string[];
  missingClauses: string[];
  riskRating: 'Low Risk' | 'Moderate Risk' | 'High Risk';
} {
  const termsLower = (termsText || '').toLowerCase();

  const standardClauses = [
    {
      name: 'Cancellation & Refund Terms',
      keywords: ['cancellation', 'refund', 'deposit refund', 'cooling off'],
    },
    {
      name: 'Force Majeure & Weather Acts',
      keywords: ['force majeure', 'acts of god', 'weather contingency', 'unforeseen'],
    },
    {
      name: 'Overtime & Excess Hours Rate',
      keywords: ['overtime', 'hourly rate', 'extra hour', 'delay fee'],
    },
    {
      name: 'Liability & Damage Insurance',
      keywords: ['liability', 'indemnity', 'damage', 'insurance'],
    },
    {
      name: 'Deliverables & Completion Timetable',
      keywords: ['deliverables', 'completion', 'handover', 'schedule', 'timetable'],
    },
  ];

  const foundClauses: string[] = [];
  const missingClauses: string[] = [];

  for (const clause of standardClauses) {
    const hasMatch = clause.keywords.some((kw) => termsLower.includes(kw));
    if (hasMatch) {
      foundClauses.push(clause.name);
    } else {
      missingClauses.push(clause.name);
    }
  }

  const score = Math.round((foundClauses.length / standardClauses.length) * 100);
  let riskRating: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
  if (score < 40) riskRating = 'High Risk';
  else if (score < 80) riskRating = 'Moderate Risk';

  return {
    score,
    foundClauses,
    missingClauses,
    riskRating,
  };
}

/**
 * Compares two or more quote options deterministically.
 *
 * @param {string} vendorCategory - Category name (e.g. Photography).
 * @param {Array<{ bidder: string; amount: number; terms: string }>} quotes - Array of competing bids.
 * @param {number} allocatedBudget - Budget amount budgeted for this category.
 * @returns {{ recommendedBidder: string; varianceSummary: string; comparisonItems: Array<{ bidder: string; variancePercent: number; contractScore: number }> }}
 * Multi-criteria comparative assessment.
 * @throws {never}
 */
export function compareVendorQuotes(
  vendorCategory: string,
  quotes: { bidder: string; amount: number; terms: string }[],
  allocatedBudget: number
): {
  recommendedBidder: string;
  varianceSummary: string;
  comparisonItems: { bidder: string; variancePercent: number; contractScore: number }[];
} {
  if (quotes.length === 0) {
    return {
      recommendedBidder: 'None',
      varianceSummary: 'No quotes provided for comparison.',
      comparisonItems: [],
    };
  }

  const evaluated = quotes.map((q) => {
    const variancePercent =
      allocatedBudget > 0 ? Math.round(((q.amount - allocatedBudget) / allocatedBudget) * 100) : 0;
    const { score } = analyzeContractTerms(q.terms);
    return {
      bidder: q.bidder,
      amount: q.amount,
      variancePercent,
      contractScore: score,
      compositeScore: score * 0.4 - variancePercent * 0.6,
    };
  });

  evaluated.sort((a, b) => b.compositeScore - a.compositeScore);
  const best = evaluated[0];

  const varianceSummary =
    best.variancePercent <= 0
      ? `${best.bidder} is within allocated category budget (${Math.abs(best.variancePercent)}% under target).`
      : `${best.bidder} exceeds category target by ${best.variancePercent}%, but offers strong contract safety.`;

  return {
    recommendedBidder: best.bidder,
    varianceSummary,
    comparisonItems: evaluated.map(({ bidder, variancePercent, contractScore }) => ({
      bidder,
      variancePercent,
      contractScore,
    })),
  };
}
