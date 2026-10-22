'use client';

import React from 'react';

/**
 * Props for the CreativeBaselineCard component.
 */
export interface CreativeBaselineCardProps {
  invitationSample?: string;
  menuPairings?: string[];
}

/**
 * Atomic reference card displaying the preset or active plan's baseline invitation and menu pairings.
 *
 * @param {CreativeBaselineCardProps} props - Component properties.
 * @returns {React.ReactElement} The rendered baseline reference card.
 */
export function CreativeBaselineCard({
  invitationSample,
  menuPairings = [],
}: CreativeBaselineCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs">
      <h3 className="font-serif font-black text-lg text-ink mb-3">
        Plan Creative Baseline Reference
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-muted leading-relaxed">
        <div className="p-4 rounded-xl border border-rule bg-paper-subtle/30">
          <span className="font-bold text-ink block mb-1">Invitation Sample:</span>
          <p className="italic">{invitationSample || 'No invitation text saved yet.'}</p>
        </div>
        <div className="p-4 rounded-xl border border-rule bg-paper-subtle/30">
          <span className="font-bold text-ink block mb-1">Curated Menu Pairings:</span>
          <ul className="list-disc list-inside space-y-1">
            {menuPairings.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
