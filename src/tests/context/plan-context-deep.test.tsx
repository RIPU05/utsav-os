import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PlanProvider, usePlan, WorkspaceTab } from '@/components/plan-context';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import { EventPlan } from '@/lib/schemas';

// Test consumer component
function TestConsumer({ onState }: { onState?: (state: ReturnType<typeof usePlan>) => void }) {
  const planCtx = usePlan();
  if (onState) {
    onState(planCtx);
  }
  return (
    <div>
      <span data-testid="active-tab">{planCtx.activeTab}</span>
      <span data-testid="plan-title">{planCtx.activePlan?.title ?? 'No Plan'}</span>
      <span data-testid="history-count">{planCtx.planHistory.length}</span>
      <button data-testid="set-tab-budget" onClick={() => planCtx.setActiveTab('budget')}>
        Go to Budget
      </button>
      <button data-testid="undo-btn" onClick={() => planCtx.undoLastChange()}>
        Undo
      </button>
      <button data-testid="clear-btn" onClick={() => planCtx.clearPlan()}>
        Clear
      </button>
      <button
        data-testid="load-community-btn"
        onClick={() => planCtx.loadSavedExample('community-carnival')}
      >
        Load Community
      </button>
    </div>
  );
}

describe('PlanContext - Deep Behavioral & State Transition Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Error Boundary & Scope Enforcement', () => {
    it('throws descriptive error when usePlan is accessed outside PlanProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function InvalidConsumer() {
        usePlan();
        return null;
      }

      expect(() => render(<InvalidConsumer />)).toThrow(
        'usePlan must be used within a PlanProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('2. Tab State Transitions', () => {
    it('transitions through all workspace tabs deterministically', () => {
      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      expect(currentCtx.activeTab).toBe('overview');

      const tabs: WorkspaceTab[] = [
        'budget',
        'timeline',
        'vendors',
        'community',
        'creative',
        'risks',
        'history',
        'overview',
      ];

      tabs.forEach((tab) => {
        act(() => {
          currentCtx.setActiveTab(tab);
        });
        expect(currentCtx.activeTab).toBe(tab);
        expect(screen.getByTestId('active-tab').textContent).toBe(tab);
      });
    });

    it('toggles replan modal state via setIsReplanOpen', () => {
      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      expect(currentCtx.isReplanOpen).toBe(false);

      act(() => {
        currentCtx.setIsReplanOpen(true);
      });
      expect(currentCtx.isReplanOpen).toBe(true);

      act(() => {
        currentCtx.setIsReplanOpen(false);
      });
      expect(currentCtx.isReplanOpen).toBe(false);
    });
  });

  describe('3. History Stack Limits & Safe Undo Exhaustion', () => {
    it('handles undoLastChange when history stack is empty without throwing', () => {
      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      expect(currentCtx.planHistory.length).toBe(0);

      expect(() => {
        act(() => {
          currentCtx.undoLastChange();
        });
      }).not.toThrow();

      expect(currentCtx.planHistory.length).toBe(0);
    });

    it('caps history stack at 10 items during high frequency updates', () => {
      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      const basePlan = currentCtx.activePlan!;

      // Perform 15 successive state updates
      for (let i = 1; i <= 15; i++) {
        act(() => {
          const updatedPlan: EventPlan = {
            ...basePlan,
            version: i,
            title: `Plan Revision ${i}`,
          };
          currentCtx.setActivePlan(updatedPlan);
        });
      }

      // History must be capped at 10 items
      expect(currentCtx.planHistory.length).toBe(10);
      expect(currentCtx.activePlan?.version).toBe(15);

      // Perform undo 12 times to exhaust stack
      for (let i = 0; i < 12; i++) {
        act(() => {
          currentCtx.undoLastChange();
        });
      }

      // Should safely exhaust to 0 without errors
      expect(currentCtx.planHistory.length).toBe(0);
      expect(currentCtx.activePlan).toBeDefined();
    });
  });

  describe('4. Plan Payload Hydration & Resilience', () => {
    it('hydrates stored plan and history from localStorage successfully', () => {
      const storedPlan: EventPlan = {
        ...SAVED_EXAMPLES['milestone-birthday'],
        title: 'Hydrated Golden Jubilee',
      };
      const storedHistory = [SAVED_EXAMPLES['royal-wedding']];

      localStorage.setItem('utsav_os_active_plan', JSON.stringify(storedPlan));
      localStorage.setItem('utsav_os_plan_history', JSON.stringify(storedHistory));

      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      expect(currentCtx.activePlan?.title).toBe('Hydrated Golden Jubilee');
      expect(currentCtx.planHistory.length).toBe(1);
    });

    it('recovers gracefully to royal-wedding preset on corrupted localStorage JSON', () => {
      localStorage.setItem('utsav_os_active_plan', '{ malformed_json:::');
      localStorage.setItem('utsav_os_plan_history', 'corrupt-array[');

      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      expect(currentCtx.activePlan).toBeDefined();
      expect(currentCtx.activePlan?.id).toBe(SAVED_EXAMPLES['royal-wedding'].id);
      expect(currentCtx.planHistory).toEqual([]);
    });

    it('supports clearPlan and loadSavedExample triggers', () => {
      let currentCtx!: ReturnType<typeof usePlan>;

      render(
        <PlanProvider>
          <TestConsumer onState={(ctx) => (currentCtx = ctx)} />
        </PlanProvider>
      );

      act(() => {
        currentCtx.loadSavedExample('community-carnival');
      });
      expect(currentCtx.activePlan?.id).toBe(SAVED_EXAMPLES['community-carnival'].id);

      act(() => {
        currentCtx.clearPlan();
      });
      expect(currentCtx.activePlan).toBeNull();
      expect(localStorage.getItem('utsav_os_active_plan')).toBeNull();
    });
  });
});
