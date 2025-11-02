# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VHD** is a Next.js 15-based Progressive Web App for invoice and client management in service-based businesses. It provides comprehensive features for managing clients, invoices, job schedules, employee payroll, availability tracking, and route optimization.

**Key Technologies:** React 19, Next.js 15 (App Router), TypeScript 5.4, MongoDB + Mongoose, Clerk Authentication, Tailwind CSS

## Development Commands

```bash
# Start development server with Turbo mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run lint:types

# ESLint checks
npm run lint:eslint

# Optimization and integration tests
npm run test-optimization      # Test route optimization
npm run test-openroute         # Test OpenRoute integration

# Maintenance scripts
npm run cleanup-spaces         # Clean up leading spaces
npm run migrate-reminders      # Migrate reminders schema
npm run cloudinary:shrink      # Dry-run image optimization
npm run cloudinary:shrink:real # Actual image optimization
npm run cloudinary:shrink:fast # Fast optimization (skip verification)
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
- **Payments:** Integrated into invoice workflow
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

- **Use `fetch` API over axios** (explicit project convention)
- **Error Handling:** Check `response.ok` before parsing JSON
- **Reusable Logic:** Place in custom hooks when needed
- **Close to Consumption:** Keep fetch calls near where data is used

```typescript
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

if (!response.ok) throw new Error("Request failed");
const result = await response.json();
```

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
npm run lint:types

# Check ESLint rules
npm run lint:eslint
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
- Run `npm run lint:types` and `npm run lint:eslint` before committing
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

Key environment variables needed (from Clerk, MongoDB, Cloudinary, Postmark, OpenRoute):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `POSTMARK_API_TOKEN`
- `OPENROUTE_API_KEY`

## Debugging Tips

- **Type Errors:** Run `npm run lint:types` to catch TypeScript issues
- **Database Issues:** Verify `MONGODB_URI` is correct and accessible
- **API Failures:** Check browser DevTools Network tab for response status and body
- **Authentication Issues:** Verify Clerk keys are set and user has correct role in Clerk dashboard
- **PDF Generation Issues:** Check component props and data structure match @react-pdf/renderer requirements
- **Route Optimization:** Test with `npm run test-openroute` before deploying changes

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

- Route optimization tests: `npm run test-optimization`
- OpenRoute integration tests: `npm run test-openroute`
- Manual testing across desktop and mobile views (PWA-enabled)
- Edge cases: payment tracking, availability conflicts, timezone handling
