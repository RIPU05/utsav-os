'use client';

import React, { useState, useEffect } from 'react';
import { usePlan } from '../plan-context';
import { RiskItem, RiskRegister } from '@/lib/schemas';
import { ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * Risk Assessment & Contingency Audit tab identifying potential points of failure,
 * vendor dependencies, weather vulnerabilities, and actionable mitigation tasks.
 *
 * @returns {React.ReactElement | null} The risks dashboard element or null.
 */
export function TabRisks(): React.ReactElement | null {
  const { activePlan, announce } = usePlan();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assessedAt, setAssessedAt] = useState<string | null>(null);

  useEffect(() => {
    // Generate static baseline risks tailored to plan type
    if (activePlan) {
      const defaultRisks: RiskItem[] = [
        {
          id: 'risk-1',
          category: 'Dependencies',
          severity: 'High',
          potentialIssue: 'Vendor setup delays causing milestone cascade.',
          rootCause: 'Lack of shared day-of master contact sheet.',
          mitigationTask: 'Distribute run-of-show contact directory 5 days prior to celebration.',
        },
        {
          id: 'risk-2',
          category: 'Weather & Season',
          severity: 'Medium',
          potentialIssue: 'Sudden rain or high wind affecting open lawn areas.',
          rootCause: 'Outdoor venue vulnerability during seasonal transitions.',
          mitigationTask: 'Reserve waterproof canopy marquee with 48-hour activation clause.',
        },
        {
          id: 'risk-3',
          category: 'Permits & Legal',
          severity: activePlan.eventType === 'Community Event' ? 'Critical' : 'Medium',
          potentialIssue: 'Sound decibel enforcement resulting in premature music shutdown.',
          rootCause: 'Police sound limit threshold at 10:00 PM.',
          mitigationTask: 'Obtain written municipal sound clearance and adhere to acoustic limiters.',
        },
        {
          id: 'risk-4',
          category: 'Dietary & Accessibility',
          severity: 'High',
          potentialIssue: 'Severe cross-contamination for allergy-sensitive guests.',
          rootCause: 'Shared kitchen prep tables without dedicated allergy signage.',
          mitigationTask: 'Enforce separate culinary prep counters and allergen menu flags.',
        },
      ];
      setRisks(defaultRisks);
      setAssessedAt(new Date().toLocaleDateString());
    }
  }, [activePlan]);

  const handleRunAudit = async () => {
    if (!activePlan || isLoading) return;
    setIsLoading(true);
    announce('Auditing celebration plan for hidden risks...');

    try {
      const res = await fetch('/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePlan),
      });

      if (res.ok) {
        const data: RiskRegister = await res.json();
        setRisks(data.risks);
        setAssessedAt(new Date().toLocaleDateString());
        announce(`Risk assessment complete. Identified ${data.risks.length} key risks.`);
      }
    } catch {
      announce('Failed to refresh risk audit.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activePlan) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rule bg-paper-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-2xl text-ink">
            Proactive Risk Register &amp; Mitigation Engine
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Audit across 6 vulnerability vectors: Dependencies, Weather, Permits, Dietary, Payments, and Single Points of Failure.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunAudit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isLoading ? 'Auditing...' : 'Run GenAI Risk Audit'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="rounded-2xl border border-rule bg-paper-card p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-ink">
                  {risk.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                    risk.severity === 'Critical'
                      ? 'bg-state-error/20 text-state-error'
                      : risk.severity === 'High'
                      ? 'bg-state-warning/20 text-state-warning'
                      : 'bg-paper-subtle text-ink-muted'
                  }`}
                >
                  {risk.severity} Severity
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm text-ink mb-1">
                {risk.potentialIssue}
              </h3>
              <p className="text-xs text-ink-muted mb-3 leading-relaxed">
                <strong>Root Cause:</strong> {risk.rootCause}
              </p>
            </div>

            <div className="pt-3 border-t border-rule bg-paper-subtle/30 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <span className="text-[10px] font-mono uppercase font-bold text-accent block mb-0.5">
                Mitigation Protocol
              </span>
              <p className="text-xs text-ink leading-relaxed font-medium">
                {risk.mitigationTask}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
