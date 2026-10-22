import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as followupPost } from '@/app/api/plan/followup/route';
import { POST as replanPost } from '@/app/api/plan/replan/route';
import { POST as risksPost } from '@/app/api/plan/risks/route';
import { POST as streamPost } from '@/app/api/plan/stream-assistant/route';
import { SAVED_EXAMPLES } from '@/data/saved-examples';
import * as apiHelper from '@/lib/api-helper';
import * as geminiModule from '@/lib/gemini';
import { followupCache, createPayloadKey } from '@/lib/cache';
import { NextResponse } from 'next/server';

// Mock gemini structured calls and streaming
vi.mock('@/lib/gemini', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gemini')>('@/lib/gemini');
  return {
    ...actual,
    callGeminiStructured: vi.fn(),
    streamGeminiContent: vi.fn(),
  };
});

describe('API Route Handlers - Edge Cases & Resiliency', () => {
  const samplePlan = SAVED_EXAMPLES['royal-wedding'];

  const sampleIntake = {
    eventType: 'Wedding' as const,
    city: 'Jaipur',
    date: '2026-11-20',
    guestCount: 300,
    totalBudget: 2500000,
    currency: 'INR' as const,
    styleCulture: 'Heritage Royal',
    nonNegotiables: '',
    venueAreaSqFt: 15000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('400 Bad Request triggers on missing or malformed payloads', () => {
    it('rejects /api/plan/followup with 400 on empty JSON body', async () => {
      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await followupPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation Error');
    });

    it('rejects /api/plan/replan with 400 on missing delta payload', async () => {
      const req = new Request('http://localhost/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: samplePlan }),
      });
      const res = await replanPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation Error');
    });

    it('rejects /api/plan/risks with 400 on null plan payload', async () => {
      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: null }),
      });
      const res = await risksPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation Error');
    });

    it('rejects /api/plan/stream-assistant with 400 on invalid promptType', async () => {
      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType: 'unknown-type',
          plan: samplePlan,
        }),
      });
      const res = await streamPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    it('rejects /api/plan/stream-assistant with 400 on malformed json parse failure', async () => {
      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-{',
      });
      const res = await streamPost(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Rate limiter rejection (HTTP 429) triggers', () => {
    it('returns 429 for /api/plan/followup when rate limited', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '192.168.1.100',
        response: NextResponse.json({ error: 'Too many requests' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleIntake),
      });
      const res = await followupPost(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBe('Too many requests');
    });

    it('returns 429 for /api/plan/replan when rate limited', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '192.168.1.100',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: samplePlan, delta: { budgetChange: 1000 } }),
      });
      const res = await replanPost(req);
      expect(res.status).toBe(429);
    });

    it('returns 429 for /api/plan/risks when rate limited', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '192.168.1.100',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePlan),
      });
      const res = await risksPost(req);
      expect(res.status).toBe(429);
    });

    it('returns 429 for /api/plan/stream-assistant when rate limited', async () => {
      vi.spyOn(apiHelper, 'checkRequestSafety').mockReturnValueOnce({
        allowed: false,
        clientIp: '192.168.1.100',
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      });

      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: 'invitation', plan: samplePlan }),
      });
      const res = await streamPost(req);
      expect(res.status).toBe(429);
    });
  });

  describe('Mock Gemini error responses and fallback behavior', () => {
    it('handles Gemini 503 service unavailable in /api/plan/followup gracefully', async () => {
      vi.mocked(geminiModule.callGeminiStructured).mockRejectedValueOnce(
        new geminiModule.GeminiApiError('Model overloaded', 503)
      );

      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleIntake),
      });

      const res = await followupPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toBe('Model overloaded');
    });

    it('handles Gemini 500 error in /api/plan/risks and returns 500 status', async () => {
      vi.mocked(geminiModule.callGeminiStructured).mockRejectedValueOnce(
        new Error('Gemini API internal crash')
      );

      const req = new Request('http://localhost/api/plan/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePlan),
      });

      const res = await risksPost(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Gemini API internal crash');
    });

    it('handles streaming generator error inside /api/plan/stream-assistant SSE stream', async () => {
      vi.mocked(geminiModule.streamGeminiContent).mockImplementationOnce(async function* () {
        throw new Error('Upstream token stream disconnected');
      });

      const req = new Request('http://localhost/api/plan/stream-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType: 'invitation',
          plan: samplePlan,
        }),
      });

      const res = await streamPost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');

      const text = await res.text();
      expect(text).toContain('Upstream token stream disconnected');
    });
  });

  describe('Cache HIT optimizations across routes', () => {
    it('returns X-Cache: HIT for /api/plan/followup when key exists in LRU cache', async () => {
      const cacheKey = createPayloadKey('followup', sampleIntake);
      followupCache.set(cacheKey, {
        needsFollowUp: false,
        questionId: 'cached_q',
        questionText: 'Cached prompt',
        reason: 'Cached response',
      });

      const req = new Request('http://localhost/api/plan/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleIntake),
      });

      const res = await followupPost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('HIT');
      const data = await res.json();
      expect(data.questionId).toBe('cached_q');
    });
  });
});
