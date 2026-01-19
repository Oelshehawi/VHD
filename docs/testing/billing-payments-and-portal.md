# Billing, Payments, and Client Portal - Change Summary and Manual Testing Criteria

## Summary of Changes (by Impact)

### High Impact
- Stripe invoice payments end to end: payment settings, payment links, client pay page (card + PAD), webhook-driven status updates, invoice status updates, receipt URL storage.
- Automated payment reminders (manual + cron) with configurable cadence, invoice-creation defaults, and audit log tracking.
- Client portal access-token authentication with Clerk user caching and expiry handling.
- Client portal scheduling requests via tokenized links, client request wizard, manager review/confirm/alternatives, schedule creation, confirmation emails.

### Medium Impact
- Invoice delivery to multiple recipients with recipient validation and optional report PDF attachment.
- Service reports: create/update from schedules, reuse prior reports, report PDF generation, client portal report viewing/download, plus report schema additions (Ecology unit + access panels fields).
- In-app and push notifications with unread counts, scheduling request notifications, and review modals.
- Base URL normalization for all generated links (payment, scheduling, invoice email links).

### Low Impact
- Payment page UX: auto-select single available payment method and timezone-safe due date display.
- Client portal UI refresh (dashboard cards, report modal, tabs, layout/footer).
- Utility/config tweaks (date formatting safety, minor UI adjustments).
- Bug fixes: lightbox z-index layering above dialog overlay.

## Manual Testing Criteria

### Overview

The current changes implement a complete Stripe payment integration for invoices, automated payment reminders, client portal access/auth, client-driven scheduling requests with manager review and notifications, and service report workflows.

### Prerequisites

1. Ensure all environment variables are configured:
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Postmark: `POSTMARK_CLIENT`
   - Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
   - Clerk: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Base URL: `NEXT_PUBLIC_APP_URL` (preferred) or `NEXT_PUBLIC_VERCEL_URL`

2. Stripe test mode enabled.
3. Postmark templates created:
   - `invoice-delivery-1`
   - `cleaning-due-reminder-1`
   - `scheduling-confirmation`
   - `scheduling-alternatives`
4. Have test invoices, clients, schedules, reports, and JobsDueSoon entries created in the system.

### Test Scenarios

#### 1. Payment Settings Configuration

**Location:** Invoice Details Page -> Payment Settings Modal

**Test Steps:**

1. Navigate to an invoice details page
2. Click "Payment Settings" button
3. Configure payment settings:
   - Enable/disable online payments
   - Enable/disable credit card payments
   - Enable/disable bank payments
4. Save settings

**Expected Results:**

- Settings are saved correctly
- Audit log is created
- Page refreshes with updated settings
- Settings persist after page reload

#### 2. Payment Link Generation

**Location:** Invoice Details Page -> Send Invoice Modal

**Test Steps:**

1. Open the Send Invoice modal for an invoice
2. Ensure online payments are enabled
3. Generate/send the invoice
4. Check that a payment link is created

**Expected Results:**

- Payment link token is generated
- Link expires in 30 days
- Link is included in email (if email is sent)
- Token is stored in invoice document
- Link uses `NEXT_PUBLIC_APP_URL` (or `NEXT_PUBLIC_VERCEL_URL`) as base

#### 3. Client Payment Page - Credit Card

**Location:** `/pay?token=[payment_token]`

**Test Steps:**

1. Access payment page with valid token
2. Select "Credit Card" payment method (auto-selected if only option)
3. Fill in test card details:
   - Card number: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Name: Test User
4. Click "Pay" button
5. **CRITICAL:** Verify redirect to `/pay/success` after payment

**Expected Results:**

- Processing fee is calculated correctly (2.9% + $0.30)
- Total amount includes invoice amount + fee
- Payment processes successfully
- **Redirects to `/pay/success` page (ensure this route exists)**
- Invoice status updates to "paid"
- Payment status shows "succeeded"
- Receipt URL is saved
- Due date displays as dateIssued + 14 days without timezone shift

#### 4. Client Payment Page - Bank (PAD)

**Location:** `/pay?token=[payment_token]`

**Test Steps:**

1. Access payment page with valid token
2. Select "Bank Payment" method (auto-selected if only option)
3. Fill in bank details:
   - Use test bank account details from Stripe documentation
