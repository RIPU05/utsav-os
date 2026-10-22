import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  generateCostRebalancingSuggestions,
  formatCurrency,
} from '@/lib/budget-engine';
import { BudgetPlan } from '@/lib/schemas';

describe('Budget Engine - Deterministic Calculations', () => {
  const samplePlan: BudgetPlan = {
    categories: [
      {
        id: 'cat-1',
        name: 'Venue & Lawn',
        minEstimate: 100000,
        targetEstimate: 120000,
        maxEstimate: 150000,
        capLimit: 130000,
        actualSpent: 125000,
        notes: '2-day booking',
      },
      {
        id: 'cat-2',
        name: 'Catering',
        minEstimate: 150000,
        targetEstimate: 200000,
        maxEstimate: 250000,
        capLimit: 190000, // target exceeds cap -> triggers alert
        actualSpent: 210000,
        notes: 'Royal thali',
      },
      {
        id: 'cat-3',
        name: 'Decor & Florals',
        minEstimate: 50000,
        targetEstimate: 80000,
        maxEstimate: 100000,
        capLimit: 90000,
        actualSpent: 70000,
        notes: 'Marigolds',
      },
    ],
    contingencyPercent: 10,
    taxServiceChargePercent: 5,
    statedAssumptions: ['Peak season booking'],
    costRebalancingSuggestions: [],
  };

  it('correctly calculates subtotals, contingency, taxes, and commitments', () => {
    // subtotalTarget = 120,000 + 200,000 + 80,000 = 400,000
    // contingency = 10% of 400,000 = 40,000
    // taxes = 5% of 400,000 = 20,000
    // totalCommitted = 460,000
    // totalBudget = 500,000 -> remaining = 40,000
    const summary = calculateBudgetSummary(samplePlan, 500000);

    expect(summary.subtotalTarget).toBe(400000);
    expect(summary.subtotalMin).toBe(300000);
    expect(summary.subtotalMax).toBe(500000);
    expect(summary.contingencyAmount).toBe(40000);
    expect(summary.taxServiceChargeAmount).toBe(20000);
    expect(summary.totalCommitted).toBe(460000);
    expect(summary.remainingBudget).toBe(40000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.overBudgetAmount).toBe(0);
    expect(summary.totalActualSpent).toBe(405000);
  });

  it('detects over-budget allocations accurately', () => {
    const summary = calculateBudgetSummary(samplePlan, 400000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(60000);
    expect(summary.remainingBudget).toBe(-60000);
  });

  it('enforces hard caps and records variance alerts', () => {
    const summary = calculateBudgetSummary(samplePlan, 500000);
    expect(summary.varianceAlerts.length).toBeGreaterThan(0);
    // cat-2 has targetEstimate 200,000 > capLimit 190,000
    expect(summary.categoryBreakdowns[1].isOverCap).toBe(true);
    // cat-2 actual spent 210,000 > target 200,000 -> variance 10,000
    expect(summary.categoryBreakdowns[1].varianceAmount).toBe(10000);
  });

  it('generates actionable cost-rebalancing suggestions', () => {
    const overBudgetSummary = calculateBudgetSummary(samplePlan, 400000);
    const suggestions = generateCostRebalancingSuggestions(overBudgetSummary, 'INR');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('Deficit Warning');
    expect(suggestions.some((s) => s.includes('Catering'))).toBe(true);
  });

  it('formats various currencies accurately with fallback safety', () => {
    const formattedInr = formatCurrency(2500000, 'INR');
    expect(formattedInr).toContain('25,00,000');

    const formattedUsd = formatCurrency(5000, 'USD');
    expect(formattedUsd).toContain('5,000');

    const formattedUnknown = formatCurrency(1000, 'XYZ');
    expect(formattedUnknown).toBeDefined();
  });
});
