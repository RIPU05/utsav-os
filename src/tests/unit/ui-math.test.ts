import { describe, it, expect } from 'vitest';
import {
  calculateCommitmentPercent,
  calculateCategoryProgressPercent,
  calculateShiftDeficit,
  calculateStaffingFillRatio,
  clampPercentage,
} from '@/lib/ui-math';

describe('ui-math utility functions', () => {
  describe('calculateCommitmentPercent', () => {
    it('calculates the correct percentage for valid budget numbers', () => {
      expect(calculateCommitmentPercent(350000, 500000)).toBe(70);
      expect(calculateCommitmentPercent(500000, 500000)).toBe(100);
      expect(calculateCommitmentPercent(600000, 500000)).toBe(120);
    });

    it('handles zero or negative or non-finite inputs safely', () => {
      expect(calculateCommitmentPercent(1000, 0)).toBe(0);
      expect(calculateCommitmentPercent(1000, -500)).toBe(0);
      expect(calculateCommitmentPercent(0, 500000)).toBe(0);
      expect(calculateCommitmentPercent(-100, 500000)).toBe(0);
      expect(calculateCommitmentPercent(NaN, 500000)).toBe(0);
      expect(calculateCommitmentPercent(500000, NaN)).toBe(0);
      expect(calculateCommitmentPercent(Infinity, 500000)).toBe(0);
    });
  });

  describe('calculateCategoryProgressPercent', () => {
    it('calculates progress percentage clamped between 0 and 100', () => {
      expect(calculateCategoryProgressPercent(45000, 50000)).toBe(90);
      expect(calculateCategoryProgressPercent(50000, 50000)).toBe(100);
      expect(calculateCategoryProgressPercent(80000, 50000)).toBe(100);
      expect(calculateCategoryProgressPercent(0, 50000)).toBe(0);
    });

    it('returns 0 for zero, negative, or non-finite caps', () => {
      expect(calculateCategoryProgressPercent(5000, 0)).toBe(0);
      expect(calculateCategoryProgressPercent(5000, -100)).toBe(0);
      expect(calculateCategoryProgressPercent(-500, 50000)).toBe(0);
      expect(calculateCategoryProgressPercent(NaN, 50000)).toBe(0);
      expect(calculateCategoryProgressPercent(5000, NaN)).toBe(0);
    });
  });

  describe('calculateShiftDeficit', () => {
    it('calculates unfilled volunteer slots correctly', () => {
      expect(calculateShiftDeficit(8, 5)).toBe(3);
      expect(calculateShiftDeficit(6, 6)).toBe(0);
      expect(calculateShiftDeficit(4, 7)).toBe(0);
    });

    it('handles zero or negative parameters safely', () => {
      expect(calculateShiftDeficit(0, 2)).toBe(0);
      expect(calculateShiftDeficit(5, 0)).toBe(5);
      expect(calculateShiftDeficit(-3, 0)).toBe(0);
      expect(calculateShiftDeficit(5, -2)).toBe(5);
    });
  });

  describe('calculateStaffingFillRatio', () => {
    it('calculates roster completion percentage correctly', () => {
      expect(calculateStaffingFillRatio(10, 5)).toBe(50);
      expect(calculateStaffingFillRatio(10, 10)).toBe(100);
      expect(calculateStaffingFillRatio(10, 15)).toBe(100);
      expect(calculateStaffingFillRatio(10, 0)).toBe(0);
    });

    it('returns 100 if requiredCount is zero or negative', () => {
      expect(calculateStaffingFillRatio(0, 0)).toBe(100);
      expect(calculateStaffingFillRatio(-5, 0)).toBe(100);
      expect(calculateStaffingFillRatio(NaN, 2)).toBe(100);
    });
  });

  describe('clampPercentage', () => {
    it('clamps numbers within given bounds', () => {
      expect(clampPercentage(55, 0, 100)).toBe(55);
      expect(clampPercentage(-10, 0, 100)).toBe(0);
      expect(clampPercentage(150, 0, 100)).toBe(100);
      expect(clampPercentage(25, 20, 80)).toBe(25);
      expect(clampPercentage(10, 20, 80)).toBe(20);
      expect(clampPercentage(90, 20, 80)).toBe(80);
    });

    it('handles non-finite input by returning min', () => {
      expect(clampPercentage(NaN, 0, 100)).toBe(0);
      expect(clampPercentage(Infinity, 0, 100)).toBe(0);
      expect(clampPercentage(-Infinity, 0, 100)).toBe(0);
    });

    it('throws RangeError when min > max', () => {
      expect(() => clampPercentage(50, 80, 20)).toThrow(RangeError);
    });
  });
});
