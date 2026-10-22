'use client';

import React, { useState, useRef } from 'react';
import { usePlan } from '../plan-context';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Mail,
  UtensilsCrossed,
  Palette,
  Clock,
  Loader2,
  StopCircle,
} from 'lucide-react';

type AssistantMode = 'invitation' | 'menu' | 'theme' | 'runOfShow';

export function TabCreative() {
  const { activePlan, announce } = usePlan();
  const [mode, setMode] = useState<AssistantMode>('invitation');
  const [userNotes, setUserNotes] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!activePlan) return null;

  const handleStartStreaming = async () => {
    if (isStreaming) return;

    setStreamedText('');
    setIsStreaming(true);
    announce(`Starting real-time generation for ${mode}...`);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType: mode,
          plan: activePlan,
          userNotes,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stream generation');
      }

      if (!response.body) {
        throw new Error('Streaming response body is missing');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.replace('data: ', '').trim();
            if (rawData === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setStreamedText(accumulated);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Non-json chunk fallback
            }
          }
        }
      }

      announce('Creative generation completed.');
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const msg = (err as Error).message || 'Generation failed';
        setStreamedText((prev) => `${prev}\n\n[Generation Notice: ${msg}. You can explore the preset ideas below.]`);
        announce(`Generation error: ${msg}`);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      announce('Generation stopped by user.');
    }
  };

  const handleCopy = () => {
    if (!streamedText) return;
    navigator.clipboard.writeText(streamedText);
    setCopied(true);
    announce('Copied text to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const MODES: { id: AssistantMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'invitation', label: 'Invitations & RSVP', icon: Mail },
    { id: 'menu', label: 'Menu & Food Pairing', icon: UtensilsCrossed },
    { id: 'theme', label: 'Thematic Color Palettes', icon: Palette },
    { id: 'runOfShow', label: 'Run-of-Show Script', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-center gap-2 text-accent text-xs font-mono font-bold uppercase mb-1">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Real-Time GenAI Creative Assistant</span>
        </div>
        <h2 className="font-serif font-black text-2xl text-ink">
          Streaming Creative Synthesis
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Synthesize personalized invitations, dietary-paired banquet menus, color palettes, and ceremony cues in real time via server-side streaming route handlers.
        </p>

        {/* Mode Selector Buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-accent text-accent-text shadow-sm'
                    : 'border border-rule bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Augmentation Input */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder={`Optional directives for ${mode} (e.g., "formal tone with Rajasthani greetings" or "vegan allergen focus")...`}
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper text-xs sm:text-sm text-ink focus:border-accent"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-state-error text-white text-xs font-bold hover:opacity-90 min-h-[44px]"
            >
              <StopCircle className="h-4 w-4" aria-hidden="true" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartStreaming}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors min-h-[44px]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Generate</span>
            </button>
          )}
        </div>
      </div>

      {/* Streaming Output Display with WCAG aria-live compliance */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-rule mb-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-ink">
              AI Generation Output
            </span>
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
              onClick={handleCopy}
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
              Press &ldquo;Generate&rdquo; to stream bespoke creative concepts directly from the Google Gemini model.
            </div>
          )}
        </div>
      </div>

      {/* Current Preset Ideas Reference */}
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
        <h3 className="font-serif font-black text-lg text-ink mb-3">
          Plan Creative Baseline Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-muted leading-relaxed">
          <div className="p-4 rounded-xl border border-rule bg-paper-subtle/30">
            <span className="font-bold text-ink block mb-1">Invitation Sample:</span>
            <p className="italic">{activePlan.ideas.invitationSample || 'No invitation text saved yet.'}</p>
          </div>
          <div className="p-4 rounded-xl border border-rule bg-paper-subtle/30">
            <span className="font-bold text-ink block mb-1">Curated Menu Pairings:</span>
            <ul className="list-disc list-inside space-y-1">
              {(activePlan.ideas.menuPairings || []).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
