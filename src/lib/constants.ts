/**
 * @fileoverview Utsav OS - Master domain constants, currencies, enum arrays,
 * and WCAG accessibility guidelines metadata.
 */

export const APP_NAME = 'Utsav OS';
export const APP_TAGLINE = 'The Autonomous Celebration & Event Planning Engine';
export const APP_ONE_LINER =
  'Utsav OS delivers deterministic budget intelligence, day-of minute-by-minute run-of-shows, vendor contract analysis, community permits & volunteer coordination, and real-time streaming GenAI ideation.';

export const DEFAULT_CURRENCY = 'INR';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
};

export const EVENT_TYPES = ['Wedding', 'Birthday', 'Community Event'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Vendor procurement pipeline
export const VENDOR_STATUS_PIPELINE = ['Lead', 'Quoted', 'Signed', 'Paid'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES_FALLBACK)[number];
export const VENDOR_STATUSES_FALLBACK = [
  'Lead',
  'Quoted',
  'Signed',
  'Paid',
  'Shortlisted',
  'Contacted',
  'Booked',
] as const;

// Long term milestone phases
export const TIMELINE_PHASES = [
  'Now',
  'Next 7 days',
  'Next 30 days',
  'Event week',
  'Event day',
] as const;
export type TimelinePhase = (typeof TIMELINE_PHASES)[number];

// Risk severity levels
export const RISK_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

// Community Permit Statuses
export const PERMIT_STATUSES = [
  'Not Started',
  'Application Filed',
  'In Review',
  'Approved',
  'Exempt',
] as const;
export type PermitStatus = (typeof PERMIT_STATUSES)[number];

// Volunteer Shift Statuses
export const VOLUNTEER_ROLES = [
  'Logistics & Setup',
  'Guest Check-In & Badging',
  'Hospitality & F&B Assist',
  'Stage & Audio-Visual',
  'Crowd Safety & Flow',
  'First Aid & Emergency',
] as const;
export type VolunteerRole = (typeof VOLUNTEER_ROLES)[number];

export interface EventPreset {
  id: string;
  title: string;
  eventType: EventType;
  defaultCity: string;
  suggestedGuests: number;
  suggestedBudget: number;
  styleCulture: string;
  nonNegotiables: string;
  description: string;
  venueAreaSqFt?: number;
}

export const EVENT_PRESETS: EventPreset[] = [
  {
    id: 'royal-wedding',
    title: 'Heritage Palace Wedding',
    eventType: 'Wedding',
    defaultCity: 'Jaipur',
    suggestedGuests: 400,
    suggestedBudget: 3500000,
    styleCulture: 'Royal Rajasthani Heritage with Sangeet, Mehendi, & Pheras',
    nonNegotiables:
      'Authentic Marwari feast, live acoustic folk troupe, eco-friendly floral decor, 100% vegetarian counter',
    description:
      'Multi-day celebratory wedding blending royal architecture, regional traditions, and coordinated hospitality.',
    venueAreaSqFt: 18000,
  },
  {
    id: 'milestone-birthday',
    title: '50th Golden Milestone Celebration',
    eventType: 'Birthday',
    defaultCity: 'Mumbai',
    suggestedGuests: 120,
    suggestedBudget: 450000,
    styleCulture: 'Elegant Retro Jazz & Speakeasy Gala',
    nonNegotiables:
      'Custom retrospective video montage, curated mocktail/cocktail pairings, gluten-free dessert bar',
    description:
      'Sophisticated evening birthday gathering with live jazz, memory wall, and personalized guest keepsakes.',
    venueAreaSqFt: 3500,
  },
  {
    id: 'eco-community-carnival',
    title: 'Community Eco-Festival & Cultural Fair',
    eventType: 'Community Event',
    defaultCity: 'Bengaluru',
    suggestedGuests: 1200,
    suggestedBudget: 800000,
    styleCulture: 'Zero-Waste Sustainable Folk Fair with Artisan Stalls and Solar Stage',
    nonNegotiables:
      'BBMP municipal waste permit, certified sound barrier at 10 PM, volunteer first-aid post, 100% compostable cutlery',
    description:
      'Public civic celebration featuring local artisans, community performances, waste segregation stations, and family workshops.',
    venueAreaSqFt: 30000,
  },
];

export const PLANNER_DISCLAIMER =
  'Notice: All figures and recommendations are planning estimates computed for organizational purposes. Utsav OS does not execute automated contractual commitments or disburse financial funds. Always review physical contracts with licensed vendors and regulatory authorities.';
