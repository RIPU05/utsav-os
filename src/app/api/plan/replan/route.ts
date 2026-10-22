import { NextResponse } from 'next/server';
import { replanRequestSchema, replanDiffResponseSchema } from '@/lib/schemas';
import { buildReplanningPrompt } from '@/lib/prompts';
import { callGeminiStructured } from '@/lib/gemini';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { sanitizeObject } from '@/lib/sanitizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const safety = checkRequestSafety(request);
  if (!safety.allowed) {
    return safety.response;
  }

  try {
    const rawJson = await request.json();
    const sanitized = sanitizeObject(rawJson);
    const parsedRequest = replanRequestSchema.parse(sanitized);

    const prompt = buildReplanningPrompt(parsedRequest);
    const diffResponse = await callGeminiStructured(prompt, replanDiffResponseSchema);

    return NextResponse.json(diffResponse);
  } catch (err) {
    return handleApiError(err);
  }
}
