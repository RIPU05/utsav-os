import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermitRow, VolunteerShiftCard } from '@/components/ui-sub';
import { CommunityPermit, VolunteerShift } from '@/lib/schemas';

describe('UI Subcomponents (PermitRow & VolunteerShiftCard)', () => {
  it('renders PermitRow and fires status change callback', () => {
    const mockPermit: CommunityPermit = {
      id: 'permit-test-1',
      permitType: 'Acoustic Sound License',
      authorityName: 'City Noise Pollution Board',
      requiredByDaysBefore: 14,
      status: 'In Review',
      referenceNumber: 'SND-992',
      feeAmount: 3000,
      notes: 'Ensure dB limiter is active',
    };

    const onStatusChange = vi.fn();

    render(
      <table>
        <tbody>
          <PermitRow permit={mockPermit} onStatusChange={onStatusChange} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Acoustic Sound License')).toBeInTheDocument();
    expect(screen.getByText('City Noise Pollution Board')).toBeInTheDocument();
    expect(screen.getByText('SND-992')).toBeInTheDocument();

    const select = screen.getByLabelText(/Update status for Acoustic Sound License/i);
    fireEvent.change(select, { target: { value: 'Approved' } });

    expect(onStatusChange).toHaveBeenCalledWith('permit-test-1', 'Approved');
  });

  it('renders VolunteerShiftCard and handles input change and assignment submit', () => {
    const mockShift: VolunteerShift = {
      id: 'shift-test-1',
      role: 'Logistics & Setup',
      shiftTitle: 'Perimeter Barricade Setup',
      requiredCount: 4,
      assignedVolunteers: ['Aarav Sharma'],
      startTime: '09:00',
      endTime: '13:00',
      notes: 'Ensure emergency gates remain unlocked',
    };

    const onInputChange = vi.fn();
    const onAssign = vi.fn();

    render(
      <VolunteerShiftCard
        shift={mockShift}
        inputValue="Priya Patel"
        onInputChange={onInputChange}
        onAssign={onAssign}
      />
    );

    expect(screen.getByText('Perimeter Barricade Setup')).toBeInTheDocument();
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText(/3 needed/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Volunteer name.../i);
    fireEvent.change(input, { target: { value: 'Priya' } });
    expect(onInputChange).toHaveBeenCalledWith('shift-test-1', 'Priya');

    const assignBtn = screen.getByRole('button', { name: /assign/i });
    fireEvent.click(assignBtn);
    expect(onAssign).toHaveBeenCalledWith('shift-test-1');
  });
});
