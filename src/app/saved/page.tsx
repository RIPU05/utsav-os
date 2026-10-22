'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { usePlan } from '@/components/plan-context';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import { formatCurrency } from '@/lib/budget-engine';
import { BookmarkCheck, ArrowRight, Download, Users, Calendar, MapPin } from 'lucide-react';

export default function SavedPage() {
  const router = useRouter();
  const { loadSavedExample, announce } = usePlan();

  const handleSelect = (key: string) => {
    loadSavedExample(key);
    announce(`Loaded plan: ${SAVED_EXAMPLES[key].title}`);
    router.push('/workspace');
  };

  const handleDownload = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const plan = SAVED_EXAMPLES[key];
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce(`Downloaded JSON for ${plan.title}`);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase mb-2">
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
            <span>Preset Model Library</span>
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-ink tracking-tight">
            Curated Celebration Blueprints
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl leading-relaxed">
            Production-grade reference plans for Weddings, Birthdays, and Community Events featuring pre-calculated ledger distributions, day-of run-of-shows, and regulatory permits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(SAVED_EXAMPLES).map(([key, plan]) => (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              className="rounded-3xl border border-rule bg-paper-card p-6 shadow-card hover:border-accent hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-accent-subtle text-accent">
                    {plan.eventType}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(key, e)}
                    aria-label={`Download JSON blueprint for ${plan.title}`}
                    className="p-1.5 rounded-lg border border-rule text-ink-muted hover:text-ink hover:bg-paper-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <h2 className="font-serif font-black text-xl text-ink group-hover:text-accent transition-colors mb-2">
                  {plan.title}
                </h2>
                <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed mb-4">
                  {plan.styleCulture}
                </p>

                <div className="space-y-1.5 text-xs text-ink-muted pt-3 border-t border-rule font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>{plan.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>{plan.guestCount.toLocaleString()} Attendees</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>{plan.date}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-rule flex items-center justify-between">
                <span className="font-mono font-bold text-accent text-sm">
                  {formatCurrency(plan.totalBudget, plan.currency)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-ink group-hover:translate-x-0.5 transition-transform">
                  <span>Open in Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
