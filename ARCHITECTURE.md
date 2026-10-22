# Architecture Specification — Utsav OS

This document provides a deep dive into the software architecture, deterministic engines, security guarantees, and GenAI integration of **Utsav OS**.

---

## 1. Architectural Philosophy: The Hybrid Deterministic Model

A common pitfall in GenAI applications is relying on Large Language Models to calculate arithmetic (budgets, sums, variances) and temporal logic (calendar date reflow, dependency chains, overlap detection). LLMs hallucinate numbers and miss edge-case constraints.

**Utsav OS** implements a **Hybrid Architecture**:

1. **GenAI Layer:** Synthesizes creative concepts, vendor interview questions, culinary pairings, risk identification, and qualitative schedule activities.
2. **Deterministic Core:** All mathematical totals, variance alerts, category cap enforcement, date reflow, conflict detection, staffing deficit checks, and life safety crowd capacity metrics are executed by pure, unit-tested TypeScript engines.

```
+-------------------------------------------------------------+
|                      User Interface                         |
|   (Next.js 14 App Router, Tailwind CSS, Lucide Icons)       |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  Plan Context State Manager                 |
|   - Immutable Version History & Checkpoint Stack            |
|   - Real-Time Live Announcer (WCAG aria-live)               |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    Secure API Gateway                       |
|   - In-Memory Token Bucket Rate Limiter (extractClientIp)   |
|   - DOMPurify XSS Sanitization                              |
|   - Zod Schema Validation & Boundary Guard                  |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|  Deterministic Core   |             |   GenAI Proxy Engine  |
|  - budget-engine.ts   |             |   - gemini.ts         |
|  - timeline-engine.ts |             |   - prompts.ts        |
|  - vendor-engine.ts   |             |   - Delimited Inputs  |
|  - community-engine.ts|             |   - SSE Streaming     |
+-----------------------+             +-----------------------+
```

---

## 2. Deterministic Engines Breakdown

### 2.1 Budget Engine (`src/lib/budget-engine.ts`)

- **Ledger Invariants:** Computes `totalMinEstimate`, `totalMaxEstimate`, `totalTargetEstimate`, and `totalActualSpent`.
- **Variance Analysis:** Measures target estimate vs total budget, and actual expenditure vs hard category caps.
- **Severity Flagging:** Categorizes budget variance into `None`, `Warning`, or `Critical` status.
- **Cost-Rebalancing:** Algorithmically suggests category trimming strategies to absorb unexpected overages without compromising non-negotiables.

### 2.2 Timeline Engine (`src/lib/timeline-engine.ts`)

- **Relative Date Reflow:** Tasks specify `daysBeforeEvent`. When the event date changes, all milestones reflow deterministically.
- **Prerequisite Dependency Detection:** Graph traversal identifies tasks scheduled to complete after dependent tasks.
- **Run-of-Show Overlaps:** Validates minute-by-minute day-of schedules (`start_time + duration`) to prevent concurrent vendor access to shared staging areas.
- **Calendar Exporters:**
  - Standard RFC 5545 iCalendar (`.ics`) format generation.
  - Formatted CSV exporter.
  - JSON state snapshot exporter.

### 2.3 Vendor Pipeline & Contract Analyzer (`src/lib/vendor-engine.ts`)

- **4-Stage Pipeline Machine:** `Lead` ➔ `Quoted` ➔ `Signed` ➔ `Paid`.
- **Contract Risk Scoring:** Parses contract terms for cancellation policy clauses, milestone payment terms, liability insurance, and dispute resolution.
- **Quote Dispersion:** Calculates variance between competing vendor bids against category budget targets.

### 2.4 Community Event Engine (`src/lib/community-engine.ts`)

- **Municipal Permitting Matrix:** Real-world checklist tracking:
  - _Public Ground / Venue Clearance_ (e.g. BBMP / Municipal Authority)
  - _Law & Order / Loudspeaker Licensing_ (City Police)
  - _Fire Safety & NOC_ (Fire & Emergency Services)
  - _Food Safety Registration_ (FSSAI)
