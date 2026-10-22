import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import { IntakeForm } from '@/components/intake-form';
import { SAVED_EXAMPLES } from '@/data/saved-examples';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/',
}));

describe('IntakeForm Component Flow', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider>
        <PlanProvider>
          <IntakeForm />
        </PlanProvider>
      </ThemeProvider>
    );

  it('renders heading, preset buttons, and primary fields', () => {
    renderComponent();

    expect(screen.getByText(/Plan Your Next Celebration, Perfectly/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Celebration Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Guest Count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Budget/i)).toBeInTheDocument();
  });

  it('populates form fields when a preset button is clicked', () => {
    renderComponent();

    const weddingPreset = screen.getByText(/Heritage Palace Wedding/i);
    fireEvent.click(weddingPreset);

    const cityInput = screen.getByLabelText(/City \/ Location/i) as HTMLInputElement;
    expect(cityInput.value).toBe('Jaipur');
  });

  it('validates required fields before submitting', async () => {
    renderComponent();

    const cityInput = screen.getByLabelText(/City \/ Location/i);
    fireEvent.change(cityInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Generate Autonomous Plan/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/City name must be at least 2 characters/i)).toBeInTheDocument();
  });

  it('allows updating non-negotiables and style culture fields', () => {
    renderComponent();

    const nonNegInput = screen.getByLabelText(/Non-Negotiable Priorities/i);
    fireEvent.change(nonNegInput, { target: { value: 'Strict Jain catering only' } });
    expect((nonNegInput as HTMLTextAreaElement).value).toBe('Strict Jain catering only');
  });

  it('handles follow-up question modal flow and navigates to workspace', async () => {
    // Mock global.fetch for followup and generate
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/plan/followup')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            needsFollowUp: true,
            questionId: 'q1',
            questionText: 'Will alcohol be served at the venue?',
            reason: 'Determines excise liquor permit requirement.',
          }),
        });
      }
      if (url.includes('/api/plan/generate')) {
        return Promise.resolve({
          ok: true,
          json: async () => SAVED_EXAMPLES['royal-wedding'],
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    renderComponent();

    // Fill valid form
    const weddingPreset = screen.getByText(/Heritage Palace Wedding/i);
    fireEvent.click(weddingPreset);

    const submitBtn = screen.getByRole('button', { name: /Generate Autonomous Plan/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Should render clarification modal
    expect(await screen.findByText(/Clarification Required/i)).toBeInTheDocument();

    const answerInput = screen.getByLabelText(/Clarification answer/i);
    fireEvent.change(answerInput, { target: { value: 'No alcohol will be served.' } });

    const confirmBtn = screen.getByRole('button', { name: /Submit & Generate/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workspace');
    });
  });
});
