import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PlanProvider } from '@/components/plan-context';
import { APP_NAME, APP_TAGLINE, APP_ONE_LINER } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_ONE_LINER,
  keywords: [
    'event planning',
    'wedding planner',
    'birthday planner',
    'community event permits',
    'budget rebalancer',
    'run of show',
    'vendor contract analysis',
  ],
  authors: [{ name: 'Utsav OS Engineering Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f5' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

/**
 * Root document layout providing HTML structure, font smoothing, WCAG skip link,
 * ThemeProvider, and reactive PlanProvider context.
 *
 * @param {{ children: React.ReactNode }} props - Layout properties.
 * @returns {React.ReactElement} The root HTML layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-paper text-ink selection:bg-accent-subtle selection:text-ink">
        {/* WCAG 2.1 AA Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-text focus:rounded-lg focus:shadow-lg focus:outline-hidden"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <PlanProvider>{children}</PlanProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
