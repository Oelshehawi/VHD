# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VHD** is a Next.js 16-based Progressive Web App for invoice and client management in service-based businesses. It provides comprehensive features for managing clients, invoices, job schedules, employee payroll, availability tracking, and route optimization.

**Key Technologies:** React 19.2, Next.js 16 (App Router), TypeScript 5.4, MongoDB + Mongoose, Clerk Authentication, Tailwind CSS 4, Stripe Payments

**Package Manager:** This project uses **pnpm** (not npm). Always use pnpm for installing dependencies and running scripts.

## Business Context

**Service:** Kitchen hood exhaust cleaning for commercial kitchens
**Location:** British Columbia, Canada
**Timezone:** Pacific Time (UTC-7 / UTC-8 during DST)

### Regulatory Notes
- **Credit card surcharge cap:** 2.4% maximum (Canadian federal regulation)
- **GST:** 5% (BC has no PST on services)

## Development Commands

```bash
# Start development server with Turbo mode
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Type checking (run after making changes)
pnpm run lint:types

# ESLint checks
pnpm run lint:eslint

# Install dependencies
pnpm install

# Optimization and integration tests
pnpm run test-optimization      # Test route optimization
pnpm run test-openroute         # Test OpenRoute integration

# Maintenance scripts
pnpm run cleanup-spaces         # Clean up leading spaces
pnpm run migrate-reminders      # Migrate reminders schema
pnpm run cloudinary:shrink      # Dry-run image optimization
pnpm run cloudinary:shrink:real # Actual image optimization
pnpm run cloudinary:shrink:fast # Fast optimization (skip verification)
```

## High-Level Architecture

### Core Structure

- **`app/`** - Next.js App Router with route groups and pages
- **`_components/`** - 100+ reusable React components organized by feature
- **`app/lib/`** - Business logic, server actions, data fetchers, utilities, and database connection
- **`pages/api/`** - API routes using Pages Router pattern (kebab-case folders with `index.ts`)
- **`models/`** - Mongoose schemas (single comprehensive schema file: `reactDataSchema.ts`)

### Route Organization

The app uses Next.js route groups to organize authentication contexts:

```
app/
  (root)/                    # Authenticated routes for managers/employees
    dashboard/, invoices/, estimates/, schedule/, payroll/, etc.
  (publicGroup)/             # Public routes
    sign-in/
  (clientPortal)/            # Client-specific routes
    client-portal/
```

Authentication is handled by Clerk via middleware that detects user role and redirects accordingly.

### Component Organization

Components are organized in `_components/` by feature domain:

- **Containers** (e.g., `ClientDetailedContainer.tsx`) - Handle data fetching and state
- **Components** (e.g., `InvoiceRow.tsx`) - Presentational UI components
- **Modals** (e.g., `EditClientModal.tsx`) - Dialog components
- **Layout components** - Navigation, sidebars, shared layouts

**Naming Convention:** PascalCase for all component files (e.g., `InvoiceDetailsContainer.tsx`)

### Data Flow Architecture

1. **Server Components** fetch data in `app/` pages using data fetchers from `app/lib/data*.ts`
2. **Suspense boundaries** with skeleton loaders for concurrent rendering
3. **Server Actions** in `app/lib/actions/` handle mutations (CRUD operations)
4. **API Routes** in `pages/api/` for external integrations (email, webhooks, cron jobs)
5. **Mongoose Models** in `models/reactDataSchema.ts` define database schemas
6. **TypeScript interfaces** in `app/lib/typeDefinitions.ts` match database structures

### Key Services

- **Authentication:** Clerk (email/password with role-based access)
- **Database:** MongoDB with Mongoose ODM
- **Email:** Postmark (sending invoices, notifications)
- **Image Storage:** Cloudinary (before/after photos, optimization)
- **Route Optimization:** OpenRoute Service API (scheduling algorithm)
- **PDF Generation:** @react-pdf/renderer (invoices, receipts, reports)
- **Payments:** Stripe (credit card and PAD payments, client-facing payment page, webhook handling)
- **Analytics:** Vercel Analytics and Speed Insights

### Server Actions Pattern

Server actions are organized by domain in `app/lib/actions/`:

- `actions.ts` - Core CRUD for clients, invoices, estimates
- `availability.actions.ts` - Employee availability management
- `email.actions.ts` - Sending emails
- `estimates.actions.ts` - Estimate operations
- `optimization.actions.ts` - Route optimization requests
- `reminder.actions.ts` - Reminder processing
- `scheduleJobs.actions.ts` - Job scheduling
- `stripe.actions.ts` - Stripe payment processing


## Key Code Patterns and Conventions

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- **Component Props** - Always define interfaces: `interface ComponentNameProps { ... }`
- **API Response Types** - Create types for all responses, including errors
- **Null Safety** - Use optional chaining (`?.`) and strict null checks

### Data Fetching

#### Server Components (Async Functions)

- **Close to Consumption:** Keep fetch calls near where data is used

