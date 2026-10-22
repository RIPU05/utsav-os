import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          card: 'var(--color-paper-card)',
          subtle: 'var(--color-paper-subtle)',
          elevated: 'var(--color-paper-elevated)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          text: 'var(--color-accent-text)',
        },
        rule: 'var(--color-rule)',
        state: {
          success: 'var(--color-success)',
          'success-subtle': 'var(--color-success-subtle)',
          warning: 'var(--color-warning)',
          'warning-subtle': 'var(--color-warning-subtle)',
          error: 'var(--color-error)',
          'error-subtle': 'var(--color-error-subtle)',
          info: 'var(--color-info)',
          'info-subtle': 'var(--color-info-subtle)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px -3px rgba(217, 119, 6, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
