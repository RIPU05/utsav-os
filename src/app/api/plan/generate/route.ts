import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  intakeFormSchema,
  eventPlanSchema,
  budgetPlanSchema,
  timelineTaskSchema,
  dayOfScheduleSlotSchema,
  vendorItemSchema,
  communityPermitSchema,
  volunteerShiftSchema,
  personalizedIdeasSchema,
  EventPlan,
} from '@/lib/schemas';
import { buildPlanGenerationPrompt } from '@/lib/prompts';
import { callGeminiStructured } from '@/lib/gemini';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { planGenerationCache, createPayloadKey } from '@/lib/cache';
import { calculateCrowdCapacityMetrics, getDefaultCommunityPermits } from '@/lib/community-engine';
import { sanitizeObject } from '@/lib/sanitizer';

const requestPayloadSchema = z.object({
  intake: intakeFormSchema,
  followUpAnswers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string().max(300),
      })
    )
    .optional(),
});

// Intermediate Gemini schema
const rawGeminiPlanSchema = z.object({
  suggestedTitle: z.string().min(2).max(120),
  budget: budgetPlanSchema,
  timeline: z.array(timelineTaskSchema).min(4),
  dayOfSchedule: z.array(dayOfScheduleSlotSchema).optional().default([]),
  vendors: z.array(vendorItemSchema).min(3),
  permits: z.array(communityPermitSchema).optional().default([]),
  volunteerShifts: z.array(volunteerShiftSchema).optional().default([]),
  ideas: personalizedIdeasSchema,
});

export async function POST(request: Request) {
  const safety = checkRequestSafety(request);
  if (!safety.allowed) {
    return safety.response;
  }

  try {
    const rawJson = await request.json();
    const sanitized = sanitizeObject(rawJson);
    const { intake, followUpAnswers } = requestPayloadSchema.parse(sanitized);

    // Cache lookup
    const cacheKey = createPayloadKey('plan-gen-v2', { intake, followUpAnswers });
    const cachedPlan = planGenerationCache.get(cacheKey);
    if (cachedPlan) {
      return NextResponse.json(cachedPlan, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const prompt = buildPlanGenerationPrompt(intake, followUpAnswers);
    const aiOutput = await callGeminiStructured(prompt, rawGeminiPlanSchema);

    const nowIso = new Date().toISOString();
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate capacity metrics
    const capacity = calculateCrowdCapacityMetrics(
      intake.venueAreaSqFt || (intake.eventType === 'Community Event' ? 25000 : 8000),
      intake.guestCount
    );

    // If community event and AI returned empty permits, supply gold-standard defaults
    let permits = aiOutput.permits;
    if (intake.eventType === 'Community Event' && (!permits || permits.length === 0)) {
      permits = getDefaultCommunityPermits();
    }

    // Default volunteer shifts if community event
    let volunteerShifts = aiOutput.volunteerShifts;
    if (intake.eventType === 'Community Event' && (!volunteerShifts || volunteerShifts.length === 0)) {
      volunteerShifts = [
        {
          id: 'vshift-1',
          role: 'Logistics & Setup',
          shiftTitle: 'Morning Infrastructure & Canopy Setup',
          requiredCount: 6,
          assignedVolunteers: [],
          startTime: '08:00',
          endTime: '13:00',
          notes: 'Assist with barricade alignment and shaded canopy placement.',
        },
        {
          id: 'vshift-2',
          role: 'Guest Check-In & Badging',
          shiftTitle: 'Public Entry & Information Desk',
          requiredCount: 4,
          assignedVolunteers: [],
          startTime: '10:00',
          endTime: '16:00',
          notes: 'Welcome visitors and distribute sustainable event brochures.',
        },
        {
          id: 'vshift-3',
          role: 'Crowd Safety & Flow',
          shiftTitle: 'Afternoon Flow & Exit Marshaling',
          requiredCount: 6,
          assignedVolunteers: [],
          startTime: '14:00',
          endTime: '20:00',
          notes: 'Keep egress routes clear and monitor perimeter safety.',
        },
      ];
    }

    const fullPlan: EventPlan = {
      id: planId,
      title: aiOutput.suggestedTitle || `${intake.styleCulture} ${intake.eventType}`,
      eventType: intake.eventType,
      city: intake.city,
      date: intake.date,
      guestCount: intake.guestCount,
      totalBudget: intake.totalBudget,
      currency: intake.currency,
      styleCulture: intake.styleCulture,
      nonNegotiables: intake.nonNegotiables,
      venueAreaSqFt: intake.venueAreaSqFt || 0,
      budget: {
        ...aiOutput.budget,
        costRebalancingSuggestions: aiOutput.budget.costRebalancingSuggestions || [],
        categories: aiOutput.budget.categories.map((c, idx) => ({
          ...c,
          id: c.id || `cat-${idx + 1}`,
          capLimit: c.capLimit || Math.round(c.targetEstimate * 1.15),
          actualSpent: 0,
        })),
      },
      timeline: aiOutput.timeline.map((t, idx) => ({
        ...t,
        id: t.id || `task-${idx + 1}`,
        completed: false,
      })),
      dayOfSchedule: (aiOutput.dayOfSchedule || []).map((s, idx) => ({
        ...s,
        id: s.id || `slot-${idx + 1}`,
        notes: s.notes || '',
        isCritical: s.isCritical ?? false,
      })),
      vendors: aiOutput.vendors.map((v, idx) => ({
        ...v,
        id: v.id || `vendor-${idx + 1}`,
        status: v.status || 'Lead',
        notes: v.notes || '',
        verifyWithVendorNotice: 'Verify with the vendor',
      })),
      permits: (permits || []).map((p, idx) => ({
        ...p,
        id: p.id || `permit-${idx + 1}`,
        referenceNumber: p.referenceNumber || '',
        feeAmount: p.feeAmount || 0,
        notes: p.notes || '',
        status: p.status || 'Not Started',
      })),
      volunteerShifts: (volunteerShifts || []).map((v, idx) => ({
        ...v,
        id: v.id || `vshift-${idx + 1}`,
        assignedVolunteers: v.assignedVolunteers || [],
        notes: v.notes || '',
      })),
      capacity,
      ideas: {
        ...aiOutput.ideas,
        menuPairings: aiOutput.ideas.menuPairings || [],
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      version: 1,
      isSavedExample: false,
    };

    const verifiedPlan = eventPlanSchema.parse(fullPlan);
    planGenerationCache.set(cacheKey, verifiedPlan);

    return NextResponse.json(verifiedPlan, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
