import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        '**/*.d.ts',
        'src/tests/**',
        'postcss.config.js',
        'tailwind.config.ts',
        'next.config.mjs',
        'vitest.config.ts',
        'record_demo.js',
        'src/app/layout.tsx',
      ],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 70,
        lines: 90,
      },
    },
  },
});
