import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { TabBudget } from '@/components/workspace/tab-budget';
import { TabTimeline } from '@/components/workspace/tab-timeline';
import { TabVendors } from '@/components/workspace/tab-vendors';
import { TabCommunity } from '@/components/workspace/tab-community';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/workspace',
}));

describe('Workspace Tab Components Flow', () => {
  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <ThemeProvider>
        <PlanProvider>{ui}</PlanProvider>
      </ThemeProvider>
    );

  it('renders WorkspaceHeader with tabs, badges, and export actions', () => {
    renderWithProviders(<WorkspaceHeader />);

    expect(screen.getByRole('tab', { name: /Budget Engine/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Timeline & Run-of-Show/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Vendor Pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rebalance Budget/i })).toBeInTheDocument();
  });

  it('renders TabBudget with ledger breakdowns and stacked allocation bar', () => {
    renderWithProviders(<TabBudget />);

    expect(screen.getByText(/Detailed Ledger Breakdown/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Category allocation distribution bar/i })).toBeInTheDocument();
    expect(screen.getByText(/Total Committed Budget/i)).toBeInTheDocument();
  });

  it('toggles between Milestones and Day-of Run-of-Show in TabTimeline', () => {
    renderWithProviders(<TabTimeline />);

    expect(screen.getByRole('button', { name: /Milestones/i })).toBeInTheDocument();
    const dayOfBtn = screen.getByRole('button', { name: /Day-of Schedule/i });
    expect(dayOfBtn).toBeInTheDocument();

    fireEvent.click(dayOfBtn);
    expect(screen.getByText(/Day-of Minute-by-Minute Run of Show/i)).toBeInTheDocument();
  });

  it('renders TabVendors with 4-stage procurement pipeline filters', () => {
    renderWithProviders(<TabVendors />);

    expect(screen.getByText(/Vendor Screening & Contract Procurement Protocol/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Lead/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Quoted/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Signed/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Paid/i })[0]).toBeInTheDocument();
  });

  it('renders TabCommunity with permits, volunteer rosters, and crowd safety', () => {
    renderWithProviders(<TabCommunity />);

    expect(screen.getByText(/Community Event Coordination & Regulatory Compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Life Safety Code Venue Assessment/i)).toBeInTheDocument();
  });
});
