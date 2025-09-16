Auto Payment Reminders – Revised Feature Plan
Overview

The goal is to replace the one‑off Send Payment Reminder button with a configurable, automated reminder system. Users will be able to schedule recurring reminders every 3 days, 7 days or 14 days, with none as the default. Manual reminder sending will no longer be exposed in the pending‑jobs interface; instead, reminders will always be managed through the configuration modal.

Current System Analysis

Invoices currently have a paymentEmailSent boolean indicating if a reminder was sent
raw.githubusercontent.com
. There is no way to send follow‑up reminders or view history.

The PendingJobsModal displays a Send Payment Reminder button. When clicked, it calls sendPaymentReminderEmail(invoiceId) and updates paymentEmailSent in the local state
raw.githubusercontent.com
. Once sent, it shows a green “Email Sent” badge
raw.githubusercontent.com
.

sendPaymentReminderEmail locates the invoice and client, generates a PDF, sends the email via Postmark and updates paymentEmailSent in the database
raw.githubusercontent.com
.

These behaviours will be deprecated. The new system will remove paymentEmailSent and the one‑off button, replacing them with a scheduleable reminder engine and unified audit logging.

UI/UX Design
Reminder Configuration Modal

The Configure Reminders button (replacing the old reminder button) appears next to the status dropdown on each invoice row.

Clicking opens a modal showing the current reminder settings, the next scheduled send and a history of prior reminders.

┌─ Configure Auto Reminders ──────────────────────────┐
│ Invoice: INV‑2024‑001 – Kitchen Hood Cleaning │
│ Client: ABC Restaurant │
│ │
│ Current Setting: None │
│ │
│ ┌─ Reminder Frequency ────────────────────────────┐ │
│ │ ○ None (default) │ │
│ │ ○ Every 3 days │ │
│ │ ○ Every 7 days │ │
│ │ ○ Every 14 days │ │
│ └─────────────────────────────────────────────────┘ │
│ │
│ ┌─ Reminder History ──────────────────────────────┐ │
│ │ Last sent: Never │ │
│ │ Next scheduled: N/A │ │
│ │ Total sent: 0 │ │
│ └─────────────────────────────────────────────────┘ │
│ │
│ [Cancel] [Save Settings] │
└───────────────────────────────────────────────────┘

A concise badge in the invoice row reflects the current frequency: No Auto Reminders (gray), Every X days (green with the next send date), or Due (orange when overdue). If a client lacks an email address, a red No email badge is shown.

The modal is responsive: on mobile it stacks vertically, uses a single‑column frequency selector, provides adequate touch targets and supports swipe‑to‑configure.

Integration with PendingJobsModal

Remove the Send Payment Reminder button completely—no backward compatibility is needed.

Add a Configure Reminders button next to the status dropdown. This button opens the configuration modal described above.

The status dropdown and payment tracking modal for marking an invoice as paid remain unchanged.

Mobile Responsiveness

Modal content stacks vertically on small screens.

Badges compress and wrap as needed.

Buttons are sized for touch and use contrasting colours for accessibility.

Backend Changes
Schema Updates (models/reactDataSchema.ts)

Invoice Schema Additions

paymentReminders: {
enabled: { type: Boolean, default: false },
frequency: { type: String, enum: ["none", "3days", "7days", "14days"], default: "none" },
nextReminderDate: { type: Date },
lastReminderSent: { type: Date },
reminderHistory: [
{
sentAt: { type: Date, required: true },
emailTemplate: { type: String, required: true },
success: { type: Boolean, default: true },
errorMessage: { type: String },
},
],
},

Remove the old paymentEmailSent field entirely. History is now tracked in reminderHistory.

On existing invoices, set paymentReminders to { enabled: false, frequency: "none" } during migration.

Unified Audit Logs Schema

Rather than a payment‑specific log, create a single auditLogs array (or a dedicated collection) to capture all significant invoice actions. An entry records the action type, timestamp, actor and before/after values. Example:

auditLogs: [
{
action: {
type: String,
enum: [
"reminder_configured",
"reminder_sent_auto",
"reminder_sent_manual",
"reminder_failed",
"payment_status_changed",
"payment_info_updated",
// other domain actions can be added here
],
required: true,
},
timestamp: { type: Date, default: Date.now, required: true },
performedBy: { type: String, required: true }, // user ID or "system"
details: {
oldValue: { type: mongoose.Schema.Types.Mixed },
newValue: { type: mongoose.Schema.Types.Mixed },
reason: { type: String },
metadata: { type: mongoose.Schema.Types.Mixed },
},
ipAddress: { type: String },
userAgent: { type: String },
success: { type: Boolean, default: true },
errorMessage: { type: String },
},
],

