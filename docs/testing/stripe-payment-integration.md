# Manual Testing Criteria - Stripe Payment Integration

## Overview

The current changes implement a complete Stripe payment integration system for invoices, including:

- Payment processing via Stripe
- Support for credit card and bank (PAD) payments
- Payment status tracking
- Client-facing payment pages
- Payment link generation and management
- Webhook handling for payment events

## Prerequisites

1. Ensure all environment variables are configured:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. Have Stripe test mode enabled
3. Have test invoices created in the system

## Test Scenarios

### 1. Payment Settings Configuration

**Location:** Invoice Details Page → Payment Settings Modal

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

### 2. Payment Link Generation

**Location:** Invoice Details Page → Send Invoice Modal

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

### 3. Client Payment Page - Credit Card

**Location:** `/pay?token=[payment_token]`

**Test Steps:**

1. Access payment page with valid token
2. Select "Credit Card" payment method
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

### 4. Client Payment Page - Bank (PAD)

**Location:** `/pay?token=[payment_token]`

**Test Steps:**

1. Access payment page with valid token
2. Select "Bank Payment" method
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

### 5. Payment Status Tracking

**Location:** Invoice Details Page → Payment Status Popover

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

### 6. Payment Failure Scenarios

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

### 7. Webhook Processing

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

### 8. Email Notifications

**Test Steps:**

1. Complete a successful payment
2. Check if receipt email is sent
3. Test payment failure notifications

**Expected Results:**

- Receipt email sent to client on success
- Payment failure notifications sent (if configured)
- Emails contain correct payment details

### 9. PDF Invoice Updates

**Location:** Invoice PDF generation

**Test Steps:**

1. Generate PDF for invoice with payment
2. Check if payment status is reflected
3. Verify payment details are included

**Expected Results:**

- PDF shows payment status
- Payment date and method included
- Receipt URL included if available

### 10. Security and Validation

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

## Edge Cases to Test

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

## Performance Tests

1. Load test payment page with multiple users
2. Test webhook processing under load
3. Verify database queries are optimized
4. Check memory usage during payment processing

## Regression Tests

1. Ensure existing invoice functionality still works
2. Test email sending without payments
3. Verify all existing reports still work
4. Check that non-payment invoices still function
5. **CRITICAL:** Verify email functionality still works after `SendEmail.tsx` removal
   - Test sending invoices via email
   - Test reminder emails
   - Test other email notifications

## Browser Compatibility

Test in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Validation

After testing, verify:

1. All payments are recorded in audit logs
2. Stripe dashboard matches application records
3. Invoice statuses are consistent
4. No orphaned payment records exist
5. All webhooks were processed correctly

## Cleanup

After testing:

1. Refund all test payments
2. Delete test customers in Stripe
3. Clear test invoices or mark as test data
4. Reset webhook endpoints if needed
5. Clear any test data from database



---

## Client Portal Authentication Testing

### 11. Client Portal Access Link Generation

**Location:** Client Details Page → Generate Portal Access Link

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

### 12. Client Portal Login - Valid Token

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

### 13. Client Portal Login - Invalid Token

**Test Steps:**

1. Use a valid URL but modify the `accessToken` parameter
2. Try accessing `/acceptToken?clientId=[valid]&accessToken=[tampered]`

**Expected Results:**

- Error message: "Invalid access token" or similar
- User is NOT authenticated
- No Clerk session created
- Appropriate error UI displayed

### 14. Client Portal Login - Expired Token

**Test Steps:**

1. Manually set a client's `portalAccessTokenExpiry` to a past date in MongoDB
2. Try accessing with the original link

**Expected Results:**

- Error message: "Access token has expired"
- User is NOT authenticated
- Prompt to request a new access link

### 15. Client Portal Login - Missing Token (Legacy Flow)

**Test Steps:**

1. Access `/acceptToken?clientId=[valid]` without the `accessToken` parameter
2. Test if legacy authentication still works

**Expected Results:**

- Depends on implementation: either falls back to Clerk-only auth or rejects
- Document actual behavior for legacy link handling

### 16. Clerk User ID Caching

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

### 17. Client Portal Security Edge Cases

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

---

## Report Testing

### 18. Report Creation

**Location:** Reports Page → Create New Report

**Test Steps:**

1. Navigate to Reports section
2. Click "Create New Report" button
3. Fill in report details:
   - Report type
   - Date range
   - Associated client(s)
   - Any other required fields
4. Save the report

**Expected Results:**

- Report is created successfully
- Report appears in reports list
- Audit log entry created
- All fields are saved correctly

### 19. Report Editing

**Location:** Reports Page → Edit Report

