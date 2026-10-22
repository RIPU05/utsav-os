import React from 'react';
import { AppShell } from '@/components/app-shell';
import { IntakeForm } from '@/components/intake-form';

/**
 * Landing and event configuration page rendering the primary intake form.
 *
 * @returns {React.ReactElement} The home page element.
 */
export default function HomePage(): React.ReactElement {
  return (
    <AppShell>
      <IntakeForm />
    </AppShell>
  );
}
