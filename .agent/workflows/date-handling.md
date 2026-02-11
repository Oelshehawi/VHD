---
description: Date handling guidelines - how dates are stored and displayed, and when timezone conversion is needed
---

# Date Handling Guidelines for VHD Project

## How Dates Are Actually Stored

This project has two categories of dates with different storage conventions:

### 1. Date-Only Fields (invoices, due dates, payroll periods)

Stored as **midnight UTC** — e.g. `2026-01-10T00:00:00.000Z` for January 10th.

These represent calendar dates, not moments in time. Display them by extracting the date string directly — never by constructing a `Date` and calling `toLocaleDateString()`, which can shift the day.

### 2. DateTime Fields (schedule start times)

Stored as **PST/PDT wall-clock values baked into UTC** — e.g. a job at 8:00 AM PST is stored as `2026-02-10T08:00:00Z`.

This is **not** real UTC. The UTC components hold the intended Vancouver local time. This convention is baked throughout the save pipeline (`EditJobModal.tsx`, `AddJob.tsx` use `Date.UTC(year, month, day, localHour, ...)`).

## Display Pipeline

### Date-Only Fields

Use `formatDateStringUTC()` or parse the ISO string directly:

```typescript
import { formatDateStringUTC } from "@/app/lib/utils";
const displayDate = formatDateStringUTC(dateValue); // "January 10, 2026"

// Or parse manually
const datePart = dateStr.split("T")[0]; // "2026-01-10"
```

### DateTime Fields (Schedule)

The display pipeline works via a deliberate round-trip:

1. **Server** (`scheduleAndShifts.ts`): `.toLocaleString("en-US", { timeZone: "UTC" })` extracts the fake-UTC components as a string → `"2/10/2026, 8:00:00 AM"`
2. **Client**: `new Date("2/10/2026, 8:00:00 AM")` re-parses as local time → displays `8:00 AM`

This works because steps 1 and 2 cancel each other out. Do not change this pipeline without a full migration plan.

## When External APIs Need Real UTC

External services (Google Routes API, etc.) interpret ISO timestamps as real UTC. Passing fake-UTC values gives wrong results (e.g. Google would estimate midnight traffic instead of 8 AM traffic).

Use `fakeUtcToRealUtc()` from `app/lib/actions/travelTime.actions.ts`:

```typescript
// Converts fake-UTC (PST-as-UTC) to real UTC instant
// 2026-02-10T08:00:00Z (8am PST) → 2026-02-10T16:00:00Z (real UTC)
const realUtc = fakeUtcToRealUtc(job.startDateTime);
```

This uses `fromZonedTime` from `date-fns-tz` with `America/Vancouver`, so DST is handled correctly.

**Only needed when communicating with external APIs.** Internal sorting, gap calculations, and display all work correctly with fake-UTC values since the offset cancels out.

## Rules by Context

| Context | Use `new Date()`? | Notes |
|---|---|---|
| Date-only display | No | Use `formatDateStringUTC()` or string parsing |
| Schedule time display | Yes (client-side) | The round-trip pipeline handles it |
| Sorting / comparing jobs | Yes | Relative ordering is correct with fake-UTC |
| Gap arithmetic (same day) | Yes | Relative durations are correct |
| External APIs (Google, etc.) | Convert first | Use `fakeUtcToRealUtc()` |
| Date arithmetic for reminders | Extract parts | Use `parseDateParts()` + `toUtcDateFromParts()` |

## Available Utility Functions

- `formatDateStringUTC(dateInput)` — Formats date as "January 10, 2026" without timezone conversion
- `parseDateParts(dateInput)` — Extracts year/month/day from Date or string (timezone-safe)
- `toUtcDateFromParts(parts)` — Creates UTC Date from parts
- `fakeUtcToRealUtc(isoString)` — Converts fake-UTC schedule datetime to real UTC for external APIs
