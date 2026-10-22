import React from 'react';
import { AppShell } from '@/components/app-shell';
import { ScrollText, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase mb-2">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            <span>Terms of Service</span>
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-ink tracking-tight">
            Terms &amp; Planning Disclaimers
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Last updated: October 2026.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-accent/40 bg-accent-subtle/30 p-5 flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm text-ink leading-relaxed">
            <strong>Mandatory Planning Disclaimer:</strong> Aayojan Ace Pro is an organizational intelligence tool. All financial figures, category percentages, and day-of timelines are planning projections, not legally binding quotes or contracts.
          </div>
        </div>

        <article className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink-muted leading-relaxed space-y-4 rounded-3xl border border-rule bg-paper-card p-6 sm:p-8">
          <h2 className="font-serif font-bold text-lg text-ink">1. Vendor Contracting Autonomy</h2>
          <p>
            Aayojan Ace Pro does not execute automated third-party bookings, hold escrow funds, or place phone calls on behalf of users. Users are strictly responsible for inspecting physical vendor contracts, verifying commercial licenses, and confirming cancellation terms.
          </p>

          <h2 className="font-serif font-bold text-lg text-ink">2. Regulatory &amp; Municipal Compliance</h2>
          <p>
            Permit checklists and crowd density recommendations are computed based on standard NFPA and municipal benchmarks. Users must confirm specific local ordinances, acoustic decibel cutoffs, and fire clearance rules directly with municipal ward officers.
          </p>
        </article>
      </div>
    </AppShell>
  );
}
