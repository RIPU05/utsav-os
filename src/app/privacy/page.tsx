import React from 'react';
import { AppShell } from '@/components/app-shell';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase mb-2">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Privacy &amp; Data Isolation</span>
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-ink tracking-tight">
            Zero-Trust Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Last updated: October 2026. Plain-language transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-rule bg-paper-card">
            <Lock className="h-5 w-5 text-accent mb-2" aria-hidden="true" />
            <h2 className="font-serif font-bold text-base text-ink mb-1">
              Zero Key Leakage
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              API credentials are held strictly server-side. No Google Gemini secrets are ever shipped to the browser.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-rule bg-paper-card">
            <EyeOff className="h-5 w-5 text-accent mb-2" aria-hidden="true" />
            <h2 className="font-serif font-bold text-base text-ink mb-1">
              Local-First Persistence
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Active celebration data is stored in your local browser sandbox. We never harvest guest lists or contact phone numbers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-rule bg-paper-card">
            <Server className="h-5 w-5 text-accent mb-2" aria-hidden="true" />
            <h2 className="font-serif font-bold text-base text-ink mb-1">
              Isolated AI Synthesis
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              AI requests pass through strict DOMPurify sanitization and injection boundary delimiters (`&lt;&lt;&lt;USER_INPUT_DATA&gt;&gt;&gt;`).
            </p>
          </div>
        </div>

        <article className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-ink-muted leading-relaxed space-y-4 rounded-3xl border border-rule bg-paper-card p-6 sm:p-8">
          <h2 className="font-serif font-bold text-lg text-ink">1. Information We Do Not Collect</h2>
          <p>
            Utsav OS does not require upfront account registration, does not collect government identity credentials, and does not retain banking information. All numerical calculations are performed locally in pure TypeScript.
          </p>

          <h2 className="font-serif font-bold text-lg text-ink">2. How AI Services are Invoked</h2>
          <p>
            When you request plan generation, rebalancing, or creative streaming, an anonymous, sanitized payload containing your celebration parameters is forwarded to Google Gemini via encrypted server-side route proxies.
          </p>
        </article>
      </div>
    </AppShell>
  );
}
