import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

function CrashingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test intentional rendering failure');
  }
  return <div>Healthy Content</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <CrashingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Content')).toBeInTheDocument();
  });

  it('renders accessible fallback UI when an uncaught error occurs in children', () => {
    // Suppress console.error in test output for intentional throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong rendering this view')).toBeInTheDocument();
    expect(screen.getByText('Test intentional rendering failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders custom fallback element when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom Error View</div>}>
        <CrashingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error View')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
