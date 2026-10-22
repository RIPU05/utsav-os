import {
  CommunityPermit,
  VolunteerShift,
  CapacityMetrics,
  PermitStatus,
  VolunteerRole,
} from './schemas';

export interface VolunteerStaffingReport {
  totalRequired: number;
  totalAssigned: number;
  unfilledSlots: number;
  readinessPercent: number;
  criticalDeficits: string[];
}

export interface PermitReadinessReport {
  totalPermits: number;
  approvedCount: number;
  pendingCount: number;
  readinessPercent: number;
  urgentDeadlines: string[];
}

/**
 * Calculates crowd capacity and safety metrics adhering to standard life safety codes.
 */
export function calculateCrowdCapacityMetrics(
  venueAreaSqFt: number,
  plannedGuestCount: number
): CapacityMetrics {
  // NFPA life safety recommendation for unconcentrated assembly: ~15 sq ft per attendee
  const SQFT_PER_ATTENDEE_STANDARD = 15;
  const safeArea = Math.max(0, venueAreaSqFt);
  const guests = Math.max(1, plannedGuestCount);

  const maxSafeOccupancy = safeArea > 0 ? Math.floor(safeArea / SQFT_PER_ATTENDEE_STANDARD) : guests;
  const densitySqFtPerGuest = safeArea > 0 ? Math.round((safeArea / guests) * 10) / 10 : 15;

  let safetyStatus: 'Safe' | 'Nearing Capacity' | 'Exceeds Safety Threshold' = 'Safe';
  const recommendations: string[] = [];

  if (densitySqFtPerGuest < 10 || (safeArea > 0 && guests > maxSafeOccupancy * 1.15)) {
    safetyStatus = 'Exceeds Safety Threshold';
    recommendations.push(
      `CRITICAL OVERCROWDING: Current density (${densitySqFtPerGuest} sq.ft/guest) violates municipal safety limits (min 15 sq.ft).`
    );
    recommendations.push(
      'Enforce staggered time entry slots or secure overflow outdoor lawn space immediately.'
    );
    recommendations.push('Double the number of designated emergency exit paths and station crowd marshals at all gates.');
  } else if (densitySqFtPerGuest < 15 || (safeArea > 0 && guests > maxSafeOccupancy)) {
    safetyStatus = 'Nearing Capacity';
    recommendations.push(
      `High Density Notice: Venue is approaching maximum safe threshold (${densitySqFtPerGuest} sq.ft/guest).`
    );
    recommendations.push('Designate dedicated entry/exit one-way flow lanes to prevent bottlenecking.');
  } else {
    safetyStatus = 'Safe';
    recommendations.push(
      `Optimal Venue Capacity: Generous space allocation (${densitySqFtPerGuest} sq.ft/guest) ensures comfortable movement and accessibility.`
    );
  }

  return {
    venueAreaSqFt: safeArea,
    maxSafeOccupancy,
    plannedGuestCount: guests,
    densitySqFtPerGuest,
    safetyStatus,
    recommendations,
  };
}

/**
 * Evaluates volunteer shift coverage and flags staffing deficits.
 */
export function calculateVolunteerStaffing(shifts: VolunteerShift[]): VolunteerStaffingReport {
  let totalRequired = 0;
  let totalAssigned = 0;
  const criticalDeficits: string[] = [];

  for (const shift of shifts) {
    totalRequired += shift.requiredCount;
    const assigned = shift.assignedVolunteers?.length || 0;
    totalAssigned += assigned;

    if (assigned < shift.requiredCount) {
      const deficit = shift.requiredCount - assigned;
      criticalDeficits.push(
        `Role "${shift.role}" (${shift.shiftTitle}): Needs ${deficit} more volunteer${deficit > 1 ? 's' : ''} (${shift.startTime} - ${shift.endTime}).`
      );
    }
  }

  const unfilledSlots = Math.max(0, totalRequired - totalAssigned);
  const readinessPercent = totalRequired > 0 ? Math.min(100, Math.round((totalAssigned / totalRequired) * 100)) : 100;

  return {
    totalRequired,
    totalAssigned,
    unfilledSlots,
    readinessPercent,
    criticalDeficits,
  };
}

/**
 * Assesses regulatory and municipal permit compliance.
 */
export function calculatePermitReadiness(
  permits: CommunityPermit[],
  eventDate: string
): PermitReadinessReport {
  let approvedCount = 0;
  let pendingCount = 0;
  const urgentDeadlines: string[] = [];

  const today = new Date();
  const eventDateObj = new Date(eventDate);
  const daysUntilEvent = Math.round((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  for (const permit of permits) {
    if (permit.status === 'Approved' || permit.status === 'Exempt') {
      approvedCount++;
    } else {
      pendingCount++;
      if (daysUntilEvent <= permit.requiredByDaysBefore) {
        urgentDeadlines.push(
          `Urgent Permit: "${permit.permitType}" (${permit.authorityName}) must be filed ${permit.requiredByDaysBefore} days before event (${daysUntilEvent} days remaining).`
        );
      }
    }
  }

  const totalPermits = permits.length;
  const readinessPercent = totalPermits > 0 ? Math.round((approvedCount / totalPermits) * 100) : 100;

  return {
    totalPermits,
    approvedCount,
    pendingCount,
    readinessPercent,
    urgentDeadlines,
  };
}

/**
 * Standard preset community permits for high-attendance civic celebrations.
 */
export function getDefaultCommunityPermits(): CommunityPermit[] {
  return [
    {
      id: 'permit-municipal',
      permitType: 'Municipal Venue & Civic Grounds Authorization',
      authorityName: 'City Municipal Corporation / Parks Dept',
      requiredByDaysBefore: 21,
      status: 'Approved',
      referenceNumber: 'MNC-2026-8812',
      feeAmount: 7500,
      notes: 'Authorizes usage of public amphitheater and perimeter lighting.',
    },
    {
      id: 'permit-sound',
      permitType: 'Acoustic Decibel & Public Address License',
      authorityName: 'Local Police Commissionerate & Pollution Control Board',
      requiredByDaysBefore: 14,
      status: 'Application Filed',
      referenceNumber: 'POL-SND-449',
      feeAmount: 3000,
      notes: 'Limits acoustic output to 55 dB(A) past 10:00 PM.',
    },
    {
      id: 'permit-fire',
      permitType: 'Temporary Structure & Fire Safety NOC',
      authorityName: 'State Fire & Rescue Services Department',
      requiredByDaysBefore: 10,
      status: 'In Review',
      referenceNumber: 'FIR-NOC-102',
      feeAmount: 4500,
      notes: 'Requires 4 fire extinguishers on stage and wide clearance egress lanes.',
    },
    {
      id: 'permit-health',
      permitType: 'Food Safety & Hygiene Sanitary Inspection',
      authorityName: 'Food Safety & Standards Authority (Public Health Wing)',
      requiredByDaysBefore: 7,
      status: 'Approved',
      referenceNumber: 'FSSAI-EVENT-99',
      feeAmount: 2000,
      notes: 'Inspection certificate for drinking water tanker and artisan food kiosks.',
    },
  ];
}
