# Copilot Instructions for VHD Codebase

**VHD** is a Next.js 15 Progressive Web App for invoice and client management in service-based businesses. This guide enables AI agents to be immediately productive.

## Quick Start Commands

```bash
pnpm dev                # Start dev server with HTTPS
pnpm build             # Production build
pnpm lint:types        # TypeScript check
pnpm lint:eslint       # ESLint check (ALWAYS run before committing)
pnpm test-openroute    # Test route optimization API
```

## Architecture at a Glance

### Route Organization
- **`app/(root)/`** — Authenticated manager/employee routes (dashboard, invoices, estimates, schedule, payroll)
- **`app/(publicGroup)/`** — Public routes (sign-in)
- **`app/(clientPortal)/`** — Client-specific portal routes
- Authentication via **Clerk** with role-based access; middleware redirects users based on role

### Code Structure
- **`_components/`** — 100+ reusable components organized by feature (invoices/, estimates/, dashboard/, etc.)
- **`app/lib/`** — Server actions (`actions/*.ts`), data fetchers (`data*.ts`), utilities, database connection
- **`pages/api/`** — API routes in kebab-case folders with `index.ts` (e.g., `pages/api/send-invoice/index.ts`)
- **`models/reactDataSchema.ts`** — Single MongoDB/Mongoose schema file for all data structures
- **`app/lib/typeDefinitions.ts`** — TypeScript interfaces mirroring database structures

### Data Flow Pattern
1. Server components fetch data via data fetchers from `app/lib/data*.ts`
2. Pass data to client components or direct to UI
3. Client components use **TanStack Query** for dynamic filtering, search, date changes
4. Server Actions in `app/lib/actions/*.ts` handle all mutations (CRUD)
5. External integrations (email, webhooks) via `pages/api/` routes

## Critical Patterns & Conventions

### Data Fetching Strategy
**Prefer RSC + passing data down:** Fetch data in server components and pass to client components. This is cleaner and more performant.

**Use TanStack Query when needed:** For user interactions (filters, search, date changes that require refetching), use TanStack Query with debouncing.

```typescript
// Server Component - Preferred approach
async function DashboardPage() {
  const data = await fetchItems();
  return <ClientComponent data={data} />;
}

// Client Component - For dynamic updates only
"use client";
import { useQuery } from "@tanstack/react-query";

export function FilterableList({ initialData, searchTerm, dateRange }) {
  // Only query when user changes filters/search
  const { data } = useQuery({
    queryKey: ["items", searchTerm, dateRange],
    queryFn: () => fetchItems(searchTerm, dateRange),
    initialData, // Use server data as initial state
  });

  return <ItemsList items={data} />;
}
```

### Debouncing Strategy
- **Search inputs**: 500ms delay before query refetch
- **Date pickers**: Use `onBlur` instead of `onChange`; 300ms debounce to avoid rapid refetches
- Pattern: Debounce user input → state change → query refetch with new queryKey

### Form Handling
- Use **React Hook Form** for all forms
- Submit via Server Actions (not fetch)
- Validation through form state + TypeScript types

### Component Naming & Organization
- **PascalCase** file names: `InvoiceDetailsContainer.tsx`, `EditClientModal.tsx`
- **Containers** handle data fetching (e.g., `ClientDetailedContainer.tsx`)
- **Components** are presentational (e.g., `InvoiceRow.tsx`)
- **Modals** for dialogs (e.g., `EditClientModal.tsx`)
- Group related components: `_components/invoices/`, `_components/estimates/`, etc.

### API Routes
- Folder structure: `pages/api/[kebab-case-name]/index.ts`
- Examples: `pages/api/send-invoice/index.ts`, `pages/api/update-technician-notes/index.ts`
- Check auth at route start using `auth()` or headers
- Return consistent JSON with appropriate HTTP status codes
- Use native `fetch` API in client; avoid axios

### Server Actions Pattern
- Organized by domain in `app/lib/actions/`
- Examples: `actions.ts` (core CRUD), `email.actions.ts`, `estimates.actions.ts`, `optimization.actions.ts`
- Handle all mutations (create, update, delete)
- Always validate input and check authentication
- Use in forms via React Hook Form or direct `action` prop

