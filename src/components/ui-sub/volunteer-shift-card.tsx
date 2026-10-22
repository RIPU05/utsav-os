'use client';

import React from 'react';
import { VolunteerShift } from '@/lib/schemas';
import { calculateShiftDeficit } from '@/lib/ui-math';
import { UserPlus } from 'lucide-react';

/**
 * Props for the VolunteerShiftCard component.
 */
export interface VolunteerShiftCardProps {
  /** The volunteer operational shift entity */
  shift: VolunteerShift;
  /** Current pending volunteer input text for this shift */
  inputValue: string;
  /** Callback fired as user types in the volunteer name input */
  onInputChange: (shiftId: string, value: string) => void;
  /** Callback fired when user submits a new volunteer assignment */
  onAssign: (shiftId: string) => void;
}

/**
 * Atomic card rendering a single volunteer shift, assigned roster badges,
 * deficit warnings, and name input.
 *
 * @param {VolunteerShiftCardProps} props - Component properties.
 * @returns {React.ReactElement} The rendered volunteer shift card.
 */
export function VolunteerShiftCard({
  shift,
  inputValue,
  onInputChange,
  onAssign,
}: VolunteerShiftCardProps): React.ReactElement {
  const deficit = calculateShiftDeficit(shift.requiredCount, shift.assignedVolunteers.length);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAssign(shift.id);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-rule bg-paper-subtle/30 flex flex-col justify-between">
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
            ({shift.assignedVolunteers.length} / {shift.requiredCount} required
            {deficit > 0 ? ` · ${deficit} needed` : ' · Fully staffed'})
          </span>
        </div>
      </div>

      {/* Add Volunteer Input */}
      <div className="flex items-center gap-2 pt-3 border-t border-rule">
        <input
          type="text"
          placeholder="Volunteer name..."
          value={inputValue}
          onChange={(e) => onInputChange(shift.id, e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[40px] px-3 py-1 text-xs rounded-lg border border-rule bg-paper text-ink focus:border-accent"
          aria-label={`Add volunteer for ${shift.shiftTitle}`}
        />
        <button
          type="button"
          onClick={() => onAssign(shift.id)}
          className="min-h-[40px] px-3 py-1 rounded-lg bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1 shrink-0"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Assign</span>
        </button>
      </div>
    </div>
  );
}
