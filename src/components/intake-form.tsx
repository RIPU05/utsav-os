'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from './plan-context';
import {
  EVENT_TYPES,
  SUPPORTED_CURRENCIES,
  EVENT_PRESETS,
  EventType,
  CurrencyCode,
  PLANNER_DISCLAIMER,
} from '@/lib/constants';
import { intakeFormSchema, IntakeFormData, FollowUpResponse } from '@/lib/schemas';
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  Coins,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  Building,
  HelpCircle,
} from 'lucide-react';

/**
 * Interactive event intake form component supporting preset selection,
 * dynamic validation, ambiguity clarification questions, and plan generation dispatch.
 *
 * @returns {React.ReactElement} The intake form view.
 */
export function IntakeForm(): React.ReactElement {
  const router = useRouter();
  const { setActivePlan, loadSavedExample, announce } = usePlan();

  const [formData, setFormData] = useState<IntakeFormData>({
    eventType: 'Wedding',
    city: 'Jaipur',
    date: '2026-11-20',
    guestCount: 350,
    totalBudget: 3500000,
    currency: 'INR',
    styleCulture: 'Royal Rajasthani Heritage with Sangeet, Mehendi, & Pheras',
    nonNegotiables:
      'Authentic regional catering (strict Jain counter), live Shehnai, venue with open lawn',
    venueAreaSqFt: 20000,
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<FollowUpResponse | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  const handlePresetSelect = (presetId: string) => {
    const preset = EVENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setFormData({
      eventType: preset.eventType,
      city: preset.defaultCity,
      date: '2026-11-20',
      guestCount: preset.suggestedGuests,
      totalBudget: preset.suggestedBudget,
      currency: 'INR',
      styleCulture: preset.styleCulture,
      nonNegotiables: preset.nonNegotiables,
      venueAreaSqFt: preset.venueAreaSqFt || 10000,
    });
    setValidationErrors({});
    announce(`Loaded preset: ${preset.title}`);
  };

  const executePlanGeneration = async (answers?: { questionId: string; answer: string }[]) => {
    setIsSubmitting(true);
    announce('Synthesizing your bespoke celebration plan...');

    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: formData,
          followUpAnswers: answers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate event plan from server');
      }

      const generatedPlan = await res.json();
      setActivePlan(generatedPlan);
      announce('Plan generation successful. Navigating to workspace.');
      router.push('/workspace');
    } catch {
      // Fallback to preset model if offline or API key absent
      const fallbackKey =
        formData.eventType === 'Community Event'
          ? 'community-carnival'
          : formData.eventType === 'Birthday'
            ? 'milestone-birthday'
            : 'royal-wedding';

      loadSavedExample(fallbackKey);
      announce('Loaded curated master plan. Navigating to workspace.');
      router.push('/workspace');
    } finally {
      setIsSubmitting(false);
      setFollowUpQuestion(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = intakeFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      for (const err of result.error.errors) {
        const field = err.path[0] as string;
        errors[field] = err.message;
      }
      setValidationErrors(errors);
      announce('Please correct errors in the intake form.');
      return;
    }

    setIsSubmitting(true);
    announce('Checking event specifications for ambiguity...');

    try {
      // Check follow-up ambiguities first
      const followUpRes = await fetch('/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (followUpRes.ok) {
        const followUpData: FollowUpResponse = await followUpRes.json();
        if (followUpData.needsFollowUp && followUpData.questionText) {
          setFollowUpQuestion(followUpData);
          setIsSubmitting(false);
          announce(`Clarification needed: ${followUpData.questionText}`);
          return;
        }
      }
    } catch {
      // Proceed directly to generation
    }

    await executePlanGeneration();
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion?.questionId) return;
    await executePlanGeneration([
      {
        questionId: followUpQuestion.questionId,
        answer: followUpAnswer,
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Hack2Skill Challenge 5 Showcase</span>
        </div>
        <h1 className="font-serif font-black text-3xl sm:text-5xl text-ink tracking-tight">
          Plan Your Next Celebration, Perfectly.
        </h1>
        <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Deterministic ledger math, day-of minute-by-minute run-of-shows, civic permits, and
          real-time streaming GenAI intelligence.
        </p>
      </div>

      {/* Preset Showcase Selection */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase font-bold text-ink-muted block text-center">
          Or jump start with an optimized preset:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EVENT_PRESETS.map((preset) => {
            const isSelected =
              formData.eventType === preset.eventType && formData.city === preset.defaultCity;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent'
                    : 'border-rule bg-paper-card hover:bg-paper-subtle hover:border-accent/40'
                }`}
              >
                <span className="text-[10px] font-mono font-bold uppercase text-accent block mb-1">
                  {preset.eventType}
                </span>
                <h3 className="font-serif font-bold text-sm text-ink mb-1">{preset.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Intake Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-rule bg-paper-card p-6 sm:p-10 shadow-card space-y-6"
      >
        <div className="border-b border-rule pb-4">
          <h2 className="font-serif font-black text-xl text-ink">Celebration Specifications</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Provide host preferences. Input is treated strictly as passive data with zero-trust
            validation.
          </p>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Event Type */}
          <div>
            <label htmlFor="intake-event-type" className="text-xs font-bold text-ink block mb-1.5">
              Event Category:
            </label>
            <select
              id="intake-event-type"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
              className="w-full min-h-[44px] rounded-xl border border-rule bg-paper px-3.5 py-2 text-xs sm:text-sm font-semibold text-ink focus:border-accent"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label htmlFor="intake-city" className="text-xs font-bold text-ink block mb-1.5">
              City / Location:
            </label>
            <input
              id="intake-city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm text-ink bg-paper focus:border-accent ${
                validationErrors.city ? 'border-state-error' : 'border-rule'
              }`}
              placeholder="e.g. Jaipur, Mumbai, Bengaluru"
            />
            {validationErrors.city && (
              <span className="text-[11px] text-state-error mt-1 block">
                {validationErrors.city}
              </span>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="intake-date" className="text-xs font-bold text-ink block mb-1.5">
              Celebration Date:
            </label>
            <input
              id="intake-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm text-ink bg-paper focus:border-accent ${
                validationErrors.date ? 'border-state-error' : 'border-rule'
              }`}
            />
            {validationErrors.date && (
              <span className="text-[11px] text-state-error mt-1 block">
                {validationErrors.date}
              </span>
            )}
          </div>

          {/* Guest Count */}
          <div>
            <label htmlFor="intake-guests" className="text-xs font-bold text-ink block mb-1.5">
              Guest Count:
            </label>
            <input
              id="intake-guests"
              type="number"
              value={formData.guestCount}
              onChange={(e) =>
                setFormData({ ...formData, guestCount: Number(e.target.value) || 0 })
              }
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-mono text-ink bg-paper focus:border-accent ${
                validationErrors.guestCount ? 'border-state-error' : 'border-rule'
              }`}
            />
            {validationErrors.guestCount && (
              <span className="text-[11px] text-state-error mt-1 block">
                {validationErrors.guestCount}
              </span>
            )}
          </div>

          {/* Budget & Currency */}
          <div>
            <label htmlFor="intake-budget" className="text-xs font-bold text-ink block mb-1.5">
              Total Budget:
            </label>
            <div className="flex gap-2">
              <input
                id="intake-budget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) =>
                  setFormData({ ...formData, totalBudget: Number(e.target.value) || 0 })
                }
                className={`flex-1 min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-mono text-ink bg-paper focus:border-accent ${
                  validationErrors.totalBudget ? 'border-state-error' : 'border-rule'
                }`}
              />
              <select
                aria-label="Currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as CurrencyCode })
                }
                className="w-24 min-h-[44px] rounded-xl border border-rule bg-paper px-2 text-xs font-bold text-ink focus:border-accent"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            {validationErrors.totalBudget && (
              <span className="text-[11px] text-state-error mt-1 block">
                {validationErrors.totalBudget}
              </span>
            )}
          </div>

          {/* Venue Area */}
          <div>
            <label htmlFor="intake-area" className="text-xs font-bold text-ink block mb-1.5">
              Venue Usable Area (sq. ft):
            </label>
            <input
              id="intake-area"
              type="number"
              value={formData.venueAreaSqFt || ''}
              placeholder="e.g. 25000 (used for crowd safety metrics)"
              onChange={(e) =>
                setFormData({ ...formData, venueAreaSqFt: Number(e.target.value) || 0 })
              }
              className="w-full min-h-[44px] rounded-xl border border-rule px-3.5 py-2 text-xs sm:text-sm font-mono text-ink bg-paper focus:border-accent"
            />
          </div>
        </div>

        {/* Style / Culture */}
        <div>
          <label htmlFor="intake-style" className="text-xs font-bold text-ink block mb-1.5">
            Style, Cultural Vibe &amp; Atmosphere:
          </label>
          <textarea
            id="intake-style"
            rows={2}
            value={formData.styleCulture}
            onChange={(e) => setFormData({ ...formData, styleCulture: e.target.value })}
            className={`w-full rounded-xl border p-3.5 text-xs sm:text-sm text-ink bg-paper focus:border-accent leading-relaxed ${
              validationErrors.styleCulture ? 'border-state-error' : 'border-rule'
            }`}
            placeholder="e.g. Royal Rajasthani with Sangeet, Mehendi, & Pheras, or Zero-Waste Civic Fair..."
          />
          {validationErrors.styleCulture && (
            <span className="text-[11px] text-state-error mt-1 block">
              {validationErrors.styleCulture}
            </span>
          )}
        </div>

        {/* Non-Negotiable Priorities */}
        <div>
          <label htmlFor="intake-nonneg" className="text-xs font-bold text-ink block mb-1.5">
            Non-Negotiable Priorities:
          </label>
          <textarea
            id="intake-nonneg"
            rows={2}
            value={formData.nonNegotiables}
            onChange={(e) => setFormData({ ...formData, nonNegotiables: e.target.value })}
            className="w-full rounded-xl border border-rule p-3.5 text-xs sm:text-sm text-ink bg-paper focus:border-accent leading-relaxed"
            placeholder="e.g. 100% vegetarian Jain counter, live Shehnai, municipal sound barrier at 10 PM..."
          />
        </div>

        {/* Disclaimer Note */}
        <p className="text-[11px] text-ink-faint leading-relaxed">{PLANNER_DISCLAIMER}</p>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 min-h-[48px] px-8 py-3 rounded-2xl bg-accent text-accent-text text-sm font-bold hover:bg-accent-hover transition-colors shadow-card disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isSubmitting ? 'Synthesizing Plan...' : 'Generate Autonomous Plan'}</span>
          </button>
        </div>
      </form>

      {/* Follow-up Question Modal (if AI detected contradiction/ambiguity) */}
      {followUpQuestion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="followup-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleFollowUpSubmit}
            className="w-full max-w-lg rounded-3xl border border-rule bg-paper-card p-6 sm:p-8 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-accent-subtle text-accent shrink-0">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="followup-title" className="font-serif font-black text-lg text-ink">
                  Clarification Required
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  {followUpQuestion.reason ||
                    'We noticed a key ambiguity in your event specifications.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-paper-subtle/50 text-xs sm:text-sm font-medium text-ink leading-relaxed">
              {followUpQuestion.questionText}
            </div>

            <input
              type="text"
              required
              value={followUpAnswer}
              onChange={(e) => setFollowUpAnswer(e.target.value)}
              placeholder="Your answer..."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-rule bg-paper text-xs sm:text-sm text-ink focus:border-accent"
              aria-label="Clarification answer"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => executePlanGeneration()}
                className="text-xs text-ink-muted hover:text-ink min-h-[44px] px-3"
              >
                Skip &amp; Proceed Anyway
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Submit &amp; Generate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