4. Accept PAD mandate
5. Click "Pay" button
6. **CRITICAL:** Test with bank that doesn't support instant verification

**Expected Results:**

- Processing fee is calculated correctly (0.8% max $5.00)
- Total amount includes invoice amount + fee
- Payment initiates successfully
- Status shows "processing" or "pending"
- Mandate is created and saved
- Invoice status remains "sent" until payment completes
- **Banks without instant verification are rejected with appropriate error**

#### 5. Payment Status Tracking

**Location:** Invoice Details Page -> Payment Status Popover

**Test Steps:**

1. After a payment is initiated, click "Payment Status" button
2. Observe the status display
3. Click refresh to update status

**Expected Results:**

- Current payment status is displayed
- Payment method type is shown (card/bank)
- Timeline of events is displayed
- Status updates in real-time (for webhooks)
- Refresh button updates status

#### 6. Payment Failure Scenarios

**Test Steps:**

1. Test with expired payment link
2. Test with already paid invoice
3. Test with disabled payments
4. Test with declined card (4000 0000 0000 0002)
5. Test with insufficient funds (4000 0000 0000 9995)

**Expected Results:**

- Appropriate error messages displayed
- No payment is processed
- Invoice status remains unchanged
- Error is logged in audit trail

#### 7. Webhook Processing

**Location:** `/api/stripe/webhook`

**Test Steps:**

