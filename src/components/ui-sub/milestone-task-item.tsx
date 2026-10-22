'use client';

import React from 'react';
import { TimelineTask } from '@/lib/schemas';
import { CheckCircle2, Circle, Calendar, User, Tag } from 'lucide-react';

/**
 * Props for the MilestoneTaskItem component.
 */
export interface MilestoneTaskItemProps {
  /** The timeline task entity */
  task: TimelineTask;
  /** Callback fired to toggle completion state */
  onToggleComplete: (taskId: string) => void;
}

/**
 * Atomic component rendering a single milestone planning task with accessible checkbox and metadata tags.
 *
 * @param {MilestoneTaskItemProps} props - Component properties.
 * @returns {React.ReactElement} The task item card.
 */
export function MilestoneTaskItem({
  task,
  onToggleComplete,
}: MilestoneTaskItemProps): React.ReactElement {
  return (
    <div
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
            onClick={() => onToggleComplete(task.id)}
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
  );
}
