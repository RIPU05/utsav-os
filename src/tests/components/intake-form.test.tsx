import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import { IntakeForm } from '@/components/intake-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}));

describe('IntakeForm Component Flow', () => {
  afterEach(() => {
    cleanup();
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
});
