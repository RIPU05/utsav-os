import { TimelineTask, DayOfScheduleSlot, TimelinePhase } from './schemas';

export interface TimelineConflict {
  taskId: string;
  type: 'DEPENDENCY_VIOLATION' | 'OVERDUE' | 'CONGESTION';
  severity: 'warning' | 'error';
  message: string;
}

export interface DayOfConflict {
  slotAId: string;
  slotBId: string;
  type: 'TIME_OVERLAP' | 'RESOURCE_CONTENTION';
  message: string;
}

/**
 * Calculates phase classification based on days until event.
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
 */
export function reflowTimelineDates(
  tasks: TimelineTask[],
  oldEventDate: string,
  newEventDate: string
): { updatedTasks: TimelineTask[]; notice: string } {
  const newDateObj = new Date(newEventDate);
  const oldDateObj = new Date(oldEventDate);
  const diffDays = Math.round((newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updatedTasks = tasks.map((task) => {
    const taskDueDate = new Date(newDateObj);
    taskDueDate.setDate(taskDueDate.getDate() - task.daysBeforeEvent);
    const isoDueDate = taskDueDate.toISOString().split('T')[0];

    const daysFromNow = Math.round(
      (newDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newPhase = calculatePhaseForDays(task.daysBeforeEvent);

    return {
      ...task,
      dueDate: isoDueDate,
      phase: newPhase,
    };
  });

  const direction = diffDays > 0 ? `delayed by ${diffDays} days` : `brought forward by ${Math.abs(diffDays)} days`;
  const notice = `Event date updated from ${oldEventDate} to ${newEventDate} (${direction}). Reflowed ${updatedTasks.length} task milestones locally.`;

  return { updatedTasks, notice };
}

/**
 * Detects milestone timeline conflicts, dependency violations, and due date congestion.
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
 */
export function detectDayOfScheduleConflicts(slots: DayOfScheduleSlot[]): DayOfConflict[] {
  const conflicts: DayOfConflict[] = [];

  const timeToMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
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
        } else if (a.leadPerson && b.leadPerson && a.leadPerson.toLowerCase() === b.leadPerson.toLowerCase()) {
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
 * Generates standard RFC 5545 iCalendar content.
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
 * Generates CSV export content for timeline and day-of run-of-show.
 */
export function exportTimelineToCsv(tasks: TimelineTask[], dayOfSlots: DayOfScheduleSlot[] = []): string {
  const headers = ['Type', 'Phase/Time', 'Title', 'Description/Location', 'Due Date/Lead', 'Status/Critical'];
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
 * Generates formatted JSON export.
 */
export function exportTimelineToJson(tasks: TimelineTask[], dayOfSlots: DayOfScheduleSlot[] = []): string {
  return JSON.stringify({ milestoneTasks: tasks, dayOfRunOfShow: dayOfSlots }, null, 2);
}
