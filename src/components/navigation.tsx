'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import {
  CalendarDays,
  Sparkles,
  BookmarkCheck,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/workspace', label: 'Workspace', icon: CalendarDays },
  { href: '/', label: 'New Plan', icon: Sparkles },
  { href: '/saved', label: 'Preset Library', icon: BookmarkCheck },
  { href: '/privacy', label: 'Privacy', icon: ShieldCheck },
  { href: '/terms', label: 'Terms', icon: ScrollText },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Rail Navigation (>= 768px) */}
      <aside className="hidden md:flex flex-col justify-between w-64 border-r border-rule bg-paper-card p-5 shrink-0 min-h-screen">
        <div>
          {/* Brand Emblem */}
          <Link
            href="/"
            className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-paper-subtle transition-colors mb-6 group"
            aria-label="Aayojan Ace Pro Home"
          >
            <div className="h-9 w-9 rounded-xl bg-accent text-accent-text flex items-center justify-center font-serif font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              आ
            </div>
            <div>
              <span className="font-serif font-bold text-base tracking-tight text-ink block leading-none">
                Aayojan Ace
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-accent font-semibold">
                Pro Edition
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Primary Desktop Navigation" className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-accent-subtle text-accent font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-paper-subtle'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-ink-faint'}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Theme Switcher */}
        <div className="pt-4 border-t border-rule flex items-center justify-between">
          <span className="text-[11px] text-ink-faint">WCAG 2.1 AA Compliant</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-card/95 backdrop-blur-md border-t border-rule px-2 py-1.5 flex items-center justify-around safe-bottom shadow-lg"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent font-bold' : 'text-ink-muted hover:text-ink'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 mb-0.5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
