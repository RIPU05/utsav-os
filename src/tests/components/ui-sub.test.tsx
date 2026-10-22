import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PermitRow,
  VolunteerShiftCard,
  BudgetStatCard,
  BudgetStackedBar,
  BudgetCategoryRow,
  BudgetLedgerSummaryRows,
  CapacityMeter,
  MilestoneTaskItem,
  DayOfSlotRow,
  VendorPipelineCard,
  CreativeOutputBox,
  CreativeBaselineCard,
} from '@/components/ui-sub';
import {
  CommunityPermit,
  VolunteerShift,
  TimelineTask,
  DayOfScheduleSlot,
  VendorItem,
} from '@/lib/schemas';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import { calculateCrowdCapacityMetrics } from '@/lib/community-engine';

describe('UI Subcomponents Comprehensive Suite', () => {
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

  it('renders BudgetStatCard with standard and accent states', () => {
    const { rerender } = render(
      <BudgetStatCard
        label="Total Envelope"
        formattedValue="₹25,00,000"
        subtext="Declared envelope"
      />
    );
    expect(screen.getByText('Total Envelope')).toBeInTheDocument();
    expect(screen.getByText('₹25,00,000')).toBeInTheDocument();

    rerender(
      <BudgetStatCard
        label="Actual Spent"
        formattedValue="₹18,00,000"
        isAccent
        subtext="Disbursed"
      />
    );
    expect(screen.getByText('Actual Spent')).toBeInTheDocument();
  });

  it('renders BudgetStackedBar with categories and contingency', () => {
    render(
      <BudgetStackedBar
        categoryBreakdowns={[
          {
            id: 'c1',
            name: 'Venue & Decor',
            targetEstimate: 1000000,
            percentOfBudget: 40,
          },
        ]}
        contingencyPercent={10}
        contingencyAmount={250000}
        taxServiceChargePercent={5}
        taxServiceChargeAmount={125000}
        totalCommitted={1375000}
        totalBudget={2500000}
        currency="INR"
        isOverBudget={false}
      />
    );

    expect(screen.getByText(/Allocation Distribution/i)).toBeInTheDocument();
  });

  it('renders BudgetCategoryRow and fires onUpdateSpent callback', () => {
    const onUpdateSpent = vi.fn();
    render(
      <table>
        <tbody>
          <BudgetCategoryRow
            id="cat-venue"
            name="Venue & Royal Lawns"
            minEstimate={800000}
            targetEstimate={1000000}
            capLimit={1200000}
            actualSpent={950000}
            percentOfBudget={40}
            isOverCap={false}
            notes="Heritage palace lawn with lighting"
            currency="INR"
            onUpdateSpent={onUpdateSpent}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Venue & Royal Lawns')).toBeInTheDocument();
    const input = screen.getByLabelText(/Actual spend for Venue & Royal Lawns/i);
    fireEvent.change(input, { target: { value: '1100000' } });
    expect(onUpdateSpent).toHaveBeenCalledWith('cat-venue', 1100000);
  });

  it('renders BudgetLedgerSummaryRows with totals and remaining budget', () => {
    render(
      <table>
        <tbody>
          <BudgetLedgerSummaryRows
            contingencyPercent={10}
            contingencyAmount={250000}
            taxServiceChargePercent={5}
            taxServiceChargeAmount={125000}
            subtotalMin={2000000}
            totalCommitted={2375000}
            totalActualSpent={1500000}
            totalBudget={2500000}
            remainingBudget={125000}
            isOverBudget={false}
            currency="INR"
          />
        </tbody>
      </table>
    );

    expect(screen.getByText(/Contingency Reserve/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Committed Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining Envelope/i)).toBeInTheDocument();
  });

  it('renders CapacityMeter with safe and warning occupancy levels', () => {
    const safeCapacity = calculateCrowdCapacityMetrics(15000, 300);
    const exceededCapacity = calculateCrowdCapacityMetrics(5000, 2000);

    const { rerender } = render(<CapacityMeter capacityMetrics={safeCapacity} />);

    expect(screen.getByText(/Life Safety Code Venue Assessment/i)).toBeInTheDocument();
    expect(screen.getByText('Safe')).toBeInTheDocument();

    rerender(<CapacityMeter capacityMetrics={exceededCapacity} />);
    expect(screen.getByText('Exceeds Safety Threshold')).toBeInTheDocument();
  });

  it('renders MilestoneTaskItem and toggles completion', () => {
    const mockTask = SAVED_EXAMPLES['royal-wedding'].timeline[0];
    const onToggle = vi.fn();
    render(<MilestoneTaskItem task={mockTask} onToggleComplete={onToggle} />);

    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    const toggleBtn = screen.getByRole('button', {
      name: new RegExp(`Mark task "${mockTask.title}" as`, 'i'),
    });
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledWith(mockTask.id);
  });

  it('renders DayOfSlotRow with timing, activity, and leads', () => {
    const mockSlot = SAVED_EXAMPLES['royal-wedding'].dayOfSchedule[0];

    render(<DayOfSlotRow slot={mockSlot} />);
    expect(screen.getByText(mockSlot.time)).toBeInTheDocument();
    expect(screen.getByText(mockSlot.activityTitle)).toBeInTheDocument();
  });

  it('renders VendorPipelineCard and triggers status update callback', () => {
    const mockVendor = SAVED_EXAMPLES['royal-wedding'].vendors[0];
    const onStatusChange = vi.fn();

    render(
      <VendorPipelineCard vendor={mockVendor} currency="INR" onStatusChange={onStatusChange} />
    );

    expect(screen.getByText(mockVendor.categoryName)).toBeInTheDocument();
    const select = screen.getByLabelText(
      new RegExp(`Update procurement status for ${mockVendor.categoryName}`, 'i')
    );
    fireEvent.change(select, { target: { value: 'Signed' } });
    expect(onStatusChange).toHaveBeenCalledWith(mockVendor.id, 'Signed');
  });

  it('renders CreativeOutputBox and handles copy action and streaming pulse', () => {
    const onCopy = vi.fn();
    const { rerender } = render(
      <CreativeOutputBox
        streamedText="Custom welcome invitation concept"
        isStreaming={false}
        copied={false}
        onCopy={onCopy}
      />
    );

    expect(screen.getByText('Custom welcome invitation concept')).toBeInTheDocument();
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);
    expect(onCopy).toHaveBeenCalled();

    rerender(
      <CreativeOutputBox
        streamedText="Generating theme..."
        isStreaming={true}
        copied={true}
        onCopy={onCopy}
      />
    );
    expect(screen.getByText(/Streaming response.../i)).toBeInTheDocument();
    expect(screen.getByText(/Copied/i)).toBeInTheDocument();
  });

  it('renders CreativeBaselineCard with invitation sample and menu pairings', () => {
    render(
      <CreativeBaselineCard
        invitationSample="Royal welcome to our royal celebration in the heart of Jaipur"
        menuPairings={['Dal Baati Churma', 'Ker Sangri Royal', 'Malpua with Rabdi']}
      />
    );

    expect(screen.getByText(/Royal welcome to our royal celebration/i)).toBeInTheDocument();
    expect(screen.getByText('Dal Baati Churma')).toBeInTheDocument();
    expect(screen.getByText('Ker Sangri Royal')).toBeInTheDocument();
  });
});
