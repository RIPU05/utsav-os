import { describe, it, expect } from 'vitest';
import {
  intakeFormSchema,
  eventPlanSchema,
  budgetPlanSchema,
  replanRequestSchema,
  riskRegisterSchema,
} from '@/lib/schemas';
import { SAVED_EXAMPLES } from '@/data/saved-examples';

describe('Zod Validation Schemas', () => {
  it('validates a complete, compliant intake form', () => {
    const validData = {
      eventType: 'Wedding',
      city: 'Udaipur',
      date: '2026-12-25',
      guestCount: 200,
      totalBudget: 2000000,
      currency: 'INR',
      styleCulture: 'Palace Heritage',
      nonNegotiables: 'Pure vegetarian',
      venueAreaSqFt: 15000,
    };

    const parseResult = intakeFormSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('rejects invalid dates and negative budgets in intake form', () => {
    const invalidData = {
      eventType: 'Birthday',
      city: 'M',
      date: 'invalid-date',
      guestCount: -5,
      totalBudget: -100,
      styleCulture: '',
    };

    const parseResult = intakeFormSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('validates all production preset models against master eventPlanSchema', () => {
    for (const [key, plan] of Object.entries(SAVED_EXAMPLES)) {
      const parseResult = eventPlanSchema.safeParse(plan);
      if (!parseResult.success) {
        console.error(`Validation failed for preset: ${key}`, parseResult.error);
      }
      expect(parseResult.success).toBe(true);
    }
  });

  it('validates risk register schema', () => {
    const validRegister = {
      risks: [
        {
          id: 'r-1',
          category: 'Weather & Season',
          severity: 'High',
          potentialIssue: 'Monsoon showers',
          rootCause: 'Outdoor lawn ceremony',
          mitigationTask: 'Set up waterproof pavilion',
        },
        {
          id: 'r-2',
          category: 'Dependencies',
          severity: 'Medium',
          potentialIssue: 'DJ equipment delay',
          rootCause: 'Traffic congestion',
          mitigationTask: 'Schedule 3-hour pre-check buffer',
        },
        {
          id: 'r-3',
          category: 'Permits & Legal',
          severity: 'Critical',
          potentialIssue: 'Sound decibel warning',
          rootCause: 'Police sound restrictions',
          mitigationTask: 'Adhere to 10 PM acoustic barrier',
        },
      ],
      assessedAt: new Date().toISOString(),
    };

    const parseResult = riskRegisterSchema.safeParse(validRegister);
    expect(parseResult.success).toBe(true);
  });
});