### TypeScript & Null Safety
- **Strict mode** enabled in `tsconfig.json`
- Always define `interface ComponentNameProps { ... }` for components
- Use optional chaining `?.` over explicit null checks
- Create types for all API responses
- Example:
  ```typescript
  interface InvoiceRowProps {
    invoice: Invoice;
    onEdit?: (invoice: Invoice) => void;
    isSelected?: boolean;
  }
  ```

## Key Services & Integrations

| Service | Purpose | Key Files |
|---------|---------|-----------|
| **Clerk** | Authentication, role-based access | Middleware detects user role |
| **MongoDB + Mongoose** | Database, connection pooling via `app/lib/connect.ts` | `models/reactDataSchema.ts` |
| **Postmark** | Email delivery | `app/lib/actions/email.actions.ts` |
| **Cloudinary** | Image storage, optimization | `next-cloudinary`, scripts for shrinking |
| **OpenRoute Service** | Route/schedule optimization | `app/lib/schedulingOptimizations/`, rate-limited |
| **@react-pdf/renderer** | PDF generation (invoices, receipts) | `_components/pdf/` |
| **TanStack Query** | Client-side caching, refetching | Use in all client components |

## Common Workflows

### Adding a New Feature
1. Create components in `_components/[feature]/`
2. Add page(s) in `app/(root)/[feature]/` or appropriate route group
3. Create server action in `app/lib/actions/[feature].actions.ts` if mutations needed
4. Add API route in `pages/api/[feature-name]/` for external integrations
5. Update database schema in `models/reactDataSchema.ts` if new data structure
6. Define types in `app/lib/typeDefinitions.ts`

### Working with Invoices
- PDF generation via `@react-pdf/renderer`
- PDF components in `_components/pdf/`
- Data model: itemized services, GST calculation, payment tracking
- Email delivery via Postmark

### Employee Availability
- Tracks hourly and recurring patterns
- Time-off requires 2+ weeks advance notice
- Affects scheduling algorithm in route optimization
- Manager approval workflow

### Client Portal
- Separate route group: `app/(clientPortal)/`
- Limited invoice/report visibility via Clerk role
- Client-specific authentication context

## Code Quality Checklist

**Before committing, ALWAYS run:**
```bash
pnpm lint:types    # TypeScript strict checks
pnpm lint:eslint   # Code style (ESLint + Prettier)
```

Both must pass. These catch type errors, import issues, and style violations early.

## File Naming Conventions

| Type | Case | Example |
|------|------|---------|
| Components | PascalCase | `InvoiceDetailsContainer.tsx` |
| API routes | kebab-case folders | `pages/api/send-invoice/index.ts` |
| Server actions | camelCase | `estimateActions.ts` |
| Data fetchers | camelCase | `clientData.ts`, `invoiceData.ts` |
| Utilities | camelCase | `calculateTax.ts` |
| Custom hooks | camelCase + `use` prefix | `useClientData.ts` |

## Environment Variables

Required (from Clerk, MongoDB, Cloudinary, Postmark, OpenRoute):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
MONGODB_URI
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
POSTMARK_API_TOKEN
OPENROUTE_API_KEY
```

## Debugging Tips

| Issue | Solution |
|-------|----------|
| Type errors | Run `npm run lint:types` |
| Database connection | Verify `MONGODB_URI` is correct and accessible |
| API failures | Check DevTools Network tab for response status/body |
| Authentication issues | Verify Clerk keys; check user role in Clerk dashboard |
| PDF generation | Check component props match `@react-pdf/renderer` requirements |
| Route optimization | Test with `npm run test-openroute` before deploying |

## Architectural Philosophy

- **Single Responsibility**: Each file/component handles one concern
- **Server Components First**: Fetch data at source; minimize client bundle
- **Suspense + Skeletons**: Show loading states; build concurrent UIs
- **Type Safety**: Strict TypeScript prevents bugs before runtime
- **Role-Based Access**: Clerk middleware enforces multi-tenant isolation
- **Performance**: Lazy loading, image optimization, memoization, debouncing

---

**Last Updated:** January 2026  
**For detailed context:** See [CLAUDE.md](../CLAUDE.md) and `.cursor/rules/` directory
