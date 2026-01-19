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
} from "../typeDefinitions";
import {
  createSchedulingRequestNotification,
  dismissSchedulingRequestNotification,
} from "./notifications.actions";

const postmark = require("postmark");

const CONTACT_PHONE = "604-273-8717";
const CONTACT_EMAIL = "adam@vancouverventcleaning.ca";

const DEFAULT_CONTACT_MODEL = {
  phone_number: CONTACT_PHONE,
  contact_email: CONTACT_EMAIL,
};

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

    if (!data.confirmationDetails.addressConfirmed) {
      return { success: false, error: "Please confirm the service address" };
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
      specialInstructions: data.confirmationDetails.specialInstructions || "",
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

      await createSchedulingRequestNotification({
        schedulingRequestId: request._id.toString(),
        clientName: client.clientName,
        jobTitle: invoice.jobTitle,
        primaryDate: formatDateStringUTC(data.primarySelection.date),
        primaryTime: formatTime(data.primarySelection.requestedTime),
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/client-portal/dashboard");

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
      .populate("invoiceId", "jobTitle location estimatedHours")
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

    // Calculate start time based on confirmed time
    const startDateTime = new Date(confirmedDate);
    startDateTime.setUTCHours(confirmedTime.hour, confirmedTime.minute, 0, 0);

    // Create the schedule
    const scheduleData = {
      invoiceRef: (invoice as any)?._id || request.invoiceId,
      jobTitle: invoice.jobTitle,
      location: invoice.location,
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
      confirmedDate: new Date(confirmedDate),
      confirmedTime,
      confirmationEmailSent: emailResult.success,
      confirmationEmailSentAt: emailResult.success ? new Date() : undefined,
    });

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
      .select("estimatedHours")
      .lean();
    const hours = (invoice as any)?.estimatedHours || estimatedHours;

    // Get availability for next 12 weeks
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    // Import getAvailableDays dynamically to avoid circular dependency
    const { getAvailableDays } = await import("../autoScheduling.data");

    return await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      requestedTime,
      hours,
    );
  } catch (error) {
    console.error("Error refreshing availability:", error);
    return [];
  }
}
