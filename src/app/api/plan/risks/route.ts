/**
 * @fileoverview API Route: Generates an expert 6-category event risk register audit
 * covering dependencies, weather vulnerabilities, permits, dietary/accessibility, cash flow, and single points of failure.
 */

import { NextResponse } from 'next/server';
import { eventPlanSchema, riskRegisterSchema } from '@/lib/schemas';
import { callGeminiStructured } from '@/lib/gemini';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { sanitizeObject } from '@/lib/sanitizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handles incoming POST requests to run an AI risk assessment on an event plan.
 *
 * @param {Request} request - Next.js HTTP request containing the serialized EventPlan.
 * @returns {Promise<NextResponse | Response>} JSON response with the generated RiskRegister or error.
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
    const plan = eventPlanSchema.parse(sanitized);

    const prompt = `
You are an expert event risk auditor. Conduct a thorough risk assessment for:
Title: "${plan.title}"
Type: ${plan.eventType}
City: ${plan.city}
Date: ${plan.date}
Guest Count: ${plan.guestCount}
Budget: ${plan.totalBudget} ${plan.currency}
Style: ${plan.styleCulture}
Non-Negotiables: ${plan.nonNegotiables}

Evaluate risks across 6 critical categories:
1. Dependencies (Vendor hand-offs, power supply, key personnel)
2. Weather & Season (Precipitation, heat index, wind, outdoor vulnerability)
3. Permits & Legal (Sound curfews, municipal ground authorization, fire safety)
4. Dietary & Accessibility (Food allergies, wheel-chair ramp access, elderly guest seating)
5. Payment Deadlines (Deposit milestones, cash flow crunches)
6. Single Point of Failure (Unique specialty performers, irreplaceable heirlooms)

Return valid JSON adhering to riskRegisterSchema:
{
  "risks": [
    {
      "id": "risk_1",
      "category": "Dependencies",
      "severity": "High",
      "potentialIssue": "Clear issue description",
      "rootCause": "Root cause explanation",
      "mitigationTask": "Actionable preventive task"
    }
  ],
  "assessedAt": "${new Date().toISOString()}"
}
`;

    const riskRegister = await callGeminiStructured(prompt, riskRegisterSchema);
    return NextResponse.json(riskRegister);
  } catch (err) {
    return handleApiError(err);
  }
}
