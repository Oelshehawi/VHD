---
description: Date handling guidelines - always display dates as stored without timezone conversion
---

# Date Handling Guidelines for VHD Project

## Critical Rule

Dates in this project should always be displayed **as stored** without using JavaScript `new Date()` constructor for display purposes, to avoid timezone shifts.

## Why This Matters

- The database stores dates in UTC or as ISO strings
- Using `new Date(dateString)` can shift the date by a day depending on the user's timezone
- For example, "2026-01-10" becomes "2026-01-09 16:00:00" in PST when parsed as a Date

## How to Display Dates Correctly

### ✅ Correct Approach

```typescript
// Parse date strings directly by splitting
const dateStr = "2026-01-10T00:00:00.000Z";
const datePart = dateStr.split("T")[0]; // "2026-01-10"
const [year, month, day] = datePart.split("-");

// Or use formatDateStringUTC() utility
import { formatDateStringUTC } from "@/app/lib/utils";
const displayDate = formatDateStringUTC(dateValue); // Returns "January 10, 2026"
```

### ❌ Avoid This

```typescript
// Don't use new Date() for display purposes
const date = new Date(dateString); // This may shift the date!
const formatted = date.toLocaleDateString(); // Wrong day possible
```

## Available Utility Functions

- `formatDateStringUTC(dateInput)` - Formats date as "January 10, 2026" without timezone conversion
- `formatDateToString(dateInput)` - Similar formatting, also timezone-safe

## When Calculating Future Dates

When calculating dates (e.g., reminders), extract year/month/day from the source date string first:

```typescript
const dateStr =
  invoice.dateIssued instanceof Date
    ? invoice.dateIssued.toISOString()
    : String(invoice.dateIssued);
const datePart = dateStr.split("T")[0] || dateStr;
const parts = datePart.split("-");
const baseYear = parseInt(parts[0], 10);
const baseMonth = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
const baseDay = parseInt(parts[2], 10);

// Now use these values to create a Date
const localDate = new Date(baseYear, baseMonth, baseDay);
```

## Summary

1. Always use `formatDateStringUTC()` for displaying dates
2. Never use `new Date(dateString)` when the exact calendar date matters
3. Parse date strings by splitting on "T" and "-" when you need year/month/day components
