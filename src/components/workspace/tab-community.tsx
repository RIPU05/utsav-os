'use client';

import React, { useState } from 'react';
import { usePlan } from '../plan-context';
import {
  calculatePermitReadiness,
  calculateVolunteerStaffing,
  calculateCrowdCapacityMetrics,
  getDefaultCommunityPermits,
} from '@/lib/community-engine';
import { PERMIT_STATUSES, PermitStatus, VOLUNTEER_ROLES } from '@/lib/constants';
import {
  ShieldCheck,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  Scale,
  Sparkles,
} from 'lucide-react';

export function TabCommunity() {
  const {
    activePlan,
    updatePermitStatus,
    assignVolunteer,
    setActivePlan,
    announce,
  } = usePlan();

  const [newVolunteerName, setNewVolunteerName] = useState<{ [shiftId: string]: string }>({});

  if (!activePlan) return null;

  const isCommunity = activePlan.eventType === 'Community Event';

  // If user opened this tab for a Wedding or Birthday, provide option to initialize community modules
  const handleEnableCommunityModules = () => {
    const permits = getDefaultCommunityPermits();
    const volunteerShifts = [
      {
        id: 'vol-gen-1',
        role: 'Hospitality & F&B Assist' as const,
        shiftTitle: 'Guest Welcoming & Dietary Concierge',
        requiredCount: 4,
        assignedVolunteers: [],
        startTime: '15:00',
        endTime: '20:00',
        notes: 'Help guide elderly guests and oversee allergen labeling at food stalls.',
      },
      {
        id: 'vol-gen-2',
        role: 'Logistics & Setup' as const,
        shiftTitle: 'Perimeter Setup & Vendor Assistance',
        requiredCount: 4,
        assignedVolunteers: [],
        startTime: '10:00',
        endTime: '15:00',
        notes: 'Assist decorators with stage load-in and clear walkway paths.',
      },
    ];

    setActivePlan({
      ...activePlan,
      permits,
      volunteerShifts,
      updatedAt: new Date().toISOString(),
    });
    announce('Community permits and volunteer coordination modules enabled.');
  };

  const permitReport = calculatePermitReadiness(activePlan.permits, activePlan.date);
  const volunteerReport = calculateVolunteerStaffing(activePlan.volunteerShifts);
  const capacityMetrics = calculateCrowdCapacityMetrics(
    activePlan.venueAreaSqFt || (isCommunity ? 30000 : 10000),
    activePlan.guestCount
  );

  const handleAddVolunteer = (shiftId: string) => {
    const name = (newVolunteerName[shiftId] || '').trim();
    if (!name) return;
    assignVolunteer(shiftId, name);
    setNewVolunteerName((prev) => ({ ...prev, [shiftId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-6 w-6 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-serif font-black text-xl text-ink">
                Community Event Coordination &amp; Regulatory Compliance
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                Dedicated civic and crowd workflow: municipal ground permits, acoustic sound licenses, volunteer staffing rosters, and life safety crowd density tracking.
              </p>
            </div>
          </div>

          {!isCommunity && activePlan.permits.length === 0 && (
            <button
              type="button"
              onClick={handleEnableCommunityModules}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors shrink-0 min-h-[44px]"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Enable Permits &amp; Volunteers</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Permit Progress */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-ink-muted mb-1">
            <span>Permit Compliance</span>
            <ShieldCheck className="h-4 w-4 text-state-success" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {permitReport.readinessPercent}%
          </div>
          <span className="text-xs text-ink-faint mt-1 block">
            {permitReport.approvedCount} of {permitReport.totalPermits} approved
          </span>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-state-success"
              style={{ width: `${permitReport.readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Volunteer Coverage */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-ink-muted mb-1">
            <span>Volunteer Staffing</span>
            <Users className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {volunteerReport.readinessPercent}%
          </div>
          <span className="text-xs text-ink-faint mt-1 block">
            {volunteerReport.totalAssigned} of {volunteerReport.totalRequired} slots filled
          </span>
          <div className="mt-2 h-1.5 w-full bg-paper-subtle rounded-full overflow-hidden">
            <div
              className={`h-full ${volunteerReport.unfilledSlots > 0 ? 'bg-state-warning' : 'bg-state-success'}`}
              style={{ width: `${volunteerReport.readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Crowd Density & Safety */}
        <div className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-ink-muted mb-1">
            <span>Crowd Safety Status</span>
            <Scale className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {capacityMetrics.densitySqFtPerGuest} sq.ft/guest
          </div>
          <span
            className={`text-xs font-bold mt-1 block ${
              capacityMetrics.safetyStatus === 'Safe'
                ? 'text-state-success'
                : capacityMetrics.safetyStatus === 'Nearing Capacity'
                ? 'text-state-warning'
                : 'text-state-error'
            }`}
          >
            {capacityMetrics.safetyStatus}
          </span>
        </div>
      </div>

      {/* Urgent Permit Deadlines or Volunteer Deficit Alerts */}
      {(permitReport.urgentDeadlines.length > 0 || volunteerReport.criticalDeficits.length > 0) && (
        <div className="rounded-2xl border border-state-warning bg-state-warning-subtle p-5 text-state-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-sm">Action Items &amp; Deficit Alerts</h3>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                {permitReport.urgentDeadlines.map((d, i) => (
                  <li key={`d-${i}`}>{d}</li>
                ))}
                {volunteerReport.criticalDeficits.map((def, i) => (
                  <li key={`def-${i}`}>{def}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Municipal & Safety Permits */}
      <div className="rounded-2xl border border-rule bg-paper-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-rule">
          <h3 className="font-serif font-black text-lg text-ink">
            Municipal &amp; Regulatory Permit Checklists
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Filing deadlines, reference license tracking, and statutory approval statuses.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-paper-subtle/70 text-ink-muted uppercase font-mono text-[11px] border-b border-rule">
              <tr>
                <th scope="col" className="p-4">Permit Title &amp; Authority</th>
                <th scope="col" className="p-4">Due (Days Before)</th>
                <th scope="col" className="p-4">Reference No.</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4">Scope &amp; Compliance Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-ink">
              {activePlan.permits.map((permit) => (
                <tr key={permit.id} className="hover:bg-paper-subtle/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-ink block">{permit.permitType}</span>
                    <span className="text-xs text-ink-muted">{permit.authorityName}</span>
                  </td>
                  <td className="p-4 font-mono text-ink-muted">
                    {permit.requiredByDaysBefore} days before
                  </td>
                  <td className="p-4 font-mono text-ink-faint">
                    {permit.referenceNumber || 'Pending'}
                  </td>
                  <td className="p-4">
                    <select
                      value={permit.status}
                      onChange={(e) =>
                        updatePermitStatus(permit.id, e.target.value as PermitStatus)
                      }
                      aria-label={`Update status for ${permit.permitType}`}
                      className="min-h-[40px] rounded-lg border border-rule bg-paper px-2.5 py-1 text-xs font-bold text-ink focus:border-accent"
                    >
                      {PERMIT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-xs text-ink-muted max-w-xs leading-relaxed">
                    {permit.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Volunteer Shift Coordination */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-black text-lg text-ink">
              Volunteer Team Rosters &amp; Shifts
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Role assignment, required volunteer headcounts, and active marshals.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-accent-subtle text-accent">
            {volunteerReport.totalAssigned} / {volunteerReport.totalRequired} Volunteers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlan.volunteerShifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-xl border border-rule bg-paper-subtle/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-ink">{shift.shiftTitle}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-card border border-rule text-ink-muted">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
                <span className="text-xs font-mono text-accent font-semibold block mb-2">
                  Role: {shift.role}
                </span>

                <div className="text-xs text-ink-muted mb-3">
                  <span className="font-medium text-ink">Assigned: </span>
                  {shift.assignedVolunteers.length > 0 ? (
                    <span>{shift.assignedVolunteers.join(', ')}</span>
                  ) : (
                    <span className="text-state-warning italic">No volunteers assigned yet</span>
                  )}
                  <span className="font-mono text-ink-faint block mt-0.5">
                    ({shift.assignedVolunteers.length} / {shift.requiredCount} required)
                  </span>
                </div>
              </div>

              {/* Add Volunteer Input */}
              <div className="flex items-center gap-2 pt-3 border-t border-rule">
                <input
                  type="text"
                  placeholder="Volunteer name..."
                  value={newVolunteerName[shift.id] || ''}
                  onChange={(e) =>
                    setNewVolunteerName((prev) => ({
                      ...prev,
                      [shift.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVolunteer(shift.id);
                    }
                  }}
                  className="flex-1 min-h-[40px] px-3 py-1 text-xs rounded-lg border border-rule bg-paper text-ink focus:border-accent"
                  aria-label={`Add volunteer for ${shift.shiftTitle}`}
                />
                <button
                  type="button"
                  onClick={() => handleAddVolunteer(shift.id)}
                  className="min-h-[40px] px-3 py-1 rounded-lg bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Assign</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Crowd Capacity & Safety Recommendations */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="font-serif font-black text-lg text-ink">
            Life Safety Code Venue Assessment
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
          <div className="p-3 rounded-xl bg-paper-subtle/50">
            <span className="text-ink-muted block">Usable Venue Area:</span>
            <span className="font-mono font-bold text-ink text-sm">
              {capacityMetrics.venueAreaSqFt.toLocaleString()} sq.ft
            </span>
          </div>
          <div className="p-3 rounded-xl bg-paper-subtle/50">
            <span className="text-ink-muted block">Planned Guests:</span>
            <span className="font-mono font-bold text-ink text-sm">
              {capacityMetrics.plannedGuestCount.toLocaleString()} attendees
            </span>
          </div>
          <div className="p-3 rounded-xl bg-paper-subtle/50">
            <span className="text-ink-muted block">Max Safe Occupancy:</span>
            <span className="font-mono font-bold text-ink text-sm">
              {capacityMetrics.maxSafeOccupancy.toLocaleString()} attendees
            </span>
          </div>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-xs text-ink-muted leading-relaxed">
          {capacityMetrics.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
