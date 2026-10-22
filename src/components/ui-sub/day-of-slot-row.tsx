'use client';

import React from 'react';
import { DayOfScheduleSlot } from '@/lib/schemas';

/**
 * Props for the DayOfSlotRow component.
 */
export interface DayOfSlotRowProps {
  /** The day-of run-of-show schedule slot */
  slot: DayOfScheduleSlot;
}

/**
 * Atomic component rendering a single chronological cue in the master run-of-show.
 *
 * @param {DayOfSlotRowProps} props - Component properties.
 * @returns {React.ReactElement} The rendered schedule slot row.
 */
export function DayOfSlotRow({ slot }: DayOfSlotRowProps): React.ReactElement {
  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-paper-subtle/30 px-2 rounded-xl transition-colors">
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-center bg-paper-subtle p-2 rounded-xl min-w-[70px]">
          <span className="text-sm font-mono font-black text-ink block">{slot.time}</span>
          <span className="text-[10px] font-mono text-ink-muted">{slot.durationMinutes} min</span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-ink">{slot.activityTitle}</h4>
            {slot.isCritical && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-state-error/15 text-state-error">
                CRITICAL CUE
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Location: <strong className="text-ink">{slot.location}</strong> &bull; Lead:{' '}
            <strong className="text-ink">{slot.leadPerson}</strong>
            {slot.vendorRole && ` (${slot.vendorRole})`}
          </p>
          {slot.notes && (
            <p className="text-[11px] text-ink-faint italic mt-1">Note: {slot.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
