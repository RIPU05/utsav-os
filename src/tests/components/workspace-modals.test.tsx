import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import { ReplanModal } from '@/components/workspace/replan-modal';
import { TabCreative } from '@/components/workspace/tab-creative';
import { TabRisks } from '@/components/workspace/tab-risks';
import { TabHistory } from '@/components/workspace/tab-history';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/workspace',
}));

describe('Workspace Sub-Components & Modals', () => {
  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <ThemeProvider>
        <PlanProvider>{ui}</PlanProvider>
      </ThemeProvider>
    );

  it('renders TabCreative with mode selectors and streaming assistant', () => {
    renderWithProviders(<TabCreative />);

    expect(screen.getByText(/Streaming Creative Synthesis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Invitations & RSVP/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Menu & Food Pairing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('renders TabRisks with vulnerability mitigation register', () => {
    renderWithProviders(<TabRisks />);

    expect(screen.getByText(/Proactive Risk Register & Mitigation Engine/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run GenAI Risk Audit/i })).toBeInTheDocument();
  });

  it('renders TabHistory with version checkpoints', () => {
    renderWithProviders(<TabHistory />);

    expect(screen.getByText(/Version History & Reversion Stack/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Current Version/i)).toBeInTheDocument();
  });

  it('renders ReplanModal when opened via plan context', async () => {
    const { usePlan } = await import('@/components/plan-context');
    const { fireEvent } = await import('@testing-library/react');

    const ModalTester = () => {
      const { setIsReplanOpen } = usePlan();
      return (
        <div>
          <button onClick={() => setIsReplanOpen(true)}>Trigger Replan</button>
          <ReplanModal />
        </div>
      );
    };

    renderWithProviders(<ModalTester />);
    const triggerBtn = screen.getByRole('button', { name: /Trigger Replan/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByRole('dialog', { name: /Budget-Aware Rebalancing Engine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compute Rebalanced Diff/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Budget/i)).toBeInTheDocument();
  });
});
