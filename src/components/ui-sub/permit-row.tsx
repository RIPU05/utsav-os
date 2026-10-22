'use client';

import { CommunityPermit, PermitStatus } from '@/lib/schemas';
import { PERMIT_STATUSES } from '@/lib/constants';

/**
 * Props for the PermitRow component.
 */
export interface PermitRowProps {
  /** The municipal permit entity */
  permit: CommunityPermit;
  /** Callback fired when the user selects a new statutory status */
  onStatusChange: (permitId: string, newStatus: PermitStatus) => void;
}

/**
 * Atomic table row rendering statutory details, filing deadline, reference number,
 * and status selector for a single municipal permit.
 *
 * @param {PermitRowProps} props - Component properties.
 * @returns {React.ReactElement} The table row element.
 */
export function PermitRow({ permit, onStatusChange }: PermitRowProps): React.ReactElement {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onStatusChange(permit.id, e.target.value as PermitStatus);
  };

  return (
    <tr className="hover:bg-paper-subtle/40 transition-colors">
      <td className="p-4">
        <span className="font-bold text-ink block">{permit.permitType}</span>
        <span className="text-xs text-ink-muted">{permit.authorityName}</span>
      </td>
      <td className="p-4 font-mono text-ink-muted">{permit.requiredByDaysBefore} days before</td>
      <td className="p-4 font-mono text-ink-faint">{permit.referenceNumber || 'Pending'}</td>
      <td className="p-4">
        <select
          value={permit.status}
          onChange={handleSelectChange}
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
      <td className="p-4 text-xs text-ink-muted max-w-xs leading-relaxed">{permit.notes || '—'}</td>
    </tr>
  );
}
