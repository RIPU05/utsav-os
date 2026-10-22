import { describe, it, expect } from 'vitest';
import {
  buildPlanGenerationPrompt,
  buildFollowUpPrompt,
  buildReplanningPrompt,
  buildCreativeAssistantPrompt,
} from '@/lib/prompts';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import { IntakeFormData, ReplanRequest } from '@/lib/schemas';

describe('Prompt Constructors & Injection Isolation', () => {
  const weddingIntake: IntakeFormData = {
    eventType: 'Wedding',
    city: 'Jaipur',
    date: '2026-11-20',
    guestCount: 350,
    totalBudget: 3500000,
    currency: 'INR',
    styleCulture: 'Royal Rajasthani Heritage',
    nonNegotiables: 'Pure Jain counter',
    venueAreaSqFt: 20000,
  };

  const communityIntake: IntakeFormData = {
    eventType: 'Community Event',
    city: 'Bengaluru',
    date: '2026-12-05',
    guestCount: 1200,
    totalBudget: 800000,
    currency: 'INR',
    styleCulture: 'Zero-Waste Fair',
    nonNegotiables: 'Compostable cutlery',
    venueAreaSqFt: 30000,
  };

  it('constructs plan generation prompt with strict boundary delimiters', () => {
    const prompt = buildPlanGenerationPrompt(weddingIntake);
    expect(prompt).toContain('<<<USER_INPUT_DATA>>>');
    expect(prompt).toContain('<<<END_USER_INPUT_DATA>>>');
    expect(prompt).toContain('Jaipur');
    expect(prompt).toContain('Royal Rajasthani Heritage');
  });

  it('incorporates community event requirements when eventType is Community Event', () => {
    const prompt = buildPlanGenerationPrompt(communityIntake);
    expect(prompt).toContain('COMMUNITY EVENT SPECIFIC REQUIREMENTS');
    expect(prompt).toContain('municipal/civic permits');
    expect(prompt).toContain('volunteer shifts');
  });

  it('constructs follow-up ambiguity prompt', () => {
    const prompt = buildFollowUpPrompt(weddingIntake);
    expect(prompt).toContain('Analyze the following event planning request');
    expect(prompt).toContain('needsFollowUp');
  });

  it('constructs replanning prompt with delta constraints', () => {
    const plan = SAVED_EXAMPLES['royal-wedding'];
    const replanReq: ReplanRequest = {
      currentPlan: plan,
      changes: {
        totalBudget: 3000000,
        guestCount: 300,
      },
    };
    const prompt = buildReplanningPrompt(replanReq);
    expect(prompt).toContain('budget rebalancer');
    expect(prompt).toContain('Proposed: 3000000');
  });

  it('constructs creative assistant prompts across all 4 modes', () => {
    const plan = SAVED_EXAMPLES['royal-wedding'];
    const invPrompt = buildCreativeAssistantPrompt('invitation', plan, 'warm tone');
    expect(invPrompt).toContain('invitation texts');

    const menuPrompt = buildCreativeAssistantPrompt('menu', plan);
    expect(menuPrompt).toContain('banquet menu');

    const themePrompt = buildCreativeAssistantPrompt('theme', plan);
    expect(themePrompt).toContain('mood-boards');

    const runPrompt = buildCreativeAssistantPrompt('runOfShow', plan);
    expect(runPrompt).toContain('run-of-show schedule');
  });
});