- **Volunteer Shift & Deficit Engine:** Aggregates required staffing against volunteer roster sign-ups, computing active deficits across 6 functional roles.
- **Crowd Capacity & Life Safety:** Adheres to NFPA 101 / National Building Code standards:
  - Net usable floor calculation (`venueAreaSqFt * 0.70`).
  - Occupancy density (`netSqFt / guestCount`).
  - Safety classification: `Safe` (>= 15 sq ft/person), `Nearing Capacity` (10–14.9 sq ft/person), or `Exceeds Safety Threshold` (< 10 sq ft/person).

---

## 3. GenAI Integration & Streaming SSE

### 3.1 Prompt Isolation & Guardrails

All prompts in `src/lib/prompts.ts` strictly wrap user data in delimiters:

```
<<<USER_INPUT_DATA>>>
Event Type: Community Event
City: Bengaluru
Budget: 500000 INR
Non-Negotiables: Zero-waste policy, eco-friendly stalls
<<<END_USER_INPUT_DATA>>>
```

System instructions enforce that any attempt within `<<<USER_INPUT_DATA>>>` to alter the system prompt or output format is ignored.

### 3.2 Server-Sent Events (SSE) Streaming Assistant

The route `src/app/api/plan/stream-assistant/route.ts` provides real-time chunked responses using native HTTP streaming:

```ts
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of textStream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    controller.close();
  },
});
```

---

## 4. Accessibility (WCAG 2.1 AA) Architecture

1. **Roving Tabindex & Modal Focus Traps:**
   - On modal activation, previous focus is captured via `useRef`.
   - All <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> keyboard events loop strictly between focusable elements.
   - <kbd>Escape</kbd> closes modal and restores prior focus.
2. **Screen Reader Notification Bus:**
   - Centralized `announce(message)` utility dispatches messages to an off-screen `div` marked with `aria-live="polite"` and `role="status"`.
3. **Contrast & Theme Tokenization:**
   - Dual theme system (Light & Dark) using HSL CSS variables configured for >= 4.5:1 text-to-background contrast ratios.

---

## 5. Component Modularity & UI Hardening Architecture

### 5.1 Atomic UI Deconstruction (`src/components/ui-sub/`)

To achieve peak modularity, single-responsibility separation, and maintainability, workspace view tabs are deconstructed into atomic, testable sub-components:

- `BudgetStatCard`: Key metric cards with trend indicators and accessible ARIA attributes.
- `BudgetStackedBar`: Visual financial allocation bar with proportional segment dividers and legend.
- `BudgetCategoryRow`: Ledger row handling target estimation, spend tracking, and cap overages.
- `PermitRow`: Municipal permit checklist item with authority details and status selectors.
- `VolunteerShiftCard`: Shift schedule card displaying roster badges, staffing deficit warnings, and volunteer assignment inputs.
- `CapacityMeter`: Real-time NFPA 101 crowd safety density gauge with dynamic recommendations.
- `MilestoneTaskItem`: Long-term planning task card with checkbox toggling and metadata tags.
- `DayOfSlotRow`: Chronological cue in the minute-by-minute master run-of-show.
- `VendorPipelineCard`: 4-stage procurement stage card with automated contract clause risk scoring.

### 5.2 Stateless Pure Mathematical Utilities (`src/lib/ui-math.ts`)

Inline arithmetic calculations are extracted into pure, stateless utilities with strict TSDoc:

- `calculateCommitmentPercent`: Safely calculates budget commitment without floating-point drift.
- `calculateCategoryProgressPercent`: Clamps spend ratios cleanly between 0 and 100%.
- `calculateShiftDeficit`: Computes exact missing volunteer headcounts.
- `calculateStaffingFillRatio`: Computes roster fill percentage.
- `clampPercentage`: Bounded range clamping with strict boundary range validation.

### 5.3 Error Boundaries & Graceful Degradation (`src/components/error-boundary.tsx`)

The application is wrapped with a React `ErrorBoundary` supporting:

- Accessible WCAG-compliant alert notifications (`role="alert"`, `aria-live="assertive"`).
- Fault isolation preventing single-component rendering bugs from crashing the root shell.
- Interactive retry recovery triggers and local storage safety preservation.
