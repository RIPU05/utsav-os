'use client';

import React from 'react';
import { Loader2, Copy, Check } from 'lucide-react';

/**
 * Props for the CreativeOutputBox component.
 */
export interface CreativeOutputBoxProps {
  streamedText: string;
  isStreaming: boolean;
  copied: boolean;
  onCopy: () => void;
}

/**
 * Atomic display box for streamed GenAI creative outputs with WCAG aria-live announcements.
 *
 * @param {CreativeOutputBoxProps} props - Component properties.
 * @returns {React.ReactElement} The rendered output box card.
 */
export function CreativeOutputBox({
  streamedText,
  isStreaming,
  copied,
  onCopy,
}: CreativeOutputBoxProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-rule mb-4">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-base text-ink">AI Generation Output</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-accent animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Streaming response...
            </span>
          )}
        </div>

        {streamedText && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule text-xs font-semibold text-ink hover:bg-paper-subtle transition-colors min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-state-success" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Aria-live region for accessibility */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Creative assistant output"
        className="min-h-[160px] max-h-[500px] overflow-y-auto whitespace-pre-wrap text-xs sm:text-sm font-sans text-ink leading-relaxed"
      >
        {streamedText ? (
          streamedText
        ) : (
          <div className="text-ink-faint italic py-8 text-center">
            Press &ldquo;Generate&rdquo; to stream bespoke creative concepts directly from the
            Google Gemini model.
          </div>
        )}
      </div>
    </div>
  );
}
