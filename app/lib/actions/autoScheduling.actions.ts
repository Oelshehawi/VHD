"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import connectMongo from "../connect";
import { requireAdmin } from "../auth/utils";
import { formatDateStringUTC, getEmailForPurpose } from "../utils";
import {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  SchedulingRequest,
} from "../../../models/reactDataSchema";
import {
  RequestedTime,
  SchedulingRequestType,
  DueInvoiceType,
  ClientType,
  InvoiceType,
  ScheduleType,
  DayAvailability,
  NOTIFICATION_TYPES,
} from "../typeDefinitions";
import {
  createNotification,
  dismissSchedulingRequestNotification,
} from "./notifications.actions";
import { createJobsDueSoonForInvoice } from "./actions";
import {
  calculateDateDueFromParts,
  calculateNextReminderDateFromParts,
  parseDateParts,
  toUtcDateFromParts,
} from "../utils/datePartsUtils";
import { syncInvoiceDateIssuedAndJobsDueSoon } from "./invoiceDateSync";
import { resolveHistoricalDurationForScheduleCreate } from "../scheduleHistoricalDuration";

const postmark = require("postmark");

const CONTACT_PHONE = "604-273-8717";
const CONTACT_EMAIL = "scheduling@vancouverventcleaning.ca";

const DEFAULT_CONTACT_MODEL = {
  phone_number: CONTACT_PHONE,
  contact_email: CONTACT_EMAIL,
};

// Get manager user IDs from Clerk (users with isManager public metadata)
async function getManagerUserIds(): Promise<string[]> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();

    // Fetch all users (Clerk limits to 500 by default)
    const users = await clerk.users.getUserList({ limit: 500 });

    // Filter to users with isManager metadata
    const managerIds = users.data
      .filter((user) => {
        const metadata = user.publicMetadata as
          | { isManager?: boolean }
          | undefined;
        return metadata?.isManager === true;
      })
      .map((user) => user.id);

    return managerIds;
  } catch (error) {
    console.error("Error fetching manager users from Clerk:", error);
    return [];
  }
}

// Helper to format time for emails
const formatTimeForEmail = (time: RequestedTime): string => {
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  const displayMinute = time.minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
};