1. Use Stripe CLI to test webhook events:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   stripe trigger payment_intent.payment_failed
   stripe trigger charge.pending
   ```
2. Check invoice status after each event

**Expected Results:**

- Webhook signature verification works
- Payment status updates correctly
- Invoice status changes to "paid" on success
- Audit logs are created for each event
- Error handling works for invalid signatures

#### 8. Invoice Delivery Email (Postmark + PDF)

**Test Steps:**

1. Send an invoice from the invoice details page
2. Verify recipient list (accounting email by default, custom recipients when provided)
3. Confirm modal prevents send when no recipients are selected
4. Confirm email template renders correctly
5. If payment link exists and is not expired, verify link is present
6. If include-report option is enabled, verify report PDF is attached

**Expected Results:**

- Email is delivered via Postmark
- Invoice PDF attachment is present and correct
- Multiple recipients are supported
- Send is blocked when no recipients are selected
- Payment link appears when enabled and valid
- Optional report PDF attaches when requested
- Audit log entry `invoice_emailed` is created

#### 9. Invoice Creation With Reminders Enabled

**Location:** Add Invoice flow

**Test Steps:**

1. Create a new invoice with reminders enabled
2. Choose a reminder frequency
3. Save the invoice

**Expected Results:**

- `paymentReminders.enabled` is true
- `paymentReminders.frequency` matches selection
- `nextReminderDate` is set to 9 AM local time
- `nextReminderDate` is not in the past (advances if needed)

#### 10. Payment Reminder Configuration (Manual)

**Location:** Invoice Details Page -> Payment Reminders Card

**Test Steps:**

1. Choose reminder frequency (3/5/7)
2. Set start-from date (date issued vs today)
3. Save settings
4. Click "Send Reminder" to send a manual reminder

**Expected Results:**

- Settings persist and show next reminder date
- Next reminder date is set to 9 AM local time
- Manual reminder email sends successfully
- Audit log includes `reminder_configured` and `reminder_sent_manual`

#### 11. Automated Payment Reminders (Cron)

**Test Steps:**

1. Set an invoice's next reminder date to a past time
2. Run the cron job or invoke `processAutoReminders`
3. Confirm reminder email is sent

**Expected Results:**

- Reminder email sent for due invoices
- `reminder_sent_auto` audit log entry created
- Next reminder date advances by the configured frequency

#### 12. Service Reports (Technician + Client Portal)

**Location:** Schedule -> Job Details -> Report Modal, Client Portal -> Reports Tab

**Test Steps:**

1. Open a schedule and create a new report
2. Save the report and reopen to confirm persistence
3. Load a prior report from the same client/job/location (report selector)
4. Download a report PDF
5. Log into the client portal and open the Reports tab
6. View a report and download the report PDF
7. Populate Ecology Unit fields and Access Panels fields (if present), save, and reopen

**Expected Results:**

- Report saves and persists on reload
- Prior reports can be reused and edited
- Report PDF downloads correctly
- Client portal displays report list and modal details
- Client portal report PDF download works
- Ecology Unit and Access Panels data persist and render correctly

#### 13. PDF Invoice Updates

**Location:** Invoice PDF generation

**Test Steps:**

1. Generate PDF for invoice with payment
2. Check if payment status is reflected
3. Verify payment details are included

**Expected Results:**

- PDF shows payment status
- Payment date and method included
- Receipt URL included if available

#### 14. Security and Validation

**Test Steps:**

1. Test with invalid tokens
2. Test SQL injection attempts
3. Test XSS in payment fields
4. Verify HTTPS is enforced
5. Check CORS settings

**Expected Results:**

- All inputs are properly sanitized
- Invalid requests are rejected
- No sensitive data exposed
- Proper error messages without stack traces

### Edge Cases to Test

1. **Concurrent Payments:** Try paying the same invoice from two browsers
2. **Partial Payments:** Ensure partial payments are not allowed
3. **Refunds:** Test refund processing (if implemented)
4. **Currency Handling:** Ensure CAD is used throughout
5. **Time Zones:** Verify timestamps work correctly
6. **Network Errors:** Test behavior with poor connectivity
7. **Fee Calculation Edge Cases:**
   - Test with $0.01 invoice amount
   - Test with very large invoice amounts
   - Test ACH payment hitting the $5.00 fee cap exactly
   - Verify fee calculations are rounded correctly
8. **Reminder Cadence:** Ensure next reminder date does not fall in the past
9. **Link Base URL:** Ensure links do not point to localhost in prod

### Performance Tests

1. Load test payment page with multiple users
2. Test webhook processing under load
3. Verify database queries are optimized
4. Check memory usage during payment processing

### Regression Tests

1. Ensure existing invoice functionality still works
2. Test email sending without payments
3. Verify all existing reports still work
4. Check that non-payment invoices still function
5. **CRITICAL:** Verify email functionality still works after `SendEmail.tsx` removal
   - Test sending invoices via email
   - Test reminder emails
   - Test other email notifications
6. Verify scheduling request flow does not break existing scheduling tools
7. Verify notifications panel works with legacy notification types
8. Verify client portal reports tab still works for older reports

### Browser Compatibility

Test in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Data Validation

After testing, verify:

1. All payments are recorded in audit logs
2. Stripe dashboard matches application records
3. Invoice statuses are consistent
4. No orphaned payment records exist
5. All webhooks were processed correctly
6. Reminder history and next reminder dates are consistent
7. Scheduling request records match dashboard state
8. Reports and report PDFs are linked to the correct schedule/invoice

---

### Client Portal Authentication Testing

#### 15. Client Portal Access Link Generation

**Location:** Client Details Page -> Generate Portal Access Link

**Test Steps:**

1. Navigate to a client's detail page
2. Generate a new client portal access link
3. Inspect the generated URL

**Expected Results:**

- URL contains `clientId` parameter
- URL contains `accessToken` parameter (64 character hex string)
- Client document in database has:
  - `portalAccessToken` field populated (matches URL token)
  - `portalAccessTokenExpiry` set to 30 days from now
  - `clerkUserId` populated (if user was created/exists in Clerk)

#### 16. Client Portal Login - Valid Token

**Location:** `/acceptToken?clientId=[id]&accessToken=[token]`

**Test Steps:**

1. Use a freshly generated access link
2. Click the link or paste URL in browser
3. Observe the authentication flow

**Expected Results:**

- Loading spinner displays during authentication
- User is automatically signed in to Clerk
- Redirects to client portal dashboard
- No login form required (magic link flow)
- Clerk sign-in token created with 5-minute expiry (security)

#### 17. Client Portal Login - Invalid Token

**Test Steps:**

1. Use a valid URL but modify the `accessToken` parameter
2. Try accessing `/acceptToken?clientId=[valid]&accessToken=[tampered]`

**Expected Results:**

- Error message: "Invalid access token" or similar
- User is NOT authenticated
- No Clerk session created
- Appropriate error UI displayed

#### 18. Client Portal Login - Expired Token

**Test Steps:**

1. Manually set a client's `portalAccessTokenExpiry` to a past date in MongoDB
2. Try accessing with the original link

**Expected Results:**

- Error message: "Access token has expired"
- User is NOT authenticated
- Prompt to request a new access link

#### 19. Client Portal Login - Missing Token (Legacy Flow)

**Test Steps:**

1. Access `/acceptToken?clientId=[valid]` without the `accessToken` parameter
2. Test if legacy authentication still works

**Expected Results:**

- Depends on implementation: either falls back to Clerk-only auth or rejects
- Document actual behavior for legacy link handling

#### 20. Clerk User ID Caching

**Test Steps:**

1. Generate a fresh access link for a new client (no existing Clerk user)
2. Use the link to authenticate
3. Check the Client document in MongoDB
4. Re-authenticate using the same link

**Expected Results:**

- First authentication:
  - Creates Clerk user (if not exists)
  - Stores `clerkUserId` in Client document for caching
  - Uses email-based Clerk lookup (not listing all users)
- Subsequent authentications:
  - Uses cached `clerkUserId` (faster lookup)
  - Verifies user still exists and metadata matches
  - Falls back to email lookup if cached ID is invalid

#### 21. Client Portal Security Edge Cases

**Test Steps:**

1. **Token reuse:** Use the same link multiple times (should work until expiry)
2. **Concurrent sessions:** Open link in multiple browsers/devices
3. **Client email change:** Change client email after link generation
4. **Clerk user deletion:** Delete Clerk user, then try cached userId lookup

**Expected Results:**

- Multiple uses of same token allowed (reusable until expiry)
- Concurrent sessions should work independently
- Email change: existing links may fail (depends on Clerk user state)
- Deleted Clerk user: falls back to email lookup, may create new Clerk user

### Client Portal Scheduling Requests

#### 22. Scheduling Link Generation (From Reminder)

**Location:** Cleaning reminder email -> scheduling link

**Test Steps:**

1. Trigger a cleaning reminder email for a due job
2. Inspect the scheduling link URL

**Expected Results:**

- URL includes a `token` parameter
- Token stored on the JobsDueSoon record
- Token expiry set to 30 days

#### 23. Scheduling Wizard Submission - Valid Token

**Location:** `/client-portal/schedule?token=[token]`

**Test Steps:**

1. Open the scheduling link
2. Select primary and backup dates/time windows
3. Confirm service address and provide access notes
4. Submit the request

**Expected Results:**

- Scheduling request created with `pending` status
- JobsDueSoon links to the new request
- Manager notification created
- Client sees success state in UI

#### 24. Scheduling Wizard Validation - Invalid/Expired

**Test Steps:**

1. Open the scheduling link with an invalid or expired token
2. Submit primary/backup selections that are identical

**Expected Results:**

- Invalid/expired tokens are rejected with a clear error
- Identical primary/backup selections are rejected
- No request is created on failure

#### 25. Manager Review - Confirm Request

**Location:** Dashboard -> Scheduling Requests Panel

**Test Steps:**

1. Open a pending request
2. Confirm a date/time and add optional notes
3. Save/confirm

**Expected Results:**

- Request status updated to `confirmed`
- Schedule created and linked to invoice
- JobsDueSoon marked as scheduled
- Confirmation email sent to client
- Related notification dismissed

#### 26. Manager Review - Send Alternatives

**Location:** Dashboard -> Scheduling Requests Panel

**Test Steps:**

1. Open a pending request
2. Send alternative dates/time windows

**Expected Results:**

- Request status updated to `alternatives_sent`
- Alternatives email sent to client
- Request remains visible for follow-up

### Notifications and Push

#### 27. In-App Notifications

**Test Steps:**

1. Open notifications panel and verify unread count
2. Click a notification and ensure it marks as read
3. Click "Mark all read" and verify all unread are cleared
4. Click a scheduling request notification to open the review modal
5. Click a notification with a link and verify navigation

**Expected Results:**

- Unread count updates correctly
- Notification read state persists after reload
- Scheduling request notification opens review modal
- Link-based notifications route correctly

#### 28. Push Subscriptions and Delivery

**Test Steps:**

1. Subscribe a user to push notifications
2. Trigger a test notification
3. Unsubscribe and verify pushes stop
4. Invalidate subscription and confirm cleanup

**Expected Results:**

- Push notifications deliver when subscribed
- Unsubscribe removes subscription
- Invalid subscriptions are removed automatically
