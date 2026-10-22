import React from 'react';
import { AppShell } from '@/components/app-shell';
import { IntakeForm } from '@/components/intake-form';

export default function HomePage() {
  return (
    <AppShell>
      <IntakeForm />
    </AppShell>
  );
}
