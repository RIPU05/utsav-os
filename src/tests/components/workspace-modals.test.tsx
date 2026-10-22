import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider, usePlan } from '@/components/plan-context';
import { ReplanModal } from '@/components/workspace/replan-modal';
import { TabCreative } from '@/components/workspace/tab-creative';
import { TabRisks } from '@/components/workspace/tab-risks';
import { TabHistory } from '@/components/workspace/tab-history';
import { SAVED_EXAMPLES } from '@/data/saved-examples';

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
    const menuBtn = screen.getByRole('button', { name: /Menu & Food Pairing/i });
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    const input = screen.getByPlaceholderText(/Optional directives/i);
    fireEvent.change(input, { target: { value: 'Include Rajasthani Ker Sangri' } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    expect(generateBtn).toBeInTheDocument();
  });

  it('renders TabRisks with vulnerability mitigation register', () => {
    renderWithProviders(<TabRisks />);

    expect(screen.getByText(/Proactive Risk Register & Mitigation Engine/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run GenAI Risk Audit/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Dependencies/i)[0]).toBeInTheDocument();
  });

  it('renders TabHistory with version checkpoints and undo capability', () => {
    const HistoryTester = () => {
      const { setActivePlan } = usePlan();
      return (
        <div>
          <button onClick={() => setActivePlan(SAVED_EXAMPLES['community-carnival'])}>
            PushRevision
          </button>
          <TabHistory />
        </div>
      );
    };

    renderWithProviders(<HistoryTester />);

    expect(screen.getByText(/Version History & Reversion Stack/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Current Version/i)).toBeInTheDocument();

    act(() => {
      screen.getByText('PushRevision').click();
    });
  });

  it('renders ReplanModal, allows budget adjustment, and computes diff', async () => {
    // Mock fetch for replan API
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/plan/replan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            summaryOfChanges: 'Rebalanced category allocations to accommodate ₹30,00,000 envelope.',
            why: 'Shifted surplus contingency to core catering and sound production.',
            tradeOffOptions: ['Scale decor florals to seasonal marigolds'],
            affectedBudgetCategories: [],
            affectedTimelineTasks: [],
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

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

    expect(
      screen.getByRole('dialog', { name: /Budget-Aware Rebalancing Engine/i })
    ).toBeInTheDocument();

    const budgetInput = screen.getByLabelText(/Target Budget/i);
    fireEvent.change(budgetInput, { target: { value: '3000000' } });

    const guestInput = screen.getByLabelText(/Guest Count/i);
    fireEvent.change(guestInput, { target: { value: '350' } });

    const computeBtn = screen.getByRole('button', { name: /Compute Rebalanced Diff/i });
    fireEvent.click(computeBtn);
  });
});
