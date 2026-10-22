/**
 * @fileoverview Stateless pure mathematical and formatting utilities for UI components.
 * Guarantees zero side-effects, deterministic floating-point clamping, and robust error resilience.
 * @module lib/ui-math
 */

/**
 * Calculates the overall budget commitment percentage.
 *
 * @param {number} totalCommitted - Total amount committed across categories, contingency, and taxes.
 * @param {number} totalBudget - Total declared budget envelope.
 * @returns {number} Rounded percentage (0 to 100+).
 * @example
 * ```ts
 * calculateCommitmentPercent(350000, 500000); // 70
 * ```
 */
export function calculateCommitmentPercent(totalCommitted: number, totalBudget: number): number {
  if (totalBudget <= 0 || !Number.isFinite(totalBudget)) return 0;
  if (!Number.isFinite(totalCommitted) || totalCommitted <= 0) return 0;
  return Math.round((totalCommitted / totalBudget) * 100);
}

/**
 * Calculates the spend progress percentage of a specific category against its target or cap limit.
 *
 * @param {number} actualSpent - Current verified expenditure for the category.
 * @param {number} targetOrCap - Target estimate or hard cap limit.
 * @returns {number} Clamped percentage from 0 to 100.
 * @example
 * ```ts
 * calculateCategoryProgressPercent(45000, 50000); // 90
 * ```
 */
export function calculateCategoryProgressPercent(actualSpent: number, targetOrCap: number): number {
  if (targetOrCap <= 0 || !Number.isFinite(targetOrCap)) return 0;
  if (!Number.isFinite(actualSpent) || actualSpent <= 0) return 0;
  const ratio = (actualSpent / targetOrCap) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/**
 * Computes the remaining volunteer staffing deficit for a specific operational shift.
 *
 * @param {number} requiredCount - Total personnel required for life safety / logistics.
 * @param {number} assignedCount - Current roster headcount assigned to this shift.
 * @returns {number} Positive integer count of missing volunteers (0 if fully staffed or surplus).
 * @example
 * ```ts
 * calculateShiftDeficit(8, 5); // 3
 * ```
 */
export function calculateShiftDeficit(requiredCount: number, assignedCount: number): number {
  const req = Math.max(0, Math.floor(requiredCount || 0));
  const assigned = Math.max(0, Math.floor(assignedCount || 0));
  return Math.max(0, req - assigned);
}

/**
 * Computes the volunteer shift fill ratio percentage.
 *
 * @param {number} requiredCount - Required volunteer headcount.
 * @param {number} assignedCount - Currently assigned volunteer headcount.
 * @returns {number} Percentage from 0 to 100 representing roster completion.
 */
export function calculateStaffingFillRatio(requiredCount: number, assignedCount: number): number {
  if (requiredCount <= 0 || !Number.isFinite(requiredCount)) return 100;
  const assigned = Math.max(0, Number.isFinite(assignedCount) ? assignedCount : 0);
  const ratio = (assigned / requiredCount) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/**
 * Clamps an arbitrary numerical value between an inclusive minimum and maximum boundary.
 *
 * @param {number} value - The input number to clamp.
 * @param {number} [min=0] - Lower bound.
 * @param {number} [max=100] - Upper bound.
 * @returns {number} Clamped value guaranteed to satisfy min <= result <= max.
 * @throws {RangeError} If min is greater than max.
 */
export function clampPercentage(value: number, min = 0, max = 100): number {
  if (min > max) {
    throw new RangeError(`clampPercentage: min (${min}) cannot exceed max (${max})`);
  }
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
