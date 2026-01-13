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
