'use client';

import React, { useState, useMemo } from 'react';
import { usePlan } from '../plan-context';
import { TIMELINE_PHASES } from '@/lib/constants';
import {
  detectTimelineConflicts,
  detectDayOfScheduleConflicts,
  generateTimelineIcs,
  exportTimelineToCsv,
  exportTimelineToJson,
} from '@/lib/timeline-engine';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Circle,
  User,
  Tag,
  Info,
  Clock,
  AlertTriangle,
  Download,
  ListOrdered,
  FileSpreadsheet,
} from 'lucide-react';

export function TabTimeline() {
  const {
    activePlan,
    toggleTaskCompletion,
    updateEventDate,
    dateReflowNotice,
    announce,
  } = usePlan();

  const [viewMode, setViewMode] = useState<'milestones' | 'dayOf'>('milestones');
  const [newEventDateInput, setNewEventDateInput] = useState(activePlan?.date || '');

  const timelineConflicts = useMemo(() => {
    if (!activePlan) return [];
    return detectTimelineConflicts(activePlan.timeline);
  }, [activePlan]);

  const dayOfConflicts = useMemo(() => {
    if (!activePlan || !activePlan.dayOfSchedule) return [];
    return detectDayOfScheduleConflicts(activePlan.dayOfSchedule);
  }, [activePlan]);

  if (!activePlan) return null;

  const handleDateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDateInput || newEventDateInput === activePlan.date) return;
    updateEventDate(newEventDateInput);
  };

  const handleExportIcs = () => {
    const icsContent = generateTimelineIcs(activePlan.title, activePlan.timeline);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.title.toLowerCase().replace(/\s+/g, '-')}-timeline.ics`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Exported .ics calendar file.');
  };

  const handleExportCsv = () => {
    const csvContent = exportTimelineToCsv(activePlan.timeline, activePlan.dayOfSchedule);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.title.toLowerCase().replace(/\s+/g, '-')}-timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Exported CSV schedule.');
  };

  return (
    <div className="space-y-6">
      {/* View Switcher & Date Reflow Control Header */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <h2 className="font-serif font-black text-xl text-ink">
              Interactive Timeline &amp; Day-of Scheduler
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Dual view: long-term milestone planning and minute-by-minute day-of schedules with automated collision detection.
            </p>
          </div>

          {/* Toggle Dual Views */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-rule bg-paper p-1">
              <button
                type="button"
                onClick={() => setViewMode('milestones')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  viewMode === 'milestones'
                    ? 'bg-accent text-accent-text shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Milestones ({activePlan.timeline.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dayOf')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  viewMode === 'dayOf'
                    ? 'bg-accent text-accent-text shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Day-of Schedule ({activePlan.dayOfSchedule.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              title="Export schedule to CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rule bg-paper hover:bg-paper-subtle text-ink text-xs font-semibold min-h-[44px]"
            >
              <FileSpreadsheet className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportIcs}
              title="Export to .ics calendar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rule bg-paper hover:bg-paper-subtle text-ink text-xs font-semibold min-h-[44px]"
            >
              <CalendarCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>.ics</span>
            </button>
          </div>
        </div>

        {/* Date Reflow Controls */}
        <form onSubmit={handleDateShift} className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="new-event-date" className="text-xs font-semibold text-ink">
            Celebration Date:
          </label>
          <input
            id="new-event-date"
            type="date"
            value={newEventDateInput}
            onChange={(e) => setNewEventDateInput(e.target.value)}
            className="min-h-[44px] rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs sm:text-sm text-ink focus:border-accent"
          />
          <button
            type="submit"
            disabled={!newEventDateInput || newEventDateInput === activePlan.date}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            Recalculate Deadlines Locally
          </button>
        </form>

        {dateReflowNotice && (
          <div className="mt-4 p-3 rounded-xl bg-accent-subtle/70 border border-accent/30 text-xs text-accent flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>Date Reflow Notice:</strong> {dateReflowNotice}
            </div>
          </div>
        )}
      </div>

      {/* Collision & Conflict Warning Banner */}
      {(timelineConflicts.length > 0 || dayOfConflicts.length > 0) && (
        <div className="rounded-2xl border border-state-warning bg-state-warning-subtle p-5 text-state-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-sm">
                Schedule Conflict &amp; Bottleneck Warnings
              </h3>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                {timelineConflicts.map((c, i) => (
                  <li key={`tc-${i}`}>{c.message}</li>
                ))}
                {dayOfConflicts.map((c, i) => (
                  <li key={`dc-${i}`}>{c.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: Long-term Milestone Tasks */}
      {viewMode === 'milestones' && (
        <div className="space-y-6">
          {TIMELINE_PHASES.map((phase) => {
            const tasksInPhase = activePlan.timeline.filter((t) => t.phase === phase);
            if (tasksInPhase.length === 0) return null;

            return (
              <section key={phase} aria-labelledby={`phase-title-${phase}`}>
                <div className="sticky top-0 z-10 py-2.5 bg-paper/95 backdrop-blur-xs flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-accent ring-4 ring-accent-subtle" />
                  <h3 id={`phase-title-${phase}`} className="font-serif font-black text-lg text-ink">
                    {phase}
                  </h3>
                  <span className="text-xs font-mono text-ink-muted">
                    ({tasksInPhase.length} item{tasksInPhase.length === 1 ? '' : 's'})
                  </span>
                  <div className="flex-1 h-px bg-rule" />
                </div>

                <div className="ml-1.5 pl-6 border-l-2 border-rule space-y-3 mt-3">
                  {tasksInPhase.map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        task.completed
                          ? 'border-rule/60 bg-paper-subtle/30 opacity-75'
                          : 'border-rule bg-paper-card shadow-xs hover:border-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskCompletion(task.id)}
                            aria-label={`Mark task "${task.title}" as ${
                              task.completed ? 'pending' : 'complete'
                            }`}
                            className="mt-0.5 rounded-full p-1 text-accent hover:bg-accent-subtle transition-colors focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-state-success" aria-hidden="true" />
                            ) : (
                              <Circle className="h-5 w-5 text-ink-faint hover:text-accent" aria-hidden="true" />
                            )}
                          </button>
                          <div>
                            <h4
                              className={`text-sm font-bold text-ink ${
                                task.completed ? 'line-through text-ink-muted' : ''
                              }`}
                            >
                              {task.title}
                            </h4>
                            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                              {task.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-ink">
                            <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                            {task.dueDate}
                          </span>
                          {task.owner && (
                            <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-muted">
                              <User className="h-3 w-3" aria-hidden="true" />
                              {task.owner}
                            </span>
                          )}
                          {task.estimatedCostLink && (
                            <span className="mt-1 flex items-center justify-end gap-1 text-[10px] font-mono text-ink-faint">
                              <Tag className="h-3 w-3" aria-hidden="true" />
                              {task.estimatedCostLink}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Minute-by-Minute Day-of Run-of-Show */}
      {viewMode === 'dayOf' && (
        <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-black text-lg text-ink">
                Day-of Minute-by-Minute Run of Show
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Precise event timetable with location cues and responsible leads.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-accent-subtle text-accent">
              {activePlan.dayOfSchedule.length} Master Cues
            </span>
          </div>

          <div className="divide-y divide-rule">
            {activePlan.dayOfSchedule.map((slot) => (
              <div
                key={slot.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-paper-subtle/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 text-center bg-paper-subtle p-2 rounded-xl min-w-[70px]">
                    <span className="text-sm font-mono font-black text-ink block">
                      {slot.time}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {slot.durationMinutes} min
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-ink">
                        {slot.activityTitle}
                      </h4>
                      {slot.isCritical && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-state-error/15 text-state-error">
                          CRITICAL CUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Location: <strong className="text-ink">{slot.location}</strong> &bull; Lead:{' '}
                      <strong className="text-ink">{slot.leadPerson}</strong>
                      {slot.vendorRole && ` (${slot.vendorRole})`}
                    </p>
                    {slot.notes && (
                      <p className="text-[11px] text-ink-faint italic mt-1">
                        Note: {slot.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
