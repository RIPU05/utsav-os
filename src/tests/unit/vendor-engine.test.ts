import { describe, it, expect } from 'vitest';
import {
  calculatePipelineSummary,
  validateStatusTransition,
  analyzeContractTerms,
  compareVendorQuotes,
} from '@/lib/vendor-engine';
import { VendorItem } from '@/lib/schemas';

describe('Vendor Engine - Pipeline & Contract Analyzer', () => {
  const sampleVendors: VendorItem[] = [
    {
      id: 'v-1',
      categoryName: 'Catering',
      vendorTypeDescription: 'Luxury banquet',
      status: 'Signed',
      quoteAmount: 500000,
      contractedAmount: 500000,
      contractTermsSummary: 'Standard cancellation 30 days prior. Overtime hourly rate applies.',
      questionsToAsk: ['Food safety certs?'],
      verifyWithVendorNotice: 'Verify',
      notes: '',
    },
    {
      id: 'v-2',
      categoryName: 'Photography',
      vendorTypeDescription: 'Candid video',
      status: 'Lead',
      quoteAmount: 150000,
      questionsToAsk: ['Teaser turnaround?'],
      verifyWithVendorNotice: 'Verify',
      notes: '',
    },
    {
      id: 'v-3',
      categoryName: 'Decor',
      vendorTypeDescription: 'Floral mandap',
      status: 'Quoted',
      quoteAmount: 300000,
      questionsToAsk: ['Breakdown time?'],
      verifyWithVendorNotice: 'Verify',
      notes: '',
    },
  ];

  it('accurately tallies procurement pipeline counts and committed values', () => {
    const summary = calculatePipelineSummary(sampleVendors);
    expect(summary.leadCount).toBe(1);
    expect(summary.quotedCount).toBe(1);
    expect(summary.signedCount).toBe(1);
    expect(summary.paidCount).toBe(0);
    expect(summary.totalCommittedContractValue).toBe(500000);
  });

  it('validates status transitions and flags missing agreed amounts', () => {
    const vendorWithoutAmount: VendorItem = {
      id: 'v-none',
      categoryName: 'Band',
      vendorTypeDescription: 'Live band',
      status: 'Lead',
      questionsToAsk: ['Rate?'],
      verifyWithVendorNotice: 'Verify',
      notes: '',
    };

    // Cannot transition to Signed without quote or contract amount
    const invalidTransition = validateStatusTransition('Lead', 'Signed', vendorWithoutAmount);
    expect(invalidTransition.allowed).toBe(false);

    // Valid transition when quote amount exists
    const validTransition = validateStatusTransition('Lead', 'Signed', sampleVendors[1]);
    expect(validTransition.allowed).toBe(true);
  });

  it('analyzes contract terms and scores protective clauses', () => {
    const strongContract = `
      Cancellation & refund within 30 days.
      Overtime hourly rate of $200 applies after 11 PM.
      Force majeure weather contingency included.
      General liability insurance coverage of $2M provided.
      Deliverables schedule guarantees handover within 14 days.
    `;
    const strongResult = analyzeContractTerms(strongContract);
    expect(strongResult.score).toBe(100);
    expect(strongResult.riskRating).toBe('Low Risk');
    expect(strongResult.missingClauses).toHaveLength(0);

    const weakContract = 'Catering services provided on event day.';
    const weakResult = analyzeContractTerms(weakContract);
    expect(weakResult.score).toBe(0);
    expect(weakResult.riskRating).toBe('High Risk');
    expect(weakResult.missingClauses.length).toBeGreaterThan(3);
  });

  it('compares quotes and calculates variance against budget target', () => {
    const quotes = [
      {
        bidder: 'Studio Alpha',
        amount: 140000,
        terms: 'Cancellation refund, overtime rate included.',
      },
      {
        bidder: 'Studio Beta',
        amount: 190000, // over allocated target of 150000
        terms: 'All deliverables guaranteed.',
      },
    ];

    const comparison = compareVendorQuotes('Photography', quotes, 150000);
    expect(comparison.recommendedBidder).toBe('Studio Alpha');
    expect(comparison.comparisonItems[0].variancePercent).toBeLessThan(0); // under budget
  });
});
