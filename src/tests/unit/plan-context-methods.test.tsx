import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PlanProvider, usePlan } from '@/components/plan-context';
import { SAVED_EXAMPLES } from '@/data/saved-examples';

function TestConsumer() {
  const {
    activePlan,
    setActivePlan,
    updateEventDate,
    toggleTaskCompletion,
    updateVendorStatus,
    updatePermitStatus,
    assignVolunteer,
    updateCategorySpent,
    undoLastChange,
    clearPlan,
    announce,
    liveAnnouncement,
    dateReflowNotice,
    loadSavedExample,
    activeTab,
    setActiveTab,
    isReplanOpen,
    setIsReplanOpen,
  } = usePlan();

  return (
    <div>
      <div data-testid="title">{activePlan?.title}</div>
      <div data-testid="date">{activePlan?.date}</div>
      <div data-testid="announcement">{liveAnnouncement}</div>
      <div data-testid="notice">{dateReflowNotice}</div>
      <div data-testid="activeTab">{activeTab}</div>
      <div data-testid="isReplanOpen">{isReplanOpen ? 'open' : 'closed'}</div>

      <button
        onClick={() => {
          setActivePlan(SAVED_EXAMPLES['community-carnival']);
        }}
      >
        SetCommunityPlan
      </button>

      <button
        onClick={() => {
          updateEventDate('2026-12-25');
        }}
      >
        ShiftDate
      </button>

      <button
        onClick={() => {
          if (activePlan?.timeline[0]) {
            toggleTaskCompletion(activePlan.timeline[0].id);
          }
        }}
      >
        ToggleTask
      </button>

      <button
        onClick={() => {
          if (activePlan?.vendors[0]) {
            updateVendorStatus(activePlan.vendors[0].id, 'Paid', 600000);
          }
        }}
      >
        UpdateVendor
      </button>

      <button
        onClick={() => {
          if (activePlan?.permits[0]) {
            updatePermitStatus(activePlan.permits[0].id, 'Approved');
          }
        }}
      >
        UpdatePermit
      </button>

      <button
        onClick={() => {
          if (activePlan?.volunteerShifts[0]) {
            assignVolunteer(activePlan.volunteerShifts[0].id, 'Priya K');
          }
        }}
      >
        AssignVolunteer
      </button>

      <button
        onClick={() => {
          if (activePlan?.budget.categories[0]) {
            updateCategorySpent(activePlan.budget.categories[0].id, 120000);
          }
        }}
      >
        UpdateSpent
      </button>

      <button onClick={() => loadSavedExample('milestone-birthday')}>LoadBirthdayPreset</button>
      <button onClick={() => setActiveTab('budget')}>SetTabBudget</button>
      <button onClick={() => setIsReplanOpen(true)}>OpenReplan</button>
      <button onClick={undoLastChange}>Undo</button>
      <button onClick={clearPlan}>Clear</button>
      <button onClick={() => announce('Manual notification')}>Announce</button>
    </div>
  );
}

function OutsideHookConsumer() {
  usePlan();
  return <div>Outside</div>;
}

describe('PlanContext State Reducers & Actions', () => {
  it('exercises all mutation reducers, presets, and state updaters', () => {
    render(
      <PlanProvider>
        <TestConsumer />
      </PlanProvider>
    );

    expect(screen.getByTestId('title')).toBeInTheDocument();

    act(() => {
      screen.getByText('SetCommunityPlan').click();
    });
    expect(screen.getByTestId('title').textContent).toContain('Bengaluru Civic Green Festival');

    act(() => {
      screen.getByText('ShiftDate').click();
    });
    expect(screen.getByTestId('date').textContent).toBe('2026-12-25');

    act(() => {
      screen.getByText('ToggleTask').click();
    });

    act(() => {
      screen.getByText('UpdateVendor').click();
    });

    act(() => {
      screen.getByText('UpdatePermit').click();
    });

    act(() => {
      screen.getByText('AssignVolunteer').click();
    });

    act(() => {
      screen.getByText('UpdateSpent').click();
    });

    act(() => {
      screen.getByText('LoadBirthdayPreset').click();
    });
    expect(screen.getByTestId('title').textContent).toContain('Speakeasy');

    act(() => {
      screen.getByText('SetTabBudget').click();
    });
    expect(screen.getByTestId('activeTab').textContent).toBe('budget');

    act(() => {
      screen.getByText('OpenReplan').click();
    });
    expect(screen.getByTestId('isReplanOpen').textContent).toBe('open');

    act(() => {
      screen.getByText('Undo').click();
    });

    act(() => {
      screen.getByText('Announce').click();
    });
    expect(screen.getByTestId('announcement').textContent).toBe('Manual notification');

    act(() => {
      screen.getByText('Clear').click();
    });
    expect(screen.getByTestId('title').textContent).toBe('');
  });

  it('throws an error when usePlan is called outside of PlanProvider', () => {
    expect(() => render(<OutsideHookConsumer />)).toThrow(
      'usePlan must be used within a PlanProvider'
    );
  });
});
