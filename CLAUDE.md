# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VHD** is a Next.js 16-based Progressive Web App for invoice and client management in service-based businesses. It provides comprehensive features for managing clients, invoices, job schedules, employee payroll, availability tracking, and route optimization.

**Key Technologies:** React 19.2, Next.js 16 (App Router), TypeScript 5.4, MongoDB + Mongoose, Clerk Authentication, Tailwind CSS 4, Stripe Payments

**Package Manager:** This project uses **pnpm** (not npm). Always use pnpm for installing dependencies and running scripts.

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

### API Route Organization

API routes use folder structure with `index.ts`:

- `pages/api/[kebab-case-name]/index.ts`
- Examples: `updateTechnicianNotes/`, `sendInvoice/`, `cloudinaryUpload/`
- Include auth checks at route start
- Return consistent JSON with proper HTTP status codes

## Key Code Patterns and Conventions

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- **Component Props** - Always define interfaces: `interface ComponentNameProps { ... }`
- **API Response Types** - Create types for all responses, including errors
- **Null Safety** - Use optional chaining (`?.`) and strict null checks

### Data Fetching

#### Server Components (Async Functions)

- **Call server functions directly** - they are "use server" by default
- **Error Handling:** Use try/catch or let errors propagate to Suspense boundaries
- **Close to Consumption:** Keep fetch calls near where data is used

```typescript
// Server Component - async function
export const DashboardPage = async () => {
  const data = await fetchServerData();
  return <ClientComponent data={data} />;
};
```

#### Client Components (with TanStack Query)

- **MUST use TanStack Query** for all data fetching in client components
- **Never call server functions during initial render** - creates fetch waterfalls and violates RSC contracts
- **Import and use `useQuery` hook** for caching, refetching, and loading states
- **Query keys must reference dependencies** - changes trigger refetches automatically

**Basic Pattern:**

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchServerFunction } from "@/app/lib/actions";

export function MyComponent({ filterValue, dateRange }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["myData", filterValue, dateRange], // Include all deps - triggers refetch on change
    queryFn: async () => {
      return await fetchServerFunction(filterValue, dateRange);
    },
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  return <div>{/* render data */}</div>;
}
```

**Advanced Pattern with Debouncing (for search/date inputs):**

```typescript
"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export function SearchableComponent() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search: 500ms delay before state updates
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 500);
  }, []);

  // Fetch uses debouncedSearch, not live input
  const { data, isLoading } = useQuery({
    queryKey: ["items", debouncedSearch],
    queryFn: async () => await searchItems(debouncedSearch),
  });

  return (
    <>
      <input value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} />
      {isLoading && <Skeleton />}
      {!isLoading && <Results data={data} />}
    </>
  );
}
```

**Date Picker Pattern (avoid refetch on arrow clicks):**

- Use `onBlur` instead of `onChange` on date inputs to prevent rapid refetches
- Debounce date changes (300ms) so only final date value triggers refetch
- Never refetch on native date picker arrow clicks

```typescript
const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const newDate = e.target.value;
  dateDebounceTimeoutRef.current = setTimeout(() => {
    setDate(newDate); // This state change triggers query refetch
  }, 300);
};

<input type="date" onBlur={handleDateBlur} />
```

**QueryProvider Setup (Required):**
The app requires a `QueryProvider` wrapper at the root to avoid serialization errors:

```typescript
// app/lib/QueryProvider.tsx (client component)
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// app/(root)/layout.tsx - use QueryProvider instead of QueryClientProvider
<QueryProvider>
  {children}
</QueryProvider>
```

#### Best Practices

- **Server Components**: Initial page loads, authentication, SEO-critical data
- **Client + TanStack Query**: User interactions, filters, dynamic parameters, tabs, modal data
- **Query Key Dependencies**: Always include filters, search, dates in queryKey - auto-triggers refetch
- **Loading States**: Show skeleton loaders during load, NOT "no data" messages
- **Debouncing**: Use timeouts for search (500ms) and date changes (300ms) to prevent excessive API calls
- **Pattern**: Server fetches initial data → passes to client → client uses TanStack for interactive updates
- **CRITICAL**: Never call server functions during client component render (violates RSC pattern)

### Component Structure

```typescript
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction?: (value: string) => void;
}

