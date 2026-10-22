/**
 * @fileoverview Complete Zod runtime schemas and TypeScript types for Utsav OS.
 * Governs intake validation, budget plans, milestone tasks, day-of run-of-show cues,
 * vendor procurement, community municipal permits, volunteer shifts, and risk registers.
 */

import { z } from 'zod';
import {
  EVENT_TYPES,
  TIMELINE_PHASES,
  VENDOR_STATUS_PIPELINE,
  VENDOR_STATUSES_FALLBACK,
  RISK_SEVERITIES,
  PERMIT_STATUSES,
  VOLUNTEER_ROLES,
  VendorStatus,
  TimelinePhase,
  RiskSeverity,
  PermitStatus,
  VolunteerRole,
} from './constants';

export type { VendorStatus, TimelinePhase, RiskSeverity, PermitStatus, VolunteerRole };
export {
  EVENT_TYPES,
  TIMELINE_PHASES,
  VENDOR_STATUS_PIPELINE,
  PERMIT_STATUSES,
  VOLUNTEER_ROLES,
};

export const currencyCodeSchema = z.enum([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'CAD',
  'AUD',
]);

/**
 * Intake form validation schema
 */
export const intakeFormSchema = z.object({
  eventType: z.enum(EVENT_TYPES, {
    errorMap: () => ({ message: 'Please select an event type (Wedding, Birthday, or Community Event)' }),
  }),
  city: z
    .string()
    .trim()
    .min(2, 'City name must be at least 2 characters')
    .max(80, 'City name cannot exceed 80 characters'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please provide a valid date format (YYYY-MM-DD)')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid calendar date' }),
  guestCount: z.coerce
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int('Guest count must be an integer')
    .min(2, 'Guest count must be at least 2')
    .max(50000, 'Guest count exceeds maximum supported size (50,000)'),
  totalBudget: z.coerce
    .number({ invalid_type_error: 'Total budget must be a number' })
    .positive('Budget must be greater than zero')
    .max(1000000000, 'Budget exceeds supported limit'),
  currency: currencyCodeSchema.default('INR'),
  styleCulture: z
    .string()
    .trim()
    .min(2, 'Style or culture description must be at least 2 characters')
    .max(300, 'Style or culture cannot exceed 300 characters'),
  nonNegotiables: z
    .string()
    .trim()
    .max(500, 'Non-negotiables cannot exceed 500 characters')
    .default(''),
  venueAreaSqFt: z.coerce
    .number()
    .nonnegative()
    .optional()
    .default(0),
});

export type IntakeFormData = z.infer<typeof intakeFormSchema>;

/**
 * Follow-up question schema
 */
export const followUpResponseSchema = z.object({
  needsFollowUp: z.boolean(),
  questionId: z.string().optional(),
  questionText: z.string().max(250).optional(),
  reason: z.string().max(200).optional(),
});

export type FollowUpResponse = z.infer<typeof followUpResponseSchema>;

/**
 * Budget Category item schema with caps & variance monitoring
 */
export const budgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  minEstimate: z.number().nonnegative(),
  maxEstimate: z.number().nonnegative(),
  targetEstimate: z.number().nonnegative(),
  capLimit: z.number().nonnegative().optional(),
  actualSpent: z.number().nonnegative().default(0),
  notes: z.string().max(300),
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

export const budgetPlanSchema = z.object({
  categories: z.array(budgetCategorySchema).min(3).max(15),
  contingencyPercent: z.number().min(0).max(30),
  taxServiceChargePercent: z.number().min(0).max(30),
  statedAssumptions: z.array(z.string().max(250)).min(1).max(10),
  costRebalancingSuggestions: z.array(z.string().max(300)).optional().default([]),
});

export type BudgetPlan = z.infer<typeof budgetPlanSchema>;

/**
 * Long-Term Timeline Task Schema with conflict tracking
 */
export const timelineTaskSchema = z.object({
  id: z.string(),
  phase: z.enum(TIMELINE_PHASES),
  title: z.string().min(2).max(150),
  description: z.string().max(300),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  owner: z.string().max(60),
  estimatedCostLink: z.string().max(100).optional(),
  completed: z.boolean().default(false),
  daysBeforeEvent: z.number().int(),
  dependencies: z.array(z.string()).optional(),
  conflictWarning: z.string().optional(),
});

export type TimelineTask = z.infer<typeof timelineTaskSchema>;

/**
 * Minute-by-Minute Day-of Run-of-Show Slot Schema
 */
export const dayOfScheduleSlotSchema = z.object({
  id: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format (e.g. 09:30)'),
  durationMinutes: z.number().int().positive(),
  activityTitle: z.string().min(2).max(120),
  location: z.string().max(100),
  leadPerson: z.string().max(80),
  vendorRole: z.string().max(80).optional(),
  notes: z.string().max(250).default(''),
  isCritical: z.boolean().default(false),
});

export type DayOfScheduleSlot = z.infer<typeof dayOfScheduleSlotSchema>;

/**
 * Vendor Checklist & Contract Analyzer item schema
 */
export const vendorItemSchema = z.object({
  id: z.string(),
  categoryName: z.string().min(2).max(100),
  vendorTypeDescription: z.string().max(300),
  status: z.enum(VENDOR_STATUSES_FALLBACK).default('Lead'),
  quoteAmount: z.number().nonnegative().optional(),
  contractedAmount: z.number().nonnegative().optional(),
  contractTermsSummary: z.string().max(400).optional(),
  questionsToAsk: z.array(z.string().max(250)).min(2).max(6),
  verifyWithVendorNotice: z.string().default('Verify with the vendor'),
  notes: z.string().max(300).default(''),
});

export type VendorItem = z.infer<typeof vendorItemSchema>;

