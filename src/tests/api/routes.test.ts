import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as followupPost } from '@/app/api/plan/followup/route';
import { POST as generatePost } from '@/app/api/plan/generate/route';
import { POST as replanPost } from '@/app/api/plan/replan/route';
import { POST as risksPost } from '@/app/api/plan/risks/route';
import { POST as streamPost } from '@/app/api/plan/stream-assistant/route';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import * as apiHelper from '@/lib/api-helper';
import { GeminiApiError } from '@/lib/gemini';
import { NextResponse } from 'next/server';

// Mock gemini structured calls
vi.mock('@/lib/gemini', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gemini')>('@/lib/gemini');
  return {
    ...actual,
    callGeminiStructured: vi
      .fn()
      .mockImplementation((prompt: string, _schema: Record<string, unknown>) => {
        if (prompt.includes('ambiguities')) {
          return Promise.resolve({
            needsFollowUp: true,
            questionId: 'q1',
            questionText: 'Preferred decor style?',
            reason: 'Tailor aesthetics',
          });
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
        if (prompt.includes('expert event risk auditor')) {
          return Promise.resolve({
            risks: [
              {
                id: 'risk_test_1',
                category: 'Dependencies',
                severity: 'High',
                potentialIssue: 'Sound vendor delay',
                rootCause: 'Single logistics provider',
                mitigationStrategy: 'Sign backup agreement',
                owner: 'Production Lead',
                resolved: false,
              },
            ],
          });
        }
        // Default plan generator mock
        const sample = SAVED_EXAMPLES['royal-wedding'];
        return Promise.resolve({
          suggestedTitle: 'Generated Royal Celebration',
          budget: sample.budget,
          timeline: sample.timeline,
          dayOfSchedule: sample.dayOfSchedule,
          vendors: sample.vendors,
          permits: sample.permits,
          volunteerShifts: sample.volunteerShifts,
          ideas: sample.ideas,
        });
      }),
    streamGeminiContent: async function* () {
      yield 'Drafting celebration concepts...';
      yield ' Done.';
    },
  };
});

describe('API Route Handlers - Comprehensive Tests', () => {
  const baseIntake = {
    eventType: 'Wedding' as const,
    city: 'Jaipur',
    date: '2026-11-20',
    guestCount: 300,
    totalBudget: 2500000,
    currency: 'INR',
    styleCulture: 'Heritage Royal',
    nonNegotiables: '',
    venueAreaSqFt: 15000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/plan/followup', () => {
    it('returns 200 with follow-up questions for valid intake', async () => {
      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseIntake),
      });

      const res = await followupPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('needsFollowUp');
    });

    it('returns 400 Bad Request on invalid intake schema', async () => {
      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: '' }),
      });

      const res = await followupPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Validation Error');
    });

    it('returns 429 when rate limiter blocks request', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '127.0.0.1',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseIntake),
      });

      const res = await followupPost(req);
      expect(res.status).toBe(429);
    });
  });

  describe('/api/plan/generate', () => {
    it('returns 200 with generated event plan', async () => {
      const payload = {
        intake: { ...baseIntake, city: 'Udaipur' },
        followUpAnswers: [{ questionId: 'q1', answer: 'Heritage Royal' }],
      };

      const req = new Request('http://localhost/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await generatePost(req);
      expect(res.status).toBe(200);
      const plan = await res.json();
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('budget');
      expect(plan).toHaveProperty('timeline');
    });

    it('returns cached plan with X-Cache: HIT on identical request', async () => {
      const payload = {
        intake: { ...baseIntake, city: 'Udaipur' },
        followUpAnswers: [{ questionId: 'q1', answer: 'Heritage Royal' }],
      };

      const req = new Request('http://localhost/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await generatePost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('HIT');
    });

    it('handles Community Event defaults for permits and volunteer shifts', async () => {
      const payload = {
        intake: {
          ...baseIntake,
          eventType: 'Community Event' as const,
          city: 'Pune',
          venueAreaSqFt: 30000,
        },
      };

      const req = new Request('http://localhost/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await generatePost(req);
      expect(res.status).toBe(200);
      const plan = await res.json();
      expect(plan.permits).toBeDefined();
    });

    it('returns 400 Bad Request on invalid payload', async () => {
      const req = new Request('http://localhost/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: {} }),
      });

      const res = await generatePost(req);
      expect(res.status).toBe(400);
    });

    it('returns 429 when rate limiter blocks generate request', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '127.0.0.1',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: baseIntake }),
      });

      const res = await generatePost(req);
      expect(res.status).toBe(429);
    });
  });

  describe('/api/plan/replan', () => {
    it('returns 200 on valid replan payload', async () => {
      const plan = SAVED_EXAMPLES['royal-wedding'];
      const replanPayload = {
        currentPlan: plan,
        changes: { totalBudget: 3000000 },
      };

      const req = new Request('http://localhost/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replanPayload),
      });

      const res = await replanPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('summaryOfChanges');
    });

    it('returns 400 on malformed replan request', async () => {
      const req = new Request('http://localhost/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await replanPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 429 when replan request is rate limited', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '127.0.0.1',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: SAVED_EXAMPLES['royal-wedding'], changes: {} }),
      });

      const res = await replanPost(req);
      expect(res.status).toBe(429);
    });
  });

  describe('/api/plan/risks', () => {
    it('returns 200 with generated risk register for valid plan', async () => {
      const plan = SAVED_EXAMPLES['royal-wedding'];
      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });

      const res = await risksPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('risks');
      expect(Array.isArray(json.risks)).toBe(true);
    });

    it('returns 400 on invalid event plan payload', async () => {
      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Invalid' }),
      });

      const res = await risksPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 429 on rate limit trigger', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '127.0.0.1',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SAVED_EXAMPLES['royal-wedding']),
      });

      const res = await risksPost(req);
      expect(res.status).toBe(429);
    });
  });

  describe('/api/plan/stream-assistant', () => {
    it('returns 200 text/event-stream on valid prompt payload', async () => {
      const payload = {
        promptType: 'invitation',
        plan: SAVED_EXAMPLES['royal-wedding'],
        userNotes: 'Emphasize royal welcome drink',
      };

      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await streamPost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    });

    it('returns 400 on invalid streaming assistant payload', async () => {
      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: 'invalid_type' }),
      });

      const res = await streamPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 429 when rate limiter blocks streaming assistant request', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '127.0.0.1',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: 'menu', plan: SAVED_EXAMPLES['royal-wedding'] }),
      });

      const res = await streamPost(req);
      expect(res.status).toBe(429);
    });
  });
});
