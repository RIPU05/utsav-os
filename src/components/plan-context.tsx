'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EventPlan, VendorStatus, PermitStatus, VolunteerRole } from '@/lib/schemas';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import { reflowTimelineDates } from '@/lib/timeline-engine';

export type WorkspaceTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'community'
  | 'creative'
  | 'risks'
  | 'history';

interface PlanContextType {
  activePlan: EventPlan | null;
  setActivePlan: (plan: EventPlan) => void;
  planHistory: EventPlan[];
  undoLastChange: () => void;
  updateEventDate: (newDate: string) => void;
  dateReflowNotice: string | null;
  toggleTaskCompletion: (taskId: string) => void;
  updateVendorStatus: (vendorId: string, status: VendorStatus, quoteAmount?: number) => void;
  updatePermitStatus: (permitId: string, status: PermitStatus) => void;
  assignVolunteer: (shiftId: string, volunteerName: string) => void;
  updateCategorySpent: (categoryId: string, spent: number) => void;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  isReplanOpen: boolean;
  setIsReplanOpen: (open: boolean) => void;
  loadSavedExample: (exampleKey: string) => void;
  clearPlan: () => void;
  liveAnnouncement: string;
  announce: (message: string) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'utsav_os_active_plan';
const HISTORY_STORAGE_KEY = 'utsav_os_plan_history';

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [activePlan, setActivePlanState] = useState<EventPlan | null>(null);
  const [planHistory, setPlanHistory] = useState<EventPlan[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isReplanOpen, setIsReplanOpen] = useState(false);
  const [dateReflowNotice, setDateReflowNotice] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const announce = useCallback((msg: string) => {
    setLiveAnnouncement(msg);
  }, []);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivePlanState(parsed);
      } else {
        // Default to preset Indian Wedding for instant zero-friction preview
        setActivePlanState(SAVED_EXAMPLES['royal-wedding']);
      }

      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setPlanHistory(JSON.parse(storedHistory));
      }
    } catch {
      setActivePlanState(SAVED_EXAMPLES['royal-wedding']);
    }
  }, []);

  // Sync to localStorage
  const setActivePlan = useCallback(
    (newPlan: EventPlan, addToHistory = true) => {
      setActivePlanState((prev) => {
        if (prev && addToHistory && prev.id === newPlan.id) {
          setPlanHistory((h) => {
            const updated = [prev, ...h.slice(0, 9)];
            try {
              localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPlan));
        } catch {}
        return newPlan;
      });
    },
    []
  );

  const undoLastChange = useCallback(() => {
    if (planHistory.length === 0) return;
    const previous = planHistory[0];
    setPlanHistory((h) => {
      const next = h.slice(1);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setActivePlanState(previous);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(previous));
    } catch {}
    announce(`Restored plan to previous version.`);
  }, [planHistory, announce]);

  const updateEventDate = useCallback(
    (newDate: string) => {
      if (!activePlan) return;
      const { updatedTasks, notice } = reflowTimelineDates(
        activePlan.timeline,
        activePlan.date,
        newDate
      );
      const updatedPlan: EventPlan = {
        ...activePlan,
        date: newDate,
        timeline: updatedTasks,
        updatedAt: new Date().toISOString(),
        version: activePlan.version + 1,
      };
      setDateReflowNotice(notice);
      setActivePlan(updatedPlan);
      announce(notice);
    },
    [activePlan, setActivePlan, announce]
  );

  const toggleTaskCompletion = useCallback(
    (taskId: string) => {
      if (!activePlan) return;
      const updatedTimeline = activePlan.timeline.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const target = updatedTimeline.find((t) => t.id === taskId);
      const updatedPlan: EventPlan = {
        ...activePlan,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };
      setActivePlan(updatedPlan, false);
      if (target) {
        announce(`Task "${target.title}" marked as ${target.completed ? 'completed' : 'pending'}.`);
      }
    },
    [activePlan, setActivePlan, announce]
  );

  const updateVendorStatus = useCallback(
    (vendorId: string, status: VendorStatus, quoteAmount?: number) => {
      if (!activePlan) return;
      const updatedVendors = activePlan.vendors.map((v) => {
        if (v.id === vendorId) {
          return {
            ...v,
            status,
            quoteAmount: quoteAmount !== undefined ? quoteAmount : v.quoteAmount,
            contractedAmount:
              status === 'Signed' || status === 'Paid'
                ? quoteAmount ?? v.contractedAmount ?? v.quoteAmount
                : v.contractedAmount,
          };
        }
        return v;
      });
      const updatedPlan: EventPlan = {
        ...activePlan,
        vendors: updatedVendors,
        updatedAt: new Date().toISOString(),
      };
      setActivePlan(updatedPlan, false);
      announce(`Vendor procurement status updated to ${status}.`);
    },
    [activePlan, setActivePlan, announce]
  );

  const updatePermitStatus = useCallback(
    (permitId: string, status: PermitStatus) => {
      if (!activePlan) return;
      const updatedPermits = activePlan.permits.map((p) =>
        p.id === permitId ? { ...p, status } : p
      );
      const updatedPlan: EventPlan = {
        ...activePlan,
        permits: updatedPermits,
        updatedAt: new Date().toISOString(),
      };
      setActivePlan(updatedPlan, false);
      announce(`Regulatory permit status updated to ${status}.`);
    },
    [activePlan, setActivePlan, announce]
  );

  const assignVolunteer = useCallback(
    (shiftId: string, volunteerName: string) => {
      if (!activePlan || !volunteerName.trim()) return;
      const updatedShifts = activePlan.volunteerShifts.map((s) => {
        if (s.id === shiftId) {
          const current = s.assignedVolunteers || [];
          if (!current.includes(volunteerName.trim())) {
            return {
              ...s,
              assignedVolunteers: [...current, volunteerName.trim()],
            };
          }
        }
        return s;
      });
      const updatedPlan: EventPlan = {
        ...activePlan,
        volunteerShifts: updatedShifts,
        updatedAt: new Date().toISOString(),
      };
      setActivePlan(updatedPlan, false);
      announce(`Volunteer ${volunteerName} assigned successfully.`);
    },
    [activePlan, setActivePlan, announce]
  );

  const updateCategorySpent = useCallback(
    (categoryId: string, spent: number) => {
      if (!activePlan) return;
      const updatedCategories = activePlan.budget.categories.map((c) =>
        c.id === categoryId ? { ...c, actualSpent: spent } : c
      );
      const updatedPlan: EventPlan = {
        ...activePlan,
        budget: {
          ...activePlan.budget,
          categories: updatedCategories,
        },
        updatedAt: new Date().toISOString(),
      };
      setActivePlan(updatedPlan, false);
    },
    [activePlan, setActivePlan]
  );

  const loadSavedExample = useCallback(
    (exampleKey: string) => {
      const example = SAVED_EXAMPLES[exampleKey];
      if (example) {
        setActivePlan(example);
        setDateReflowNotice(null);
        announce(`Loaded preset: ${example.title}.`);
      }
    },
    [setActivePlan, announce]
  );

  const clearPlan = useCallback(() => {
    setActivePlanState(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
    announce('Plan cleared.');
  }, [announce]);

  return (
    <PlanContext.Provider
      value={{
        activePlan,
        setActivePlan,
        planHistory,
        undoLastChange,
        updateEventDate,
        dateReflowNotice,
        toggleTaskCompletion,
        updateVendorStatus,
        updatePermitStatus,
        assignVolunteer,
        updateCategorySpent,
        activeTab,
        setActiveTab,
        isReplanOpen,
        setIsReplanOpen,
        loadSavedExample,
        clearPlan,
        liveAnnouncement,
        announce,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