async function sendSchedulingConfirmationEmail(params: {
  client: ClientType;
  invoice: InvoiceType;
  confirmedDate: string | Date;
  confirmedTime: RequestedTime;
}): Promise<{ success: boolean; error?: string }> {
  const clientEmail = getEmailForPurpose(params.client, "scheduling");

  if (!clientEmail) {
    return { success: false, error: "Client email not found" };
  }

  const formattedDate = formatDateStringUTC(params.confirmedDate);
  const formattedTime = formatTimeForEmail(params.confirmedTime);

  try {
    const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);

    await client.sendEmailWithTemplate({
      From: CONTACT_EMAIL,
      To: clientEmail,
      TemplateAlias: "scheduling-confirmation",
      TemplateModel: {
        header_title: "Your Service is Scheduled",
        client_name: params.client.clientName,
        job_title: params.invoice.jobTitle,
        location: params.invoice.location,
        confirmed_date: formattedDate,
        confirmed_time_window: formattedTime, // Using same template field for now
        ...DEFAULT_CONTACT_MODEL,
      },
      TrackOpens: true,
      MessageStream: "outbound",
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending scheduling confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

async function sendSchedulingAlternativesEmail(params: {
  client: ClientType;
  invoice: InvoiceType;
  alternatives: Array<{ date: string; requestedTime: RequestedTime }>;
}): Promise<{ success: boolean; error?: string }> {
  const clientEmail = getEmailForPurpose(params.client, "scheduling");

  if (!clientEmail) {
    return { success: false, error: "Client email not found" };
  }

  const formattedAlternatives = params.alternatives.map((alternative) => ({
    date: formatDateStringUTC(alternative.date),
    time: formatTimeForEmail(alternative.requestedTime),
  }));

  const [altOne, altTwo] = formattedAlternatives;

  try {
    const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);

    await client.sendEmailWithTemplate({
      From: CONTACT_EMAIL,
      To: clientEmail,
      TemplateAlias: "scheduling-alternatives",
      TemplateModel: {
        header_title: "Alternative Service Times",
        client_name: params.client.clientName,
        job_title: params.invoice.jobTitle,
        location: params.invoice.location,
        alternative_1_date: altOne?.date || "",
        alternative_1_window: altOne?.time || "",
        alternative_2_date: altTwo?.date || "",
        alternative_2_window: altTwo?.time || "",
        ...DEFAULT_CONTACT_MODEL,
      },
      TrackOpens: true,
      MessageStream: "outbound",
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending scheduling alternatives email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Generate a secure scheduling token for a JobsDueSoon entry
 * Token expires in 30 days
 */
export async function generateSchedulingToken(
  jobsDueSoonId: string,
): Promise<string> {
  await connectMongo();

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 day expiry

  await JobsDueSoon.findByIdAndUpdate(jobsDueSoonId, {
    schedulingToken: token,
    schedulingTokenExpiry: expiry,
  });

  return token;
}

/**
 * Get existing scheduling link or generate a new one
 */
export async function getSchedulingLink(jobsDueSoonId: string): Promise<{
  success: boolean;
  link?: string;
  hasExistingRequest?: boolean;
  error?: string;
}> {
  await connectMongo();

  try {
    await requireAdmin();

    const jobsDueSoon = (await JobsDueSoon.findById(
      jobsDueSoonId,
    ).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return { success: false, error: "Job not found" };
    }

    // Check if there's an existing valid token
    const hasValidToken =
      jobsDueSoon.schedulingToken &&
      jobsDueSoon.schedulingTokenExpiry &&
      new Date(jobsDueSoon.schedulingTokenExpiry) > new Date();

    // Check if there's an existing active request
    let hasExistingRequest = false;
    if (jobsDueSoon.schedulingRequestId) {
      const existingRequest = await SchedulingRequest.findById(
        jobsDueSoon.schedulingRequestId,
      ).lean();
      if (
        existingRequest &&
        (existingRequest as any).status !== "expired" &&
        (existingRequest as any).status !== "cancelled"
      ) {
        hasExistingRequest = true;
      }
    }

    let token = jobsDueSoon.schedulingToken;
    if (!hasValidToken) {
      token = await generateSchedulingToken(jobsDueSoonId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${baseUrl}/client-portal/schedule?token=${token}`;

    return { success: true, link, hasExistingRequest };
  } catch (error) {
    console.error("Error getting scheduling link:", error);
    return { success: false, error: "Failed to get scheduling link" };
  }
}

/**
 * Regenerate scheduling link (clears existing request if any)
 */
export async function regenerateSchedulingLink(jobsDueSoonId: string): Promise<{
  success: boolean;
  link?: string;
  error?: string;
}> {
  await connectMongo();

  try {
    await requireAdmin();

    const jobsDueSoon = (await JobsDueSoon.findById(
      jobsDueSoonId,
    ).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return { success: false, error: "Job not found" };
    }

    // Cancel any existing request
    if (jobsDueSoon.schedulingRequestId) {
      await SchedulingRequest.findByIdAndUpdate(
        jobsDueSoon.schedulingRequestId,
        {
          status: "cancelled",
        },
      );
      // Clear the reference
      await JobsDueSoon.findByIdAndUpdate(jobsDueSoonId, {
        schedulingRequestId: null,
      });
    }

    // Generate new token
    const token = await generateSchedulingToken(jobsDueSoonId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${baseUrl}/client-portal/schedule?token=${token}`;

    revalidatePath("/dashboard");

    return { success: true, link };
  } catch (error) {
    console.error("Error regenerating scheduling link:", error);
    return { success: false, error: "Failed to regenerate scheduling link" };
  }
}

/**
 * Create a scheduling request from the client portal
 */
export async function createSchedulingRequest(data: {
  token: string;
  primarySelection: { date: string; requestedTime: RequestedTime };
  backupSelection: { date: string; requestedTime: RequestedTime };
  confirmationDetails: {
    addressConfirmed: boolean;
    parkingNotes?: string;
    accessNotes?: string;
    specialInstructions?: string;
    preferredContact: "phone" | "email" | "either" | "other";
    customContactMethod?: string;
    onSiteContactName?: string;
    onSiteContactPhone?: string;
  };
  usedSuggestion?: { dayOfWeek: number };
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  await connectMongo();

  try {
    // Validate token - inline since getSchedulingContext is now in data file
    const jobsDueSoon = (await JobsDueSoon.findOne({
      schedulingToken: data.token,
      schedulingTokenExpiry: { $gt: new Date() },
    }).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return { success: false, error: "Invalid or expired scheduling link" };
    }

    const trimmedSpecialInstructions = (
      data.confirmationDetails.specialInstructions || ""
    ).trim();

    if (
      !data.confirmationDetails.addressConfirmed &&
      !trimmedSpecialInstructions
    ) {
      return {
        success: false,
        error:
          "Address not confirmed. Please add the correct service address in Special Instructions.",
      };
    }

    const normalizeDate = (dateValue: string): string =>
      dateValue.includes("T")
        ? dateValue.split("T")[0] || dateValue
        : dateValue;

    const primaryDate = normalizeDate(data.primarySelection.date);
    const backupDate = normalizeDate(data.backupSelection.date);

    // Check if primary and backup are same day AND same time
    const sameDateTime =
      primaryDate === backupDate &&
      data.primarySelection.requestedTime.hour ===
        data.backupSelection.requestedTime.hour &&
      data.primarySelection.requestedTime.minute ===
        data.backupSelection.requestedTime.minute;

    if (sameDateTime) {
      return {
        success: false,
        error: "Primary and backup selections must be different",
      };
    }

    // Check for existing request
    if (jobsDueSoon.schedulingRequestId) {
      const existingRequest = (await SchedulingRequest.findById(
        jobsDueSoon.schedulingRequestId,
      ).lean()) as SchedulingRequestType | null;
      if (
        existingRequest &&
        existingRequest.status !== "expired" &&
        existingRequest.status !== "cancelled"
      ) {
        return {
          success: false,
          error: "A scheduling request has already been submitted for this job",
        };
      }
    }

    const jobsDueSoonId = jobsDueSoon._id;
    if (!jobsDueSoonId) {
      return { success: false, error: "Invalid job reference" };
    }

    // Create the scheduling request
    const request = new SchedulingRequest({
      clientId: jobsDueSoon.clientId,
      invoiceId: jobsDueSoon.invoiceId,
      jobsDueSoonId,
      primarySelection: {
        date: new Date(primaryDate),
        requestedTime: data.primarySelection.requestedTime,
      },
      backupSelection: {
        date: new Date(backupDate),
        requestedTime: data.backupSelection.requestedTime,
      },
      addressConfirmed: data.confirmationDetails.addressConfirmed,
      parkingNotes: data.confirmationDetails.parkingNotes || "",
      accessNotes: data.confirmationDetails.accessNotes || "",
      specialInstructions: trimmedSpecialInstructions,
      preferredContact: data.confirmationDetails.preferredContact,
      customContactMethod: data.confirmationDetails.customContactMethod || "",
      onSiteContactName: data.confirmationDetails.onSiteContactName,
      onSiteContactPhone: data.confirmationDetails.onSiteContactPhone,
      suggestedUsual: data.usedSuggestion
        ? {
            dayOfWeek: data.usedSuggestion.dayOfWeek,
            wasSelected: true,
          }
        : undefined,
      status: "pending",
      requestedAt: new Date(),
    });

    await request.save();

    // Update JobsDueSoon with the request reference
    await JobsDueSoon.findByIdAndUpdate(jobsDueSoonId, {
      schedulingRequestId: request._id,
    });

    // Get client info for notification
    const client = (await Client.findById(
      jobsDueSoon.clientId,
    ).lean()) as ClientType | null;
    const invoice = (await Invoice.findById(
      jobsDueSoon.invoiceId,
    ).lean()) as InvoiceType | null;

    // Create notification for admins
    if (client && invoice) {
      const formatTime = (time: RequestedTime): string => {
        const period = time.hour >= 12 ? "PM" : "AM";
        const displayHour = time.hour % 12 || 12;
        return `${displayHour}:${time.minute.toString().padStart(2, "0")} ${period}`;
      };

      const managerIds = await getManagerUserIds();

      if (managerIds.length === 0) {
        console.warn("No managers found to notify for scheduling request");
      } else {
        const results = await Promise.all(
          managerIds.map((userId) =>
            createNotification({
              userId,
              title: `Scheduling Request: ${client.clientName}`,
              body: `${invoice.jobTitle} - ${formatDateStringUTC(
                data.primarySelection.date,
              )} at ${formatTime(data.primarySelection.requestedTime)}`,
              type: NOTIFICATION_TYPES.SCHEDULING_REQUEST,
              metadata: {
                schedulingRequestId: request._id.toString(),
              },
            }),
          ),
        );

        if (!results.every((result) => result.success)) {
          console.warn(
            "One or more scheduling request notifications failed to send",
          );
        }
      }
    }

    // revalidatePath("/dashboard");

    return { success: true, requestId: request._id.toString() };
  } catch (error) {
    console.error("Error creating scheduling request:", error);
    return { success: false, error: "Failed to submit scheduling request" };
  }
}

/**
 * Get all pending scheduling requests for manager review
 */
export async function getPendingSchedulingRequests(): Promise<
  SchedulingRequestType[]
> {
  await connectMongo();

  try {
    await requireAdmin();
    const requests = await SchedulingRequest.find({ status: "pending" })
      .sort({ requestedAt: 1 }) // Oldest first
      .populate("clientId", "clientName email emails phoneNumber")
      .populate("invoiceId", "jobTitle location estimatedHours")
      .lean();

    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    console.error("Error getting pending scheduling requests:", error);
    return [];
  }
}

/**
 * Get a single scheduling request by ID with populated data
 */
export async function getSchedulingRequestById(requestId: string): Promise<{
  success: boolean;
  request?: SchedulingRequestType;
  error?: string;
}> {
  await connectMongo();

  try {
    await requireAdmin();
    const request = await SchedulingRequest.findById(requestId)
      .populate("clientId", "clientName email emails phoneNumber")
      .populate("invoiceId", "jobTitle location estimatedHours items notes")
      .lean();

    if (!request) {
      return { success: false, error: "Scheduling request not found" };
    }

    return {
      success: true,
      request: JSON.parse(JSON.stringify(request)),
    };
  } catch (error) {
    console.error("Error getting scheduling request:", error);
    return { success: false, error: "Failed to get scheduling request" };
  }
}

/**
 * Confirm a scheduling request and create the schedule
 */
export async function confirmSchedulingRequest(
  requestId: string,
  confirmedDate: string,
  confirmedTime: RequestedTime,
  notes?: string,
): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  await connectMongo();

  try {
    const { userId } = await requireAdmin();

    const request = (await SchedulingRequest.findById(requestId)
      .populate("invoiceId", "jobTitle location estimatedHours")
      .populate("clientId", "clientName email emails phoneNumber")
      .lean()) as SchedulingRequestType | null;

    if (!request) {
      return { success: false, error: "Scheduling request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request has already been processed" };
    }

    const invoice = request.invoiceId as InvoiceType;
    const client = request.clientId as ClientType;

    const confirmedParts = parseDateParts(confirmedDate);
    if (!confirmedParts) {
      return { success: false, error: "Invalid confirmed date" };
    }

    // Calculate start time based on confirmed time
    const startDateTime = new Date(
      Date.UTC(
        confirmedParts.year,
        confirmedParts.month - 1,
        confirmedParts.day,
        confirmedTime.hour,
        confirmedTime.minute,
        0,
        0,
      ),
    );

    // Create the schedule
    const scheduleData = {
      invoiceRef: (invoice as any)?._id || request.invoiceId,
      jobTitle: invoice.jobTitle,
      location: String(invoice.location || "").trim(),
      startDateTime,
      assignedTechnicians: [], // Manager will assign later
      confirmed: false,
      hours: (invoice as any)?.estimatedHours || 4,
      onSiteContact: {
        name: request.onSiteContactName || "",
        phone: request.onSiteContactPhone || "",
      },
      accessInstructions: [
        request.parkingNotes,
        request.accessNotes,
        request.specialInstructions,
      ]
        .filter(Boolean)
        .join("\n"),
    };

    // Populate historical duration with centralized precedence.
    const historicalMinutes = await resolveHistoricalDurationForScheduleCreate({
      location: invoice.location,
    });
    if (historicalMinutes != null) {
      (scheduleData as any).historicalServiceDurationMinutes =
        historicalMinutes;
    }

    const schedule = new Schedule(scheduleData as unknown as ScheduleType);

    await schedule.save();

    const emailResult = await sendSchedulingConfirmationEmail({
      client,
      invoice,
      confirmedDate: startDateTime,
      confirmedTime,
    });

    if (!emailResult.success) {
      console.warn(
        "Scheduling confirmation email failed:",
        emailResult.error || "Unknown error",
      );
    }

    // Update the scheduling request
    await SchedulingRequest.findByIdAndUpdate(requestId, {
      status: "confirmed",
      reviewedAt: new Date(),
      reviewedBy: userId,
      reviewNotes: notes,
      confirmedScheduleId: schedule._id,
      confirmedDate: toUtcDateFromParts(confirmedParts),
      confirmedTime,
      confirmationEmailSent: emailResult.success,
      confirmationEmailSentAt: emailResult.success ? new Date() : undefined,
    });

    const schedulesForInvoice = await Schedule.countDocuments({
      invoiceRef: schedule.invoiceRef,
    });
    if (schedulesForInvoice === 1) {
      await syncInvoiceDateIssuedAndJobsDueSoon({
        invoiceId: schedule.invoiceRef.toString(),
        dateIssued: startDateTime,
      });
    }

    // Update JobsDueSoon to mark as scheduled
    await JobsDueSoon.findByIdAndUpdate(request.jobsDueSoonId, {
      isScheduled: true,
    });

    // Dismiss the scheduling request notification
    await dismissSchedulingRequestNotification(requestId);

    revalidatePath("/dashboard");
    revalidatePath("/schedule");

    return { success: true, scheduleId: schedule._id.toString() };
  } catch (error) {
    console.error("Error confirming scheduling request:", error);
    return { success: false, error: "Failed to confirm scheduling request" };
  }
}

/**
 * Send alternative time options to client when their choices don't work
 */
export async function sendSchedulingAlternatives(
  requestId: string,
  alternatives: Array<{ date: string; requestedTime: RequestedTime }>,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  await connectMongo();

  try {
    const { userId } = await requireAdmin();

    if (alternatives.length === 0) {
      return { success: false, error: "At least one alternative is required" };
    }

    const request = (await SchedulingRequest.findById(requestId)
      .populate("invoiceId", "jobTitle location estimatedHours")
      .populate("clientId", "clientName email emails phoneNumber")
      .lean()) as SchedulingRequestType | null;

    if (!request) {
      return { success: false, error: "Scheduling request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request has already been processed" };
    }

    const invoice = request.invoiceId as InvoiceType;
    const client = request.clientId as ClientType;

    const emailResult = await sendSchedulingAlternativesEmail({
      client,
      invoice,
      alternatives,
    });

    if (!emailResult.success) {
      console.warn(
        "Scheduling alternatives email failed:",
        emailResult.error || "Unknown error",
      );
      return {
        success: false,
        error: emailResult.error || "Failed to send alternatives",
      };
    }

    // Update request with alternatives
    await SchedulingRequest.findByIdAndUpdate(requestId, {
      status: "alternatives_sent",
      reviewedAt: new Date(),
      reviewedBy: userId,
      reviewNotes: notes,
      alternativesOffered: alternatives.map((alt) => ({
        date: new Date(alt.date),
        requestedTime: alt.requestedTime,
      })),
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error sending scheduling alternatives:", error);
    return { success: false, error: "Failed to send alternatives" };
  }
}

/**
 * Server action to refresh availability for a new requested time
 * Called when user changes custom time in the scheduling wizard
 */
export async function refreshAvailabilityAction(
  token: string,
  requestedTime: RequestedTime,
  estimatedHours: number = 4,
  requestedHistoricalServiceDurationMinutes?: number | null,
): Promise<DayAvailability[]> {
  await connectMongo();

  try {
    // Validate token first
    const jobsDueSoon = (await JobsDueSoon.findOne({
      schedulingToken: token,
      schedulingTokenExpiry: { $gt: new Date() },
    }).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return [];
    }

    // Get invoice for estimated hours
    const invoice = await Invoice.findById(jobsDueSoon.invoiceId)
      .select("estimatedHours location")
      .lean();
    const hours = (invoice as any)?.estimatedHours || estimatedHours;

    // Import dynamically to avoid circular dependency
    const { getAvailableDays, getSchedulingDateRange } =
      await import("../autoScheduling.data");
    const { startDate, endDate } = getSchedulingDateRange(jobsDueSoon.dateDue);

    return await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      requestedTime,
      hours,
      (invoice as any)?.location,
      requestedHistoricalServiceDurationMinutes,
    );
  } catch (error) {
    console.error("Error refreshing availability:", error);
    return [];
  }
}

/**
 * Get all invoices for a client to allow selection when confirming scheduling.
 * Returns invoices sorted by most recent first.
 */
export async function getClientInvoicesForScheduling(
  clientId: string,
): Promise<{
  success: boolean;
  invoices?: InvoiceType[];
  error?: string;
}> {
  await connectMongo();

  try {
    await requireAdmin();

    const invoices = await Invoice.find({ clientId })
      .sort({ dateIssued: -1 })
      .lean();

    return {
      success: true,
      invoices: JSON.parse(JSON.stringify(invoices)),
    };
  } catch (error) {
    console.error("Error getting client invoices:", error);
    return { success: false, error: "Failed to get client invoices" };
  }
}

interface InvoiceItemData {
  description: string;
  details?: string;
  price: number;
}

interface ConfirmWithInvoiceData {
  requestId: string;
  confirmedDate: string;
  confirmedTime: RequestedTime;
  sourceInvoiceId: string; // The invoice to copy data from
  assignedTechnicians?: string[];
  internalNotes?: string;
}

/**
 * Confirm a scheduling request and create a NEW invoice + schedule.
 * Copies ALL data from the selected source invoice including paymentReminders.
 */
export async function confirmSchedulingWithInvoice(
  data: ConfirmWithInvoiceData,
): Promise<{
  success: boolean;
  invoiceId?: string;
  scheduleId?: string;
  error?: string;
}> {
  await connectMongo();

  try {
    const { userId } = await requireAdmin();

    // Fetch the source invoice to copy from
    const sourceInvoice = (await Invoice.findById(
      data.sourceInvoiceId,
    ).lean()) as InvoiceType | null;
    if (!sourceInvoice) {
      return { success: false, error: "Source invoice not found" };
    }

    const request = (await SchedulingRequest.findById(data.requestId)
      .populate("clientId", "clientName email emails phoneNumber prefix _id")
      .lean()) as SchedulingRequestType | null;

    if (!request) {
      return { success: false, error: "Scheduling request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request has already been processed" };
    }

    const client = request.clientId as ClientType;

    // Generate the next invoice number using the client's prefix
    const clientPrefix = (client as any).prefix;
    const latestInvoice = await Invoice.findOne({ clientId: client._id })
      .sort({ invoiceId: -1 })
      .lean();

    let newInvoiceNumber = 0;
    if (latestInvoice) {
      const latestId = (latestInvoice as any).invoiceId as string;
      const parts = latestId.split("-");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const latestNumber = parseInt(lastPart, 10);
        if (!isNaN(latestNumber)) {
          newInvoiceNumber = latestNumber + 1;
        }
      }
    }

    const invoiceIdStr = `${clientPrefix}-${newInvoiceNumber.toString().padStart(3, "0")}`;

    const confirmedParts = parseDateParts(data.confirmedDate);
    if (!confirmedParts) {
      return { success: false, error: "Invalid confirmed date" };
    }

    // Calculate dates - dateIssued is confirmed date, dateDue based on frequency
    const dateIssued = toUtcDateFromParts(confirmedParts);
    const frequency = sourceInvoice.frequency || 2;
    const dateDue =
      calculateDateDueFromParts(confirmedParts, frequency) ?? dateIssued;

    // Create the new invoice copying ALL fields from source
    const newInvoice = new Invoice({
      invoiceId: invoiceIdStr,
      clientId: client._id,
      // Copy all job-related fields from source
      jobTitle: sourceInvoice.jobTitle,
      location: sourceInvoice.location,
      items:
        sourceInvoice.items?.map((item) => ({
          description: item.description,
          details: item.details || "",
          price: item.price,
        })) || [],
      notes: sourceInvoice.notes || "",
      frequency: frequency,
      // Set new dates
      dateIssued,
      dateDue,
      status: "pending",
      // Copy payment reminder settings from source
      paymentReminders: sourceInvoice.paymentReminders
        ? {
            enabled: sourceInvoice.paymentReminders.enabled,
            frequency: sourceInvoice.paymentReminders.frequency,
            // Reset timing-related fields for the new invoice
            nextReminderDate:
              sourceInvoice.paymentReminders.enabled &&
              sourceInvoice.paymentReminders.frequency &&
              sourceInvoice.paymentReminders.frequency !== "none"
                ? calculateNextReminderDateFromParts(
                    confirmedParts,
                    sourceInvoice.paymentReminders.frequency,
                  )
                : undefined,
            lastReminderSent: undefined,
            reminderHistory: [],
          }
        : undefined,
    } as any);

    await newInvoice.save();

    // Create JobsDueSoon record for the new invoice
    await createJobsDueSoonForInvoice(
      newInvoice._id.toString(),
      client._id.toString(),
      sourceInvoice.jobTitle || "",
      dateDue,
    );

    // Calculate start time based on confirmed time
    const startDateTime = new Date(
      Date.UTC(
        confirmedParts.year,
        confirmedParts.month - 1,
        confirmedParts.day,
        data.confirmedTime.hour,
        data.confirmedTime.minute,
        0,
        0,
      ),
    );

    // Create the schedule linked to the new invoice
    const scheduleData = {
      invoiceRef: newInvoice._id,
      jobTitle: sourceInvoice.jobTitle,
      location: String(sourceInvoice.location || "").trim(),
      startDateTime,
      assignedTechnicians:
        data.assignedTechnicians?.filter(
          (technicianId) => typeof technicianId === "string" && technicianId,
        ) || [],
      confirmed: false,
      hours: (sourceInvoice as any)?.estimatedHours || 4,
      onSiteContact: {
        name: request.onSiteContactName || "",
        phone: request.onSiteContactPhone || "",
      },
      accessInstructions: [
        request.parkingNotes,
        request.accessNotes,
        request.specialInstructions,
      ]
        .filter(Boolean)
        .join("\n"),
    };

    // Populate historical duration with centralized precedence.
    const historicalMinutes2 = await resolveHistoricalDurationForScheduleCreate(
      {
        location: sourceInvoice.location,
      },
    );
    if (historicalMinutes2 != null) {
      (scheduleData as any).historicalServiceDurationMinutes =
        historicalMinutes2;
    }

    const schedule = new Schedule(scheduleData as unknown as ScheduleType);
    await schedule.save();

    // Send confirmation email
    const emailResult = await sendSchedulingConfirmationEmail({
      client,
      invoice: sourceInvoice,
      confirmedDate: startDateTime,
      confirmedTime: data.confirmedTime,
    });

    if (!emailResult.success) {
      console.warn(
        "Scheduling confirmation email failed:",
        emailResult.error || "Unknown error",
      );
    }

    // Update the scheduling request
    await SchedulingRequest.findByIdAndUpdate(data.requestId, {
      status: "confirmed",
      reviewedAt: new Date(),
      reviewedBy: userId,
      reviewNotes: data.internalNotes,
      confirmedScheduleId: schedule._id,
      confirmedDate: toUtcDateFromParts(confirmedParts),
      confirmedTime: data.confirmedTime,
      confirmationEmailSent: emailResult.success,
      confirmationEmailSentAt: emailResult.success ? new Date() : undefined,
    });

    // Update JobsDueSoon to mark as scheduled
    await JobsDueSoon.findByIdAndUpdate(request.jobsDueSoonId, {
      isScheduled: true,
    });

    // Dismiss the scheduling request notification
    await dismissSchedulingRequestNotification(data.requestId);

    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    revalidatePath("/invoices");

    return {
      success: true,
      invoiceId: invoiceIdStr,
      scheduleId: schedule._id.toString(),
    };
  } catch (error) {
    console.error("Error confirming scheduling with invoice:", error);
    return {
      success: false,
      error: "Failed to confirm scheduling request",
    };
  }
}
