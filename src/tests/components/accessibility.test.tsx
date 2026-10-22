import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import HomePage from '@/app/page';
import WorkspacePage from '@/app/workspace/page';
import SavedPage from '@/app/saved/page';
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';
import NotFound from '@/app/not-found';
import { ThemeToggle } from '@/components/theme-toggle';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}));

describe('WCAG 2.1 AA Accessibility Verification with jest-axe', () => {
  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement, isDark = false) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return render(
      <ThemeProvider>
        <PlanProvider>{ui}</PlanProvider>
      </ThemeProvider>
    );
  };

  it('Home / Intake Page has zero accessibility violations in Light theme', async () => {
    const { container } = renderWithProviders(<HomePage />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Home / Intake Page has zero accessibility violations in Dark theme', async () => {
    const { container } = renderWithProviders(<HomePage />, true);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Workspace Page has zero accessibility violations in Light theme', async () => {
    const { container } = renderWithProviders(<WorkspacePage />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Workspace Page has zero accessibility violations in Dark theme', async () => {
    const { container } = renderWithProviders(<WorkspacePage />, true);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Saved Presets Library has zero accessibility violations', async () => {
    const { container } = renderWithProviders(<SavedPage />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Privacy Policy has zero accessibility violations', async () => {
    const { container } = renderWithProviders(<PrivacyPage />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Terms of Service has zero accessibility violations', async () => {
    const { container } = renderWithProviders(<TermsPage />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('404 Not Found screen has zero accessibility violations', async () => {
    const { container } = renderWithProviders(<NotFound />, false);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ThemeToggle button has zero accessibility violations and accessible labels', async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
