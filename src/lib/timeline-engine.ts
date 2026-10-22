/**
 * @fileoverview Chronological planning and day-of execution engine.
 * Computes calendar date reflows, detects topological dependency violations,
 * identifies simultaneous resource/location bottlenecks, and exports RFC 5545 iCalendar and CSV files.
 */

import { TimelineTask, DayOfScheduleSlot, TimelinePhase } from './schemas';

/**
 * Diagnostic conflict report describing a task ordering error, deadline breach, or congestion.
 */
export interface TimelineConflict {
  /** Unique task identifier */
  taskId: string;
  /** Classification of the conflict */
  type: 'DEPENDENCY_VIOLATION' | 'OVERDUE' | 'CONGESTION';
  /** Urgency level for the user */
  severity: 'warning' | 'error';
  /** Human-readable explanatory alert message */
  message: string;
}

/**
 * Day-of schedule conflict representing resource or space overlap.
 */
export interface DayOfConflict {
  /** Primary schedule slot ID */
  slotAId: string;
  /** Secondary conflicting schedule slot ID */
  slotBId: string;
  /** Conflict type (time/location or personnel contention) */
  type: 'TIME_OVERLAP' | 'RESOURCE_CONTENTION';
  /** Descriptive conflict warning */
  message: string;
}

/**
 * Calculates phase classification based on days until event.
 *
 * @param {number} daysBeforeEvent - Days remaining before celebration.
 * @returns {TimelinePhase} Phase category.
 * @throws {never}
 */
export function calculatePhaseForDays(daysBeforeEvent: number): TimelinePhase {
  if (daysBeforeEvent <= 0) return 'Event day';
  if (daysBeforeEvent <= 7) return 'Event week';
  if (daysBeforeEvent <= 30) return 'Next 30 days';
  if (daysBeforeEvent <= 60) return 'Next 7 days';
  return 'Now';
}

/**
 * Deterministic date reflow shifting all deadlines when the celebration date changes.
 *
 * @param {TimelineTask[]} tasks - Existing array of tasks with relative lead days.
 * @param {string} oldEventDate - Previous ISO or YYYY-MM-DD celebration date.
 * @param {string} newEventDate - Newly chosen celebration date.
 * @returns {{ updatedTasks: TimelineTask[]; notice: string }} Reflowed tasks and human-readable feedback notice.
 * @throws {never} Handles date parsing gracefully.
 */
