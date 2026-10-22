import { NextResponse } from 'next/server';
import { intakeFormSchema, followUpResponseSchema } from '@/lib/schemas';
import { buildFollowUpPrompt } from '@/lib/prompts';
import { callGeminiStructured } from '@/lib/gemini';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { followupCache, createPayloadKey } from '@/lib/cache';
import { sanitizeObject } from '@/lib/sanitizer';

export async function POST(request: Request) {
  const safety = checkRequestSafety(request);
  if (!safety.allowed) {
    return safety.response;
  }

  try {
    const rawJson = await request.json();
    const sanitized = sanitizeObject(rawJson);
    const intake = intakeFormSchema.parse(sanitized);

    const cacheKey = createPayloadKey('followup', intake);
    const cachedResult = followupCache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const prompt = buildFollowUpPrompt(intake);
    const result = await callGeminiStructured(prompt, followUpResponseSchema);

    followupCache.set(cacheKey, result);

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
