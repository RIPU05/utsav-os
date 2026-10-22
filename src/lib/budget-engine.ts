import { BudgetPlan, BudgetCategory } from './schemas';
import { SUPPORTED_CURRENCIES, CurrencyCode, DEFAULT_CURRENCY } from './constants';

export interface CategoryBreakdown {
  id: string;
  name: string;
  targetEstimate: number;
  minEstimate: number;
  maxEstimate: number;
  capLimit?: number;
  actualSpent: number;
  percentOfBudget: number;
  percentOfSubtotal: number;
  isOverCap: boolean;
  varianceAmount: number; // actualSpent - targetEstimate
}

export interface BudgetSummary {
  totalBudget: number;
  subtotalTarget: number;
  subtotalMin: number;
  subtotalMax: number;
  contingencyPercent: number;
  contingencyAmount: number;
  taxServiceChargePercent: number;
  taxServiceChargeAmount: number;
  totalCommitted: number;
  totalActualSpent: number;
  remainingBudget: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  categoryBreakdowns: CategoryBreakdown[];
  varianceAlerts: string[];
}

/**
 * Deterministic budget calculation engine. Zero LLM arithmetic hallucinations.
 */
export function calculateBudgetSummary(
  budget: BudgetPlan,
  totalBudget: number
): BudgetSummary {
  const safeTotalBudget = Math.max(0, totalBudget);
  const categories = budget?.categories || [];

  const subtotalTarget = categories.reduce((sum, cat) => sum + (cat.targetEstimate || 0), 0);
  const subtotalMin = categories.reduce((sum, cat) => sum + (cat.minEstimate || 0), 0);
  const subtotalMax = categories.reduce((sum, cat) => sum + (cat.maxEstimate || 0), 0);

  const contingencyPercent = Math.min(30, Math.max(0, budget.contingencyPercent ?? 10));
  const taxServiceChargePercent = Math.min(30, Math.max(0, budget.taxServiceChargePercent ?? 5));

  const contingencyAmount = Math.round((subtotalTarget * contingencyPercent) / 100);
  const taxServiceChargeAmount = Math.round((subtotalTarget * taxServiceChargePercent) / 100);

  const totalCommitted = subtotalTarget + contingencyAmount + taxServiceChargeAmount;
  const remainingBudget = safeTotalBudget - totalCommitted;
  const isOverBudget = remainingBudget < 0;
  const overBudgetAmount = isOverBudget ? Math.abs(remainingBudget) : 0;

  const totalActualSpent = categories.reduce((sum, cat) => sum + (cat.actualSpent || 0), 0);

  const varianceAlerts: string[] = [];

  const categoryBreakdowns: CategoryBreakdown[] = categories.map((cat) => {
    const target = cat.targetEstimate || 0;
    const spent = cat.actualSpent || 0;
    const cap = cat.capLimit;

    const percentOfBudget =
      safeTotalBudget > 0 ? Math.round((target / safeTotalBudget) * 1000) / 10 : 0;
    const percentOfSubtotal =
      subtotalTarget > 0 ? Math.round((target / subtotalTarget) * 1000) / 10 : 0;

    const isOverCap = Boolean(cap !== undefined && cap > 0 && target > cap);
    const varianceAmount = spent > 0 ? spent - target : 0;

    if (isOverCap && cap !== undefined) {
      varianceAlerts.push(
        `Category "${cat.name}" target (${target}) exceeds hard cap of ${cap}.`
      );
    }
    if (varianceAmount > 0) {
      varianceAlerts.push(
        `Category "${cat.name}" actual expenditure exceeds target estimate by ${varianceAmount}.`
      );
    }

    return {
      id: cat.id,
      name: cat.name,
      targetEstimate: target,
      minEstimate: cat.minEstimate || 0,
      maxEstimate: cat.maxEstimate || 0,
      capLimit: cap,
      actualSpent: spent,
      percentOfBudget,
      percentOfSubtotal,
      isOverCap,
      varianceAmount,
    };
  });

  return {
    totalBudget: safeTotalBudget,
    subtotalTarget,
    subtotalMin,
    subtotalMax,
    contingencyPercent,
    contingencyAmount,
    taxServiceChargePercent,
    taxServiceChargeAmount,
    totalCommitted,
    totalActualSpent,
    remainingBudget,
    isOverBudget,
    overBudgetAmount,
    categoryBreakdowns,
    varianceAlerts,
  };
}

/**
 * Generates algorithmic rebalancing suggestions when budget is exceeded or imbalanced.
 */
export function generateCostRebalancingSuggestions(
  summary: BudgetSummary,
  currency: string = DEFAULT_CURRENCY
): string[] {
  const suggestions: string[] = [];

  if (summary.isOverBudget) {
    suggestions.push(
      `Deficit Warning: Total commitments exceed available budget by ${formatCurrency(summary.overBudgetAmount, currency)}. Consider reducing non-core categories by ${Math.ceil((summary.overBudgetAmount / summary.subtotalTarget) * 100)}%.`
    );

    // Identify highest target categories
    const sorted = [...summary.categoryBreakdowns].sort(
      (a, b) => b.targetEstimate - a.targetEstimate
    );
    if (sorted[0]) {
      const topCat = sorted[0];
      const trim5 = Math.round(topCat.targetEstimate * 0.08);
      suggestions.push(
        `Trim "${topCat.name}" (largest allocation at ${topCat.percentOfBudget}%) by ~${formatCurrency(trim5, currency)} by negotiating package bundles.`
      );
    }
    if (sorted[1]) {
      const secondCat = sorted[1];
      const trim5 = Math.round(secondCat.targetEstimate * 0.06);
      suggestions.push(
        `Review "${secondCat.name}" (allocating ${secondCat.percentOfBudget}%) for phased vendor milestones to save ~${formatCurrency(trim5, currency)}.`
      );
    }
  } else if (summary.remainingBudget > summary.totalBudget * 0.15) {
    suggestions.push(
      `Budget Surplus: You have ${formatCurrency(summary.remainingBudget, currency)} unallocated reserve. Consider upgrading guest favors, entertainment, or increasing contingency buffer.`
    );
  } else {
    suggestions.push(
      `Balanced Ledger: Your allocations represent a healthy distribution with a ${summary.contingencyPercent}% contingency cushion.`
    );
  }

  return suggestions;
}

/**
 * Culture and locale-aware currency formatter with fallback safety.
 */
export function formatCurrency(amount: number, currencyCode?: string): string {
  const validCode = (currencyCode || DEFAULT_CURRENCY).toUpperCase() as CurrencyCode;
  const config = SUPPORTED_CURRENCIES[validCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${config.symbol} ${amount.toLocaleString()}`;
  }
}