export function reflowTimelineDates(
  tasks: TimelineTask[],
  oldEventDate: string,
  newEventDate: string
): { updatedTasks: TimelineTask[]; notice: string } {
  const newDateObj = new Date(newEventDate);
  const oldDateObj = new Date(oldEventDate);
  const diffDays = Math.round(
    (newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updatedTasks = tasks.map((task) => {
    const taskDueDate = new Date(newDateObj);
    taskDueDate.setDate(taskDueDate.getDate() - task.daysBeforeEvent);
    const isoDueDate = taskDueDate.toISOString().split('T')[0];

    const newPhase = calculatePhaseForDays(task.daysBeforeEvent);

    return {
      ...task,
      dueDate: isoDueDate,
      phase: newPhase,
    };
  });

  const direction =
    diffDays > 0 ? `delayed by ${diffDays} days` : `brought forward by ${Math.abs(diffDays)} days`;
  const notice = `Event date updated from ${oldEventDate} to ${newEventDate} (${direction}). Reflowed ${updatedTasks.length} task milestones locally.`;

  return { updatedTasks, notice };
}

/**
 * Detects milestone timeline conflicts, dependency violations, and due date congestion.
 *
 * @param {TimelineTask[]} tasks - Milestone tasks to inspect.
 * @returns {TimelineConflict[]} Array of detected scheduling warnings and errors.
 * @throws {never}
 */
export function detectTimelineConflicts(tasks: TimelineTask[]): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  const taskMap = new Map<string, TimelineTask>(tasks.map((t) => [t.id, t]));
  const dateCounts = new Map<string, string[]>();

  const today = new Date().toISOString().split('T')[0];

  for (const task of tasks) {
    // Check overdue
    if (!task.completed && task.dueDate < today) {
      conflicts.push({
        taskId: task.id,
        type: 'OVERDUE',
        severity: 'warning',
        message: `Task "${task.title}" was due on ${task.dueDate} and is currently overdue.`,
      });
    }

    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask && depTask.dueDate > task.dueDate) {
          conflicts.push({
            taskId: task.id,
            type: 'DEPENDENCY_VIOLATION',
            severity: 'error',
            message: `Dependency order conflict: "${task.title}" is due on ${task.dueDate}, before prerequisite "${depTask.title}" (${depTask.dueDate}).`,
          });
        }
      }
    }

    // Track congestion per date
    const existing = dateCounts.get(task.dueDate) || [];
    existing.push(task.title);
    dateCounts.set(task.dueDate, existing);
  }

  // Identify congested dates (>3 tasks due on exact same day)
  for (const [date, taskTitles] of dateCounts.entries()) {
    if (taskTitles.length > 3) {
      for (const task of tasks.filter((t) => t.dueDate === date)) {
        conflicts.push({
          taskId: task.id,
          type: 'CONGESTION',
          severity: 'warning',
          message: `Date congestion on ${date}: ${taskTitles.length} tasks scheduled concurrently.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detects overlapping minute-by-minute schedule slots for the day-of run-of-show.
 *
 * @param {DayOfScheduleSlot[]} slots - Chronological run-of-show cues.
 * @returns {DayOfConflict[]} Array of time or resource contention collisions.
 * @throws {never}
 */
export function detectDayOfScheduleConflicts(slots: DayOfScheduleSlot[]): DayOfConflict[] {
  const conflicts: DayOfConflict[] = [];

  const timeToMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const parsedSlots = slots.map((s) => ({
    ...s,
    startMin: timeToMinutes(s.time),
    endMin: timeToMinutes(s.time) + s.durationMinutes,
  }));

  for (let i = 0; i < parsedSlots.length; i++) {
    for (let j = i + 1; j < parsedSlots.length; j++) {
      const a = parsedSlots[i];
      const b = parsedSlots[j];

      // Check overlap
      const hasOverlap = Math.max(a.startMin, b.startMin) < Math.min(a.endMin, b.endMin);

      if (hasOverlap) {
        if (a.location && b.location && a.location.toLowerCase() === b.location.toLowerCase()) {
          conflicts.push({
            slotAId: a.id,
            slotBId: b.id,
            type: 'TIME_OVERLAP',
            message: `Location contention in "${a.location}": "${a.activityTitle}" (${a.time}) overlaps with "${b.activityTitle}" (${b.time}).`,
          });
        } else if (
          a.leadPerson &&
          b.leadPerson &&
          a.leadPerson.toLowerCase() === b.leadPerson.toLowerCase()
        ) {
          conflicts.push({
            slotAId: a.id,
            slotBId: b.id,
            type: 'RESOURCE_CONTENTION',
            message: `Lead person contention: ${a.leadPerson} assigned simultaneously to "${a.activityTitle}" and "${b.activityTitle}".`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Generates standard RFC 5545 iCalendar (.ics) content for import into Google Calendar or Apple Calendar.
 *
 * @param {string} planTitle - Celebration title.
 * @param {TimelineTask[]} tasks - Milestone tasks to serialize into VEVENT entries.
 * @returns {string} Formatted RFC 5545 calendar string.
 * @throws {never}
 */
export function generateTimelineIcs(planTitle: string, tasks: TimelineTask[]): string {
  const cleanTitle = planTitle.replace(/[\\;,]/g, ' ');
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = tasks.map((task, idx) => {
    const dateFormatted = task.dueDate.replace(/-/g, '');
    const uid = `task-${idx}-${dateFormatted}@utsav.os`;
    const summary = task.title.replace(/[\\;,]/g, ' ');
    const desc = (task.description || '').replace(/[\\;,]/g, ' ');

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateFormatted}`,
      `SUMMARY:[${task.phase}] ${summary}`,
      `DESCRIPTION:${desc}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Utsav OS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${cleanTitle} Milestones`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generates CSV export content for timeline milestones and day-of run-of-show.
 *
 * @param {TimelineTask[]} tasks - Milestone task list.
 * @param {DayOfScheduleSlot[]} [dayOfSlots=[]] - Optional day-of run-of-show slots.
 * @returns {string} Comma-separated values formatted text.
 * @throws {never}
 */
export function exportTimelineToCsv(
  tasks: TimelineTask[],
  dayOfSlots: DayOfScheduleSlot[] = []
): string {
  const headers = [
    'Type',
    'Phase/Time',
    'Title',
    'Description/Location',
    'Due Date/Lead',
    'Status/Critical',
  ];
  const rows: string[][] = [headers];

  for (const t of tasks) {
    rows.push([
      'Milestone Task',
      t.phase,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.dueDate,
      t.completed ? 'Completed' : 'Pending',
    ]);
  }

  for (const s of dayOfSlots) {
    rows.push([
      'Day-of Run of Show',
      s.time,
      `"${s.activityTitle.replace(/"/g, '""')}"`,
      `"${s.location.replace(/"/g, '""')}"`,
      s.leadPerson,
      s.isCritical ? 'CRITICAL' : 'Standard',
    ]);
  }

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Generates structured JSON export payload.
 *
 * @param {TimelineTask[]} tasks - Milestone tasks.
 * @param {DayOfScheduleSlot[]} [dayOfSlots=[]] - Day-of cues.
 * @returns {string} Pretty-printed JSON string.
 * @throws {never}
 */
export function exportTimelineToJson(
  tasks: TimelineTask[],
  dayOfSlots: DayOfScheduleSlot[] = []
): string {
  return JSON.stringify({ milestoneTasks: tasks, dayOfRunOfShow: dayOfSlots }, null, 2);
}