**Test Steps:**

1. Open an existing report
2. Modify various fields
3. Save changes

**Expected Results:**

- Changes are persisted
- Audit log records the modification
- Report list reflects updated information
- Edit timestamp is updated

### 20. Report Deletion

**Location:** Reports Page → Delete Report

**Test Steps:**

1. Select a report for deletion
2. Confirm deletion
3. Verify report is removed

**Expected Results:**

- Confirmation dialog appears before deletion
- Report is removed from the system
- Audit log records deletion
- Associated data handled appropriately (cascade or orphan handling)

### 21. Report Email Sending

**Location:** Reports Page → Send Report via Email

**Test Steps:**

1. Select a report to send
2. Enter recipient email(s)
3. Add any custom message
4. Send the report

**Expected Results:**

- Email is sent successfully
- Report PDF is attached (if applicable)
- Recipient receives email with correct content
- Audit log records the send action
- Multiple recipients supported

---

## PDF Generation Testing

### 22. Invoice PDF Generation

**Location:** Invoice Details → Download/Print PDF

**Test Steps:**

1. Navigate to an invoice
2. Generate/download the PDF
3. Test with various invoice states:
   - Draft invoice
   - Sent invoice
   - Paid invoice
   - Invoice with multiple line items
   - Invoice with discounts
   - Invoice with GST calculations

**Expected Results:**

- PDF generates without errors
- All invoice data is correctly displayed
- GST calculations are accurate
- Payment status reflected (if paid)
- Company branding/logo appears correctly
- Formatting is consistent across invoice types

### 23. Report PDF Generation

**Location:** Reports → Download/Print PDF

**Test Steps:**

1. Navigate to a report
2. Generate/download the PDF
3. Test with various report types

**Expected Results:**

- PDF generates without errors
- Report data is accurately rendered
- Charts/graphs (if any) render correctly
- Date ranges are correct
- Formatting is professional

### 24. Estimate PDF Generation

**Location:** Estimates → Download/Print PDF

**Test Steps:**

1. Navigate to an estimate
2. Generate/download the PDF
3. Test with various estimate scenarios:
   - Simple estimate
   - Estimate with multiple items
   - Estimate with optional items
   - Converted vs unconverted estimates

**Expected Results:**

- PDF generates without errors
- All estimate details are correct
- Optional items clearly marked (if applicable)
- Terms and conditions included
- Expiry date visible (if applicable)

### 25. PDF Generation Edge Cases

**Test Steps:**

1. **Long content:** Test with invoices/reports with many line items
2. **Special characters:** Include special characters in descriptions
3. **Large amounts:** Test with very large dollar amounts
4. **Unicode:** Test with non-ASCII characters in client names
5. **Empty states:** Test with minimal data

**Expected Results:**

- Multi-page PDFs render correctly
- Special characters display properly
- Large numbers formatted correctly (commas, decimals)
- Unicode characters render without corruption
- Empty/minimal data handled gracefully

---

## Reminder System Testing

### 26. Reminder Configuration

**Location:** Invoice Details → Reminder Settings

**Test Steps:**

1. Configure reminder settings for an invoice
2. Set reminder schedule (days before/after due date)
3. Select reminder recipients
4. Save configuration

**Expected Results:**

- Reminder settings are saved
- Recipients list is correct
- Schedule is stored properly
- UI reflects saved configuration

### 27. Reminder Sending

**Test Steps:**

1. Create an invoice with reminders configured
2. Wait for or trigger the reminder cron job (`/api/cron/process-reminders`)
3. Verify reminders are sent

**Expected Results:**

- Reminders sent at correct times
- Correct recipients receive reminders
- Email content is accurate
- Audit log records reminder sends
- Reminder status updated in invoice

---

## Invoice Multiple Recipients

### 28. Multiple Recipients Configuration

**Location:** Invoice → Send Invoice Modal

**Test Steps:**

1. Open Send Invoice modal
2. Add multiple email recipients
3. Send the invoice

**Expected Results:**

- Multiple emails can be entered
- All recipients receive the invoice
- Each recipient's email is logged
- Invoice status updates correctly

---

## Integration Scenarios

### 29. Full Client Journey Test

**Test Steps:**

1. Create a new client
2. Generate client portal access link
3. Create an invoice for the client
4. Send invoice via email to multiple recipients
5. Client accesses portal via link
6. Client makes payment via Stripe
7. Generate report including the transaction
8. Download all PDFs (invoice, report)

**Expected Results:**

- Each step completes successfully
- Data consistency maintained throughout
- All audit logs created
- PDFs reflect accurate current state
- Client portal shows correct invoice/payment status