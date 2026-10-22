import { describe, it, expect } from 'vitest';
import {
  calculateCrowdCapacityMetrics,
  calculateVolunteerStaffing,
  calculatePermitReadiness,
  getDefaultCommunityPermits,
} from '@/lib/community-engine';
import { VolunteerShift } from '@/lib/schemas';

describe('Community Engine - Capacity, Volunteers & Permits', () => {
  it('evaluates venue crowd capacity and life safety density', () => {
    // 30,000 sq.ft with 1,200 guests -> 25 sq.ft/guest -> Safe
    const safeMetrics = calculateCrowdCapacityMetrics(30000, 1200);
    expect(safeMetrics.densitySqFtPerGuest).toBe(25);
    expect(safeMetrics.safetyStatus).toBe('Safe');
    expect(safeMetrics.maxSafeOccupancy).toBe(2000);

    // 5,000 sq.ft with 1,000 guests -> 5 sq.ft/guest -> Exceeds Safety Threshold
    const unsafeMetrics = calculateCrowdCapacityMetrics(5000, 1000);
    expect(unsafeMetrics.densitySqFtPerGuest).toBe(5);
    expect(unsafeMetrics.safetyStatus).toBe('Exceeds Safety Threshold');
    expect(unsafeMetrics.recommendations.some((r) => r.includes('CRITICAL OVERCROWDING'))).toBe(true);
  });

  it('calculates volunteer coverage and identifies shift deficits', () => {
    const shifts: VolunteerShift[] = [
      {
        id: 'shift-1',
        role: 'Logistics & Setup',
        shiftTitle: 'Morning Setup',
        requiredCount: 5,
        assignedVolunteers: ['Alex', 'Sam'], // 3 missing
        startTime: '08:00',
        endTime: '12:00',
        notes: '',
      },
      {
        id: 'shift-2',
        role: 'Guest Check-In & Badging',
        shiftTitle: 'Check-In Desk',
        requiredCount: 3,
        assignedVolunteers: ['Pooja', 'Maya', 'John'], // fully staffed
        startTime: '10:00',
        endTime: '14:00',
        notes: '',
      },
    ];

    const report = calculateVolunteerStaffing(shifts);
    expect(report.totalRequired).toBe(8);
    expect(report.totalAssigned).toBe(5);
    expect(report.unfilledSlots).toBe(3);
    expect(report.readinessPercent).toBe(63);
    expect(report.criticalDeficits.length).toBe(1);
    expect(report.criticalDeficits[0]).toContain('Needs 3 more volunteers');
  });

  it('evaluates permit readiness and flags urgent upcoming deadlines', () => {
    const permits = getDefaultCommunityPermits();
    // 4 standard permits, 2 approved initially
    const report = calculatePermitReadiness(permits, '2026-11-01');

    expect(report.totalPermits).toBe(4);
    expect(report.approvedCount).toBeGreaterThan(0);
    expect(report.readinessPercent).toBeGreaterThan(0);
  });
});