```typescript
// Server Component - async function
export const DashboardPage = async () => {
  const data = await fetchServerData();
  return <ClientComponent data={data} />;
};
```


### Form Handling

- Use **React Hook Form** for all form management
- Validation via form state and TypeScript types
- Submit via Server Actions for mutations

### Styling

- **Tailwind CSS** with custom color palette (darkGreen, darkGray, blue, pink, indigo)
- **Framer Motion** for animations
- Prettier plugin for Tailwind class sorting


### Code Quality Verification

**After making changes, always run these checks before committing:**

```bash
# Check TypeScript types
pnpm run lint:types

# Check ESLint rules
pnpm run lint:eslint
```

Both checks must pass before committing. Fix any errors reported by these tools. This ensures:

- Type safety with strict TypeScript checking
- Code style consistency
- Potential bugs caught early
-

## Important Architectural Considerations

### Authentication & Authorization

- **Clerk** handles user authentication
- Three user types: Managers (full access), Employees (limited access), Client Portal Users
- Role detection in middleware routes requests to appropriate dashboard
- Use `auth()` in server components to check user claims

### Database Considerations

- Single MongoDB connection manager in `app/lib/connect.ts`
- All schemas in `app/lib/models/reactDataSchema.ts`
- Mongoose handles connection pooling
- TypeScript interfaces mirror schema structure

### Route Optimization

- **OpenRoute Service** for scheduling optimization
- Rate-limited API calls to avoid quota issues
- Caching of geocodes and distance matrices to minimize API usage
- Optimization algorithm in `app/lib/schedulingOptimizations/`

### Scheduled Tasks

- Daily cron job at 16:00 UTC (`/api/cron/process-reminders`)
- Reminder processing: sends due date notifications
- Configured in `vercel.json` for production

### Performance

- **Lazy loading** for components to reduce bundle size
- **Image optimization** with Cloudinary
- **Suspense** for concurrent rendering
- React memoization techniques for expensive components
- Debouncing for search/filter inputs

## Common Development Scenarios

### Adding a New Feature

1. Create components in `_components/[feature]/`
2. Add page(s) in `app/(root)/[feature]/`
3. Create server action in `app/lib/actions/[feature].actions.ts` if needed
4. Add API route in `pages/api/[feature-name]/` if external integration needed
5. Update database schema in `models/reactDataSchema.ts` if data model needed
6. Define types in `app/lib/typeDefinitions.ts`

### Working with Invoices

- Invoice generation uses `@react-pdf/renderer`
- PDF components in `_components/pdf/`
- Invoice data model includes itemized services, GST calculation, payment tracking
- Email delivery via Postmark server action

### Employee Availability

- Hourly and recurring availability patterns
- Time-off requests require 2+ weeks advance notice
- Availability affects scheduling algorithms
- Manager approval workflow for time-off

### Client Portal

- Route group `(clientPortal)` for client-specific pages

## Environment Variables

Key environment variables needed (from Clerk, MongoDB, Cloudinary, Postmark, OpenRoute, Stripe):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `POSTMARK_API_TOKEN`
- `OPENROUTE_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`


```

### Utility File Organization

Utilities are organized by domain in `app/lib/`:

- **`utils.ts`** - General utilities (formatting, pagination, calculations)
- **`utils/datePartsUtils.ts`** - Timezone-safe date parsing and calculations
- **`utils/timeFormatUtils.ts`** - 24hr ↔ 12hr time conversion
- **`utils/availabilityUtils.ts`** - Technician availability helpers
- **`imageUtils.ts`** - Cloudinary image handling
- **`clerkUtils.ts`** - User name caching

### Date Handling

**Important:** Use `parseDateParts()` + `toUtcDateFromParts()` from `utils/datePartsUtils` for persistence-sensitive date operations. Avoid `new Date(string)` which can cause timezone drift.

```typescript
// WRONG - can cause timezone drift in BC evenings
const date = new Date(); // 11 PM Jan 21 PST = Jan 22 in UTC

// CORRECT - use local date parts for "today"
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const parts = parseDateParts(todayStr);
const utcDate = parts ? toUtcDateFromParts(parts) : undefined;
```

### Available Utility Functions

- `formatDateStringUTC(dateInput)` - Formats date as "January 10, 2026" without timezone conversion
- `formatDateTimeStringUTC(dateInput)` - Formats date with time as "January 10, 2026 at 3:45 PM"
- `calculatePaymentDueDate(dateIssued)` - Returns a Date object 14 days after the issued date
- `parseDateParts(dateInput)` - Extracts year/month/day from Date or string (timezone-safe)
- `toUtcDateFromParts(parts)` - Creates UTC Date from parts
- `calculateDateDueFromParts(parts, frequency)` - Calculates invoice due date based on billing frequency
- `calculateNextReminderDateFromParts(parts, frequency)` - Calculates next payment reminder date

**ESLint Rule:** The codebase has an ESLint rule that warns against using `toLocaleDateString()`. Use the UTC-safe utilities above instead.

For more details, see the workflow: `.agent/workflows/date-handling.md`


