import { describe, it, expect } from 'vitest';
import {
  calculatePhaseForDays,
  reflowTimelineDates,
  detectTimelineConflicts,
  detectDayOfScheduleConflicts,
  generateTimelineIcs,
  exportTimelineToCsv,
  exportTimelineToJson,
} from '@/lib/timeline-engine';
import { TimelineTask, DayOfScheduleSlot } from '@/lib/schemas';

describe('Timeline Engine - Milestones & Conflict Detection', () => {
  const sampleTasks: TimelineTask[] = [
    {
      id: 'task-1',
      phase: 'Now',
      title: 'Book Venue',
      description: 'Sign contract and pay deposit',
      dueDate: '2026-10-01',
      owner: 'Host',
      completed: true,
      daysBeforeEvent: 60,
    },
    {
      id: 'task-2',
      phase: 'Next 30 days',
      title: 'Catering Tasting',
      description: 'Select menu items',
      dueDate: '2026-11-01',
      owner: 'Couple',
      completed: false,
      daysBeforeEvent: 30,
      dependencies: ['task-1'],
    },
    {
      id: 'task-3',
      phase: 'Event week',
      title: 'Decor Setup',
      description: 'Mandap rigging',
      dueDate: '2026-11-28',
      owner: 'Decorator',
      completed: false,
      daysBeforeEvent: 2,
    },
  ];

  it('determines appropriate timeline phases', () => {
    expect(calculatePhaseForDays(0)).toBe('Event day');
    expect(calculatePhaseForDays(5)).toBe('Event week');
    expect(calculatePhaseForDays(25)).toBe('Next 30 days');
    expect(calculatePhaseForDays(45)).toBe('Next 7 days');
    expect(calculatePhaseForDays(90)).toBe('Now');
  });

  it('reflows timeline dates deterministically when event shifts', () => {
    const { updatedTasks, notice } = reflowTimelineDates(
      sampleTasks,
      '2026-11-30',
      '2026-12-10' // 10 days later
    );

    expect(updatedTasks).toHaveLength(3);
    expect(notice).toContain('delayed by 10 days');
    // Task-1 was 60 days before event -> new due date is 2026-12-10 - 60 days = 2026-10-11
    expect(updatedTasks[0].dueDate).toBe('2026-10-11');
  });

  it('detects dependency order violations in milestones', () => {
    const invalidTasks: TimelineTask[] = [
      {
        id: 'task-prereq',
        phase: 'Next 30 days',
        title: 'Prerequisite Step',
        description: 'Must happen first',
        dueDate: '2026-11-15',
        owner: 'Lead',
        completed: false,
        daysBeforeEvent: 15,
      },
      {
        id: 'task-subsequent',
        phase: 'Next 30 days',
        title: 'Subsequent Step',
        description: 'Scheduled erroneously before prerequisite',
        dueDate: '2026-11-10', // due earlier than prereq!
        owner: 'Lead',
        completed: false,
        daysBeforeEvent: 20,
        dependencies: ['task-prereq'],
      },
    ];

    const conflicts = detectTimelineConflicts(invalidTasks);
    expect(conflicts.some((c) => c.type === 'DEPENDENCY_VIOLATION')).toBe(true);
  });

  it('detects minute-by-minute day-of schedule conflicts', () => {
    const overlappingSlots: DayOfScheduleSlot[] = [
      {
        id: 'slot-1',
        time: '18:00',
        durationMinutes: 60,
        activityTitle: 'Cocktail Welcome',
        location: 'Grand Ballroom',
        leadPerson: 'Host',
        isCritical: false,
        notes: '',
      },
      {
        id: 'slot-2',
        time: '18:30', // overlaps with slot-1 in Grand Ballroom
        durationMinutes: 45,
        activityTitle: 'Formal Speeches',
        location: 'Grand Ballroom',
        leadPerson: 'Host',
        isCritical: true,
        notes: '',
      },
    ];

    const conflicts = detectDayOfScheduleConflicts(overlappingSlots);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some((c) => c.type === 'TIME_OVERLAP')).toBe(true);
  });

  it('exports valid .ics, .csv, and .json calendar schedules', () => {
    const ics = generateTimelineIcs('Royal Wedding', sampleTasks);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:[Now] Book Venue');

    const csv = exportTimelineToCsv(sampleTasks);
    expect(csv).toContain('Type,Phase/Time,Title');
    expect(csv).toContain('Book Venue');

    const json = exportTimelineToJson(sampleTasks);
    expect(json).toContain('"milestoneTasks"');
  });
});