Type Definitions (app/lib/typeDefinitions.ts)

Add types for the reminder settings and unified audit log:

export interface PaymentReminderSettings {
enabled: boolean;
frequency: "none" | "3days" | "7days" | "14days";
nextReminderDate?: Date;
lastReminderSent?: Date;
reminderHistory?: {
sentAt: Date;
emailTemplate: string;
success: boolean;
errorMessage?: string;
}[];
}

export interface AuditLogEntry {
\_id?: ObjectId | string;
invoiceId: string;
action:
| "reminder_configured"
| "reminder_sent_auto"
| "reminder_sent_manual"
| "reminder_failed"
| "payment_status_changed"
| "payment_info_updated"
// other domain actions as needed
;
timestamp: Date;
performedBy: string;
details: {
oldValue?: any;
newValue?: any;
reason?: string;
metadata?: any;
};
ipAddress?: string;
userAgent?: string;
success: boolean;
errorMessage?: string;
}

export interface InvoiceType {
// …existing fields
paymentReminders?: PaymentReminderSettings;
auditLogs?: AuditLogEntry[];
}

Database Migration

Add paymentReminders and auditLogs to all invoice documents.

Remove paymentEmailSent and drop any unused indexes on it.

Initialize paymentReminders on existing invoices with default values.

Create indexes on paymentReminders.nextReminderDate for efficient querying and on auditLogs.timestamp for audit searches.

Backend Functions

Create reminder.actions.ts to hold reminder and audit logic.

configurePaymentReminders(invoiceId, settings) – Update the invoice’s paymentReminders fields, push an audit log entry (reminder_configured) noting the old and new settings, and compute nextReminderDate based on the selected frequency.

processAutoReminders() – Scheduled job that runs daily at 9 AM (America/Vancouver). It queries invoices where paymentReminders.enabled is true and paymentReminders.nextReminderDate is on or before now, sends a payment reminder, appends to reminderHistory, updates lastReminderSent and recalculates nextReminderDate. All actions are logged via auditLogs.

sendPaymentReminderEmail(invoiceId) – Still available for manual sends from within the modal. This function now appends to reminderHistory, updates lastReminderSent/nextReminderDate, and writes an auditLogs entry (reminder_sent_manual or reminder_sent_auto).

getReminderSettings(invoiceId) – Returns current reminder settings and history for the front‑end.

logAuditEntry(invoiceId, action, details, performedBy) – Utility to push entries into auditLogs.

getAuditLogs(invoiceId, limit?, offset?) – Fetches paginated logs for display.

Vercel Cron Job Setup

Create `app/api/cron/process-reminders/route.ts` API endpoint that will be triggered by Vercel cron:

```typescript
import { NextRequest } from "next/server";
import { processAutoReminders } from "@/app/lib/actions/reminder.actions";

export async function GET(request: NextRequest) {
  // Verify this request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAutoReminders();
    return Response.json({
      success: true,
      processedCount: result.processedCount,
      sentCount: result.sentCount,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return Response.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "0 16 * * *"
    }
  ]
}
```

**Note:** CRON_SECRET is automatically provided by Vercel - you don't need to set it manually. Vercel will generate and manage this secret for you.

### Testing the Cron Job

#### Local Testing Setup

1. **Create Test Invoice:**

```bash
npm run create-test-invoice
```

2. **Test Cron Function Directly:**

```bash
npm run test-cron
```

3. **Trigger Cron via API (with Next.js running):**

```bash
npm run trigger-cron
```

#### Manual Testing Steps

1. **Create Test Data:**

```bash
npm run create-test-invoice
```

This creates an overdue invoice with your email that should trigger immediately.

2. **Test the Process Function:**

```bash
npm run test-cron
```

This runs the reminder processing logic directly without the API layer.

3. **Test via API Endpoint:**

```bash
npm run trigger-cron
```

This calls the actual API endpoint (requires Next.js to be running).

#### Testing Different Scenarios

- **Change Invoice Due Date:** Modify the test invoice's `dateDue` to test different scenarios
- **Test Reminder Sequences:** Send multiple reminders to see sequence numbering
- **Test Different Frequencies:** Change `paymentReminders.frequency` to test 3, 7, 14 day intervals

#### Production Testing

Once deployed to Vercel, you can test the cron job by:

1. Creating a test invoice with a due date in the past
2. Waiting for the next cron execution (4:00 PM PST daily)
3. Or manually triggering via the API:

