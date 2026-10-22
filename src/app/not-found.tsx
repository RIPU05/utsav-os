import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { HelpCircle, ArrowLeft } from 'lucide-react';

/**
 * Accessible 404 Not Found error page.
 *
 * @returns {React.ReactElement} The 404 error view.
 */
export default function NotFound(): React.ReactElement {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-accent-subtle text-accent mb-4">
          <HelpCircle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="font-serif font-black text-3xl text-ink">
          Page Not Found (404)
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          The celebration planning screen you are seeking does not exist or has been relocated.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Return Home</span>
        </Link>
      </div>
    </AppShell>
  );
}
