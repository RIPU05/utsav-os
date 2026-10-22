/**
 * @fileoverview API Route: Generates targeted replanning diff suggestions
 * when event parameters shift (guest count change, budget cut, date delay).
 */

import { NextResponse } from 'next/server';
import { replanRequestSchema, replanDiffResponseSchema } from '@/lib/schemas';
import { buildReplanningPrompt } from '@/lib/prompts';
import { callGeminiStructured } from '@/lib/gemini';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { sanitizeObject } from '@/lib/sanitizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handles incoming POST requests to compute atomic plan adjustments and diff proposals.
 *
 * @param {Request} request - Next.js HTTP request containing active plan and change parameters.
 * @returns {Promise<NextResponse | Response>} JSON response containing the proposed diff changes or error.
 * @throws {never} Handled safely via handleApiError.
 */
export async function POST(request: Request): Promise<NextResponse | Response> {
  const safety = checkRequestSafety(request);
  if (!safety.allowed && safety.response) {
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