```bash
curl -X GET https://your-app.vercel.app/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Updated Postmark Template

Update your `payment-reminder` template in Postmark to include the new sequence variables:

#### Subject Line (Conditional):

```
{{#if reminder_sequence "1st"}}
  Payment Reminder for {{invoice_number}} - {{jobTitle}}
{{else}}
  {{reminder_sequence}} Payment Reminder for {{invoice_number}} - {{jobTitle}}
{{/if}}
```

#### Email Body (Updated):

```html
<p>Hello,</p>

<p>
  This is a <strong>{{reminder_sequence}}</strong> friendly reminder that
  payment for invoice <strong>#{{invoice_number}}</strong> for services at
  <strong>{{jobTitle}}</strong> is currently due.
</p>

<div class="invoice-details">
  <p><strong>Invoice #:</strong> {{invoice_number}}</p>
  <p><strong>Issue Date:</strong> {{issue_date}}</p>
  <p>
    <strong>Amount Due:</strong> <span class="amount-due">${{amount_due}}</span>
  </p>
  <p><strong>Reminder #:</strong> {{total_reminders_sent}}</p>
</div>

{{#if total_reminders_sent "1"}}
<p>You can find a copy of your invoice attached to this email.</p>
{{else}}
<p>
  For your reference, you can view your invoice and previous reminders in your
  <a href="[CLIENT_PORTAL_LINK]">client portal</a>.
</p>
{{/if}}

<p>
  If you've already made this payment, please disregard this notice and accept
  our thanks. If not, we kindly request that you process this payment at your
  earliest convenience.
</p>

<p>Payment can be made via:</p>
<ul>
  <li><strong>E-transfer:</strong> adam@vancouverventcleaning.ca</li>
  <li>
    <strong>Cheque:</strong> Mail to 51-11020 Williams Rd Richmond, BC V7A 1X8
  </li>
</ul>

<p>
  For any questions regarding this invoice or if you need to discuss payment
  arrangements, please don't hesitate to reply to this email or call us at
  {{phone_number}}.
</p>

<p>
  Thank you for your business. We appreciate your prompt attention to this
  matter.
</p>

<p>
  Best regards,<br />
  The Vancouver Hood Doctors Team
</p>
```

#### New Template Variables:

- `reminder_sequence`: "1st", "2nd", "3rd", etc.
- `total_reminders_sent`: "1", "2", "3", etc.

#### PDF Attachment Logic:

- **1st reminder**: Attach full PDF invoice
- **2nd+ reminders**: Include portal link instead of PDF to reduce email size

## ✅ Implementation Status - COMPLETED

### Phase 1: Schema & Types - ✅ DONE

- Modified Mongoose invoice schema with `paymentReminders` and `auditLogs` fields
- Updated TypeScript interfaces with `PaymentReminderSettings` and `AuditLogEntry`
- Created database migration script (`scripts/migrate-reminders-schema.ts`)
- Removed old `paymentEmailSent` field

### Phase 2: Backend API - ✅ DONE

- Created `app/lib/actions/reminder.actions.ts` with all reminder functions
- Implemented audit logging for payment actions
- Created Vercel cron API route (`pages/api/cron/process-reminders/index.ts`)
- Updated email sending to track history and create audit logs
- Added sequence-aware email templates

### Phase 3: Frontend UI - ✅ DONE

- Built `ReminderConfigModal.tsx` with settings and history tabs
- Updated `PendingJobsModal.tsx` to use new reminder system
- Added reminder status badges and configuration buttons
- Implemented reminder history and audit log displays
- Ensured mobile responsiveness for all components

### Phase 4: Integration & Testing - 🔄 READY

Test the following:

- Run migration: `npm run migrate-reminders`
- Configure reminders via the modal
- Test automated reminder processing
- Verify email templates and delivery
- Test audit logging functionality
- Test edge cases (no email, failed sends)
- Performance testing with large datasets

Technical Considerations

Performance – Query only invoices where paymentReminders.nextReminderDate is due; use indexes. Batch email sends and respect API rate limits. Cache reminder settings to avoid repeated DB calls in the UI.

Error Handling – Gracefully handle missing email addresses (display a No email badge). Retry failed sends with backoff and record failures in the audit log.

Security – Validate all inputs. Rate‑limit manual sends. Record IP and user agent in auditLogs for monitoring. Encrypt sensitive data where appropriate.

Scalability – Design for >1 000 invoices. Paginate audit logs and reminder history. Consider archiving or purging logs older than 2 years.

Success Metrics

Automated reminders reduce manual sends by ≥90 %.

Higher on‑time payment rate due to repeated reminders.

Positive feedback on the new configuration UI and mobile experience.

Complete, searchable audit trail across all invoice actions.
