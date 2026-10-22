import { describe, it, expect, vi } from 'vitest';
import { POST as followupPost } from '@/app/api/plan/followup/route';
import { POST as replanPost } from '@/app/api/plan/replan/route';
import { POST as streamPost } from '@/app/api/plan/stream-assistant/route';
import { SAVED_EXAMPLES } from '@/data/saved-examples';

// Mock gemini structured calls
vi.mock('@/lib/gemini', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gemini')>('@/lib/gemini');
  return {
    ...actual,
    callGeminiStructured: vi.fn().mockImplementation((prompt: string, schema: any) => {
      if (prompt.includes('ambiguities')) {
        return Promise.resolve({ needsFollowUp: false });
      }
      if (prompt.includes('rebalancer')) {
        return Promise.resolve({
          summaryOfChanges: 'Rebalanced category allocations.',
          why: 'Fitted within revised envelope.',
          tradeOffOptions: ['Option 1'],
          affectedBudgetCategories: [],
          affectedTimelineTasks: [],
        });
      }
      return Promise.resolve({});
    }),
    streamGeminiContent: async function* () {
      yield 'Drafting celebration concepts...';
    },
  };
});

describe('API Route Handlers', () => {
  it('handles /api/plan/followup successfully', async () => {
    const intake = {
      eventType: 'Wedding',
      city: 'Jaipur',
      date: '2026-11-20',
      guestCount: 300,
      totalBudget: 2500000,
      currency: 'INR',
      styleCulture: 'Heritage Royal',
      nonNegotiables: '',
      venueAreaSqFt: 15000,
    };

    const req = new Request('http://localhost/api/plan/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intake),
    });

    const res = await followupPost(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(200);
    const json = await res!.json();
    expect(json).toHaveProperty('needsFollowUp');
  });

  it('handles /api/plan/replan successfully', async () => {
    const plan = SAVED_EXAMPLES['royal-wedding'];
    const replanPayload = {
      currentPlan: plan,
      changes: {
        totalBudget: 3000000,
      },
    };

    const req = new Request('http://localhost/api/plan/replan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replanPayload),
    });

    const res = await replanPost(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(200);
    const json = await res!.json();
    expect(json).toHaveProperty('summaryOfChanges');
  });

  it('handles /api/plan/stream-assistant successfully with streaming response', async () => {
    const plan = SAVED_EXAMPLES['royal-wedding'];
    const payload = {
      promptType: 'invitation',
      plan,
      userNotes: '',
    };

    const req = new Request('http://localhost/api/plan/stream-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await streamPost(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(200);
    expect(res!.headers.get('Content-Type')).toContain('text/event-stream');
  });
});