export default function ComponentName({ prop1, prop2, onAction }: ComponentNameProps) {
  return <div>{prop1}</div>;
}
```

### Form Handling

- Use **React Hook Form** for all form management
- Validation via form state and TypeScript types
- Submit via Server Actions for mutations

### Styling

- **Tailwind CSS** with custom color palette (darkGreen, darkGray, blue, pink, indigo)
- **Framer Motion** for animations
- Prettier plugin for Tailwind class sorting

## Development Workflow

### Before Making Changes

1. Understand the current codebase thoroughly
2. Plan complex tasks with clear, manageable steps
3. Identify dependencies and potential edge cases
4. Consider backward compatibility

### Implementation

1. Follow Single Responsibility Principle
2. Create new files when needed to maintain separation of concerns
3. Test changes incrementally
4. Ensure all TypeScript types are correctly defined
5. Use proper authentication/authorization checks in API routes

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
- Better code quality overall

### Git Practices

- Keep commits focused and descriptive
- Use conventional commit messages
- Commit related changes together
- Run `pnpm run lint:types` and `pnpm run lint:eslint` before committing
- Review changes before committing

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

- Separate authentication context via Clerk
- Limited view of invoices and reports
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

## Date Handling

**Critical Rule:** Dates in this project should always be displayed **as stored** without using JavaScript `new Date()` constructor for display purposes, to avoid timezone shifts.

### Why This Matters

- The database stores dates in UTC or as ISO strings
- Using `new Date(dateString)` can shift the date by a day depending on the user's timezone
- For example, "2026-01-10" becomes "2026-01-09 16:00:00" in PST when parsed as a Date

### Correct Approach

```typescript
// Use the utility function for displaying dates
import { formatDateStringUTC } from "@/app/lib/utils";
const displayDate = formatDateStringUTC(dateValue); // Returns "January 10, 2026"

// Or parse date strings directly by splitting
const dateStr = "2026-01-10T00:00:00.000Z";
const datePart = dateStr.split("T")[0]; // "2026-01-10"
const [year, month, day] = datePart.split("-");
```

### Avoid This

```typescript
// Don't use new Date() for display purposes - this may shift the date!
const date = new Date(dateString);
const formatted = date.toLocaleDateString(); // Wrong day possible
```

### Available Utility Functions

- `formatDateStringUTC(dateInput)` - Formats date as "January 10, 2026" without timezone conversion
- `formatDateToString(dateInput)` - Similar formatting, also timezone-safe

For more details, see the workflow: `.agent/workflows/date-handling.md`

## Debugging Tips

- **Type Errors:** Run `pnpm run lint:types` to catch TypeScript issues
- **Database Issues:** Verify `MONGODB_URI` is correct and accessible
- **API Failures:** Check browser DevTools Network tab for response status and body
- **Authentication Issues:** Verify Clerk keys are set and user has correct role in Clerk dashboard
- **PDF Generation Issues:** Check component props and data structure match @react-pdf/renderer requirements
- **Route Optimization:** Test with `pnpm run test-openroute` before deploying changes

## File Naming Conventions

- **Components:** PascalCase (`ComponentName.tsx`)
- **API Routes:** kebab-case in folder names (`api-route-name/`)
- **Server Actions:** camelCase (`actionName.ts`)
- **Data Fetchers:** descriptive camelCase (`clientData.ts`, `invoiceData.ts`)
- **Utilities:** camelCase (`utility.ts`)
- **Hooks:** camelCase starting with `use` (`useClientData.ts`)

## Recent Project Developments

Recent commits show focus on:

- Analytics and audit logging with user tracking
- Employee availability system improvements
- Invoice and schedule enhancements
- Mobile view optimizations (calendar month view on mobile)
- Technician location tracking
- Recent actions fetching for dashboards

## Testing

- Route optimization tests: `pnpm run test-optimization`
- OpenRoute integration tests: `pnpm run test-openroute`
- Manual testing across desktop and mobile views (PWA-enabled)
- Edge cases: payment tracking, availability conflicts, timezone handling