/**
 * Community Event: Municipal & Safety Permit Schema
 */
export const communityPermitSchema = z.object({
  id: z.string(),
  permitType: z.string().min(2).max(100),
  authorityName: z.string().min(2).max(100),
  requiredByDaysBefore: z.number().int(),
  status: z.enum(PERMIT_STATUSES).default('Not Started'),
  referenceNumber: z.string().max(60).default(''),
  feeAmount: z.number().nonnegative().default(0),
  notes: z.string().max(300).default(''),
});

export type CommunityPermit = z.infer<typeof communityPermitSchema>;

/**
 * Community Event: Volunteer Role & Shift Schema
 */
export const volunteerShiftSchema = z.object({
  id: z.string(),
  role: z.enum(VOLUNTEER_ROLES),
  shiftTitle: z.string().min(2).max(100),
  requiredCount: z.number().int().positive(),
  assignedVolunteers: z.array(z.string().max(60)).default([]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().max(300).default(''),
});

export type VolunteerShift = z.infer<typeof volunteerShiftSchema>;

/**
 * Community Event: Crowd Capacity & Safety Metrics Schema
 */
export const capacityMetricsSchema = z.object({
  venueAreaSqFt: z.number().nonnegative(),
  maxSafeOccupancy: z.number().int().nonnegative(),
  plannedGuestCount: z.number().int().positive(),
  densitySqFtPerGuest: z.number().nonnegative(),
  safetyStatus: z.enum(['Safe', 'Nearing Capacity', 'Exceeds Safety Threshold']),
  recommendations: z.array(z.string().max(250)),
});

export type CapacityMetrics = z.infer<typeof capacityMetricsSchema>;

/**
 * Personalized Ideas Schema
 */
export const personalizedIdeasSchema = z.object({
  themes: z.array(z.string().max(150)).min(1).max(5),
  dietaryNotes: z.array(z.string().max(200)).min(1).max(6),
  activities: z.array(z.string().max(200)).min(1).max(8),
  decor: z.array(z.string().max(200)).min(1).max(8),
  invitationSample: z.string().max(800).optional(),
  menuPairings: z.array(z.string().max(200)).optional().default([]),
});

export type PersonalizedIdeas = z.infer<typeof personalizedIdeasSchema>;

/**
 * Master Event Plan Schema
 */
export const eventPlanSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(120),
  eventType: z.enum(EVENT_TYPES),
  city: z.string(),
  date: z.string(),
  guestCount: z.number(),
  totalBudget: z.number(),
  currency: currencyCodeSchema,
  styleCulture: z.string(),
  nonNegotiables: z.string(),
  venueAreaSqFt: z.number().nonnegative().default(0),
  budget: budgetPlanSchema,
  timeline: z.array(timelineTaskSchema).min(4),
  dayOfSchedule: z.array(dayOfScheduleSlotSchema).default([]),
  vendors: z.array(vendorItemSchema).min(3),
  permits: z.array(communityPermitSchema).default([]),
  volunteerShifts: z.array(volunteerShiftSchema).default([]),
  capacity: capacityMetricsSchema.optional(),
  ideas: personalizedIdeasSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().default(1),
  isSavedExample: z.boolean().default(false),
});

export type EventPlan = z.infer<typeof eventPlanSchema>;

/**
 * Replanning request & diff schemas
 */
export const replanRequestSchema = z.object({
  currentPlan: eventPlanSchema,
  changes: z.object({
    totalBudget: z.number().positive().optional(),
    guestCount: z.number().int().positive().optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    modifiedCategory: z
      .object({
        categoryId: z.string(),
        newTargetEstimate: z.number().nonnegative(),
      })
      .optional(),
  }),
});

export type ReplanRequest = z.infer<typeof replanRequestSchema>;

export const replanDiffResponseSchema = z.object({
  summaryOfChanges: z.string().max(300),
  why: z.string().max(500),
  tradeOffOptions: z.array(z.string().max(300)).min(1).max(5),
  affectedBudgetCategories: z.array(budgetCategorySchema),
  affectedTimelineTasks: z.array(timelineTaskSchema),
  newContingencyPercent: z.number().min(0).max(30).optional(),
});

export type ReplanDiffResponse = z.infer<typeof replanDiffResponseSchema>;

/**
 * Risk Assessment Item schema
 */
export const riskItemSchema = z.object({
  id: z.string(),
  category: z.enum([
    'Dependencies',
    'Weather & Season',
    'Permits & Legal',
    'Dietary & Accessibility',
    'Payment Deadlines',
    'Single Point of Failure',
  ]),
  severity: z.enum(RISK_SEVERITIES),
  potentialIssue: z.string().max(250),
  rootCause: z.string().max(300),
  mitigationTask: z.string().max(300),
});

export type RiskItem = z.infer<typeof riskItemSchema>;

export const riskRegisterSchema = z.object({
  risks: z.array(riskItemSchema).min(3).max(12),
  assessedAt: z.string(),
});

export type RiskRegister = z.infer<typeof riskRegisterSchema>;

/**
 * Vendor Quote Comparison Schema
 */
export const vendorQuoteComparisonSchema = z.object({
  vendorCategory: z.string(),
  quotes: z.array(
    z.object({
      bidderLabel: z.string(),
      amount: z.number().nonnegative(),
      includedServices: z.array(z.string()),
      risksOrOmissions: z.array(z.string()),
      rating: z.enum(['Recommended', 'Acceptable', 'High Risk']),
    })
  ),
  aiRecommendation: z.string(),
  suggestedNegotiationPoints: z.array(z.string()),
});

export type VendorQuoteComparison = z.infer<typeof vendorQuoteComparisonSchema>;
