'use client';

import React from 'react';
import { usePlan, WorkspaceTab } from '../plan-context';
import { formatCurrency } from '@/lib/budget-engine';
import { exportTimelineToCsv, exportTimelineToJson, generateTimelineIcs } from '@/lib/timeline-engine';
import {
  Calendar,
  Users,
  MapPin,
  SlidersHorizontal,
  Download,
  Printer,
  Undo2,
  Sparkles,
  ShieldAlert,
  FileCheck2,
  Clock,
  Layers,
  History,
  Coins,
} from 'lucide-react';

interface TabConfig {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function WorkspaceHeader() {
  const {
    activePlan,
    activeTab,
    setActiveTab,
    setIsReplanOpen,
    planHistory,
    undoLastChange,
    announce,
  } = usePlan();

  if (!activePlan) return null;

  const handleExportIcs = () => {
    const ics = generateTimelineIcs(activePlan.title, activePlan.timeline);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Calendar exported as .ics');
  };

  const handleExportCsv = () => {
    const csv = exportTimelineToCsv(activePlan.timeline, activePlan.dayOfSchedule);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.title.toLowerCase().replace(/\s+/g, '-')}-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Timeline exported as .csv');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(activePlan, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.title.toLowerCase().replace(/\s+/g, '-')}-full-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Plan exported as .json');
  };

  const TABS: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'budget', label: 'Budget Engine', icon: Coins },
    { id: 'timeline', label: 'Timeline & Run-of-Show', icon: Clock },
    { id: 'vendors', label: 'Vendor Pipeline', icon: FileCheck2 },
    {
      id: 'community',
      label: 'Community & Permits',
      icon: Users,
      badge: activePlan.eventType === 'Community Event' ? 'Active' : undefined,
    },
    { id: 'creative', label: 'Creative AI Assistant', icon: Sparkles },
    { id: 'risks', label: 'Risk Register', icon: ShieldAlert },
    {
      id: 'history',
      label: 'Versions',
      icon: History,
      badge: planHistory.length > 0 ? String(planHistory.length) : undefined,
    },
  ];

  return (
    <header className="border-b border-rule bg-paper-card px-4 sm:px-8 pt-6 pb-2">
      {/* Top bar with metadata & actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-accent-subtle text-accent border border-accent/20">
              {activePlan.eventType}
            </span>
            <span className="text-xs font-mono text-ink-faint">
              v{activePlan.version}
            </span>
            {activePlan.isSavedExample && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-paper-subtle text-ink-muted">
                Preset Model
              </span>
            )}
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-ink tracking-tight">
            {activePlan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {activePlan.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {activePlan.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {activePlan.guestCount.toLocaleString()} Guests
            </span>
            <span className="font-mono font-bold text-accent">
              {formatCurrency(activePlan.totalBudget, activePlan.currency)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {planHistory.length > 0 && (
            <button
              type="button"
              onClick={undoLastChange}
              title="Undo last change"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper hover:bg-paper-subtle text-ink text-xs font-semibold transition-colors"
            >
              <Undo2 className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Undo</span>
            </button>
          )}

          {/* Export Dropdown Group */}
          <div className="flex items-center gap-1 rounded-xl border border-rule bg-paper p-1">
            <button
              type="button"
              onClick={handleExportIcs}
              title="Export RFC 5545 iCalendar"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-paper-subtle transition-colors min-h-[36px]"
            >
              .ics
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export Schedule as CSV"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-paper-subtle transition-colors min-h-[36px]"
            >
              .csv
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              title="Export Full Plan as JSON"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-paper-subtle transition-colors min-h-[36px]"
            >
              .json
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Ledger Report"
              className="p-2 rounded-lg text-ink hover:bg-paper-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Print ledger"
            >
              <Printer className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsReplanOpen(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Rebalance Budget</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        role="tablist"
        aria-label="Workspace Sections"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 -mb-px"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveTab(tab.id);
                announce(`Switched to tab ${tab.label}`);
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
                isSelected
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-rule'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-accent/15 text-accent">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
