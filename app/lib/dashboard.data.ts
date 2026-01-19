"use server";

import connectMongo from "./connect";
import {
  Client,
  Invoice,
  JobsDueSoon,
  AuditLog,
} from "../../models/reactDataSchema";
import {
  DueInvoiceType,
  InvoiceType,
  JobsDueType,
  YearlySalesData,
  MongoMatchStage,
  MongoGroupStage,
  MongoSortStage,
  SalesAggregation,
} from "./typeDefinitions";
import {
  monthNameToNumber,
  formatDateShortMonthUTC,
  formatTimeUTC,
} from "./utils";
import { CALL_OUTCOME_LABELS } from "./callLogConstants";
import { getUserNames } from "./clerkUtils";

export const updateScheduleStatus = async (
  invoiceId: string,
  isScheduled: boolean,
) => {
  await connectMongo();

  try {
    const updatedJob = await JobsDueSoon.findOneAndUpdate(
      { invoiceId },
      { isScheduled },
      { new: true },
    );

    // Serialize the MongoDB document before returning it
    const serializedJob = JSON.parse(JSON.stringify(updatedJob));

    return serializedJob;
  } catch (error) {
    console.error("Error updating schedule status:", error);
    throw error;
  }
};

export const fetchDueInvoices = async ({
  month,
  year,
}: {
  month: string | undefined;
  year: string | number;
}): Promise<DueInvoiceType[]> => {
  await connectMongo();

  const monthNumber = month
    ? monthNameToNumber(month) || new Date().getMonth() + 1
    : new Date().getMonth() + 1;
  const numericYear = typeof year === "string" ? parseInt(year) : year;

  try {
    // First, ensure JobsDueSoon records exist for due invoices
    const dueInvoices = await fetchDueInvoicesFromDB(monthNumber, numericYear);
    if (!dueInvoices || dueInvoices.length === 0) return [];

    await createOrUpdateJobsDueSoon(dueInvoices as any[]);

    // Fetch jobs with all related data in one consolidated query
    // (includes _id, emailExists, notesExists, emailSent, callHistory)
    const jobsDue = await fetchJobsDue(monthNumber, numericYear);
    return jobsDue as DueInvoiceType[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
};

const fetchDueInvoicesFromDB = async (monthNumber: number, year: number) => {
  return await Invoice.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $eq: [{ $year: "$dateDue" }, year] },
            { $eq: [{ $month: "$dateDue" }, monthNumber] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "clients",
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    { $match: { "client.isArchived": { $ne: true } } },
  ]);
};

/**
 * Consolidated aggregation that fetches jobs due with all related data:
 * - JobsDueSoon _id (for scheduling links)
 * - Client email existence
 * - Invoice notes existence
 * - Properly serialized callHistory
 *
 * This eliminates the need for separate checkEmailAndNotesPresence
 * and checkScheduleStatus queries.
 */
const fetchJobsDue = async (monthNumber: number, year: number) => {
  const jobs = await JobsDueSoon.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $eq: [{ $year: "$dateDue" }, year] },
            { $eq: [{ $month: "$dateDue" }, monthNumber] },
          ],
        },
      },
    },
    // Lookup client for email existence and archive check
    {
      $lookup: {
        from: "clients",
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    { $match: { "client.isArchived": { $ne: true } } },
    // Lookup invoice for notes existence
    {
      $lookup: {
        from: "invoices",
        let: { invoiceId: "$invoiceId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: "$_id" }, "$$invoiceId"],
              },
            },
          },
          { $project: { notes: 1 } },
        ],
        as: "invoice",
      },
    },
    // Add computed fields for email/notes existence
    {
      $addFields: {
        emailExists: {
          $cond: {
            if: { $gt: [{ $size: "$client" }, 0] },
            then: {
              $and: [
                { $ne: [{ $arrayElemAt: ["$client.email", 0] }, null] },
                { $ne: [{ $arrayElemAt: ["$client.email", 0] }, ""] },
              ],
            },
            else: false,
          },
        },
        notesExists: {
          $cond: {
            if: { $gt: [{ $size: "$invoice" }, 0] },
            then: {
              $and: [
                { $ne: [{ $arrayElemAt: ["$invoice.notes", 0] }, null] },
                { $ne: [{ $arrayElemAt: ["$invoice.notes", 0] }, ""] },
              ],
            },
            else: false,
          },
        },
      },
    },
    // Remove lookup arrays from final output
    { $project: { client: 0, invoice: 0 } },
    { $sort: { dateDue: 1 } },
  ]);

  // Serialize and return in DueInvoiceType shape
  return jobs.map((job) => ({
    _id: job._id.toString(), // JobsDueSoon _id for scheduling links
    clientId: job.clientId?.toString(),
    invoiceId: job.invoiceId,
    jobTitle: job.jobTitle,
    dateDue: new Date(
      Date.UTC(
        new Date(job.dateDue).getUTCFullYear(),
        new Date(job.dateDue).getUTCMonth(),
        new Date(job.dateDue).getUTCDate(),
      ),
    ).toISOString(),
    isScheduled: job.isScheduled || false,
    emailSent: job.emailSent || false,
    emailExists: job.emailExists || false,
    notesExists: job.notesExists || false,
    // Properly serialize callHistory to avoid MongoDB ObjectId issues
    callHistory: job.callHistory
      ? job.callHistory.map((call: any) => ({
          _id: call._id?.toString() || null,
          callerId: String(call.callerId || ""),
          callerName: String(call.callerName || ""),
          timestamp:
            call.timestamp instanceof Date
              ? call.timestamp.toISOString()
              : String(call.timestamp || ""),
          outcome: String(call.outcome || ""),
          notes: String(call.notes || ""),
          followUpDate:
            call.followUpDate instanceof Date
              ? call.followUpDate.toISOString()
              : call.followUpDate
                ? String(call.followUpDate)
                : null,
          duration: call.duration ? Number(call.duration) : null,
        }))
      : [],
  }));
};

export const createOrUpdateJobsDueSoon = async (dueInvoices: InvoiceType[]) => {
  await connectMongo();

  const jobsDueSoonPromises = dueInvoices.map(async (invoice) => {
    const { _id, jobTitle, dateDue, clientId } = invoice;
    const existingJob = await JobsDueSoon.findOne({
      invoiceId: _id.toString(),
    });

    if (!existingJob) {
      await JobsDueSoon.create({
        clientId,
        invoiceId: _id.toString(),
        jobTitle,
        dateDue,
        isScheduled: false,
        emailSent: false,
      });
    }
  });

  await Promise.all(jobsDueSoonPromises);
};

export const getClientCount = async () => {
  await connectMongo();
  try {
    return await Client.countDocuments({ isArchived: { $ne: true } });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch client count");
  }
};

export const getOverDueInvoiceAmount = async () => {
  await connectMongo();
  try {
    const result = await Invoice.aggregate([
      { $match: { status: "overdue" } },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $match: { "client.isArchived": { $ne: true } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalAmount: { $sum: "$items.price" } } },
    ]);
    const baseAmount = result.length > 0 ? result[0].totalAmount : 0;
    return baseAmount + baseAmount * 0.05;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch overdue invoice amount");
  }
};

export const getPendingInvoiceAmount = async () => {
  await connectMongo();
  try {
    const now = new Date();
    // Use Eastern Time for business logic (adjust timezone as needed)
    const easternTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );
    const today = new Date(
      Date.UTC(
        easternTime.getFullYear(),
        easternTime.getMonth(),
        easternTime.getDate(),
      ),
    );

    const result = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["pending", "overdue"] },
          dateIssued: { $lte: today },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $match: { "client.isArchived": { $ne: true } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalAmount: { $sum: "$items.price" } } },
    ]);
    const baseAmount = result.length > 0 ? result[0].totalAmount : 0;

    return baseAmount + baseAmount * 0.05;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch pending invoice amount");
  }
};

export const getPendingInvoices = async () => {
  await connectMongo();
  try {
    const now = new Date();
    // Use Eastern Time for business logic (adjust timezone as needed)
    const easternTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );
    const today = new Date(
      Date.UTC(
        easternTime.getFullYear(),
        easternTime.getMonth(),
        easternTime.getDate(),
      ),
    );

    const pendingInvoices = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["pending", "overdue"] },
          dateIssued: { $lte: today },
        },
      },
      {
        $lookup: {
          from: "clients",
          let: { clientId: "$clientId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$clientId"] } } },
            {
              $project: {
                hasValidEmail: {
                  $and: [
                    { $ne: ["$email", null] },
                    { $ne: ["$email", ""] },
                    { $ne: [{ $type: "$email" }, "missing"] },
                  ],
                },
              },
            },
          ],
          as: "client",
        },
      },
      {
        $addFields: {
          emailExists: {
            $cond: {
              if: { $gt: [{ $size: "$client" }, 0] },
              then: { $arrayElemAt: ["$client.hasValidEmail", 0] },
              else: false,
            },
          },
        },
      },
      { $sort: { dateIssued: 1 } },
    ]);

    return formatPendingInvoices(pendingInvoices);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch pending invoices");
  }
};

const formatPendingInvoices = (invoices: any[]) => {
  return invoices.map((invoice) => ({
    _id: invoice._id.toString(),
    invoiceId: invoice.invoiceId,
    jobTitle: invoice.jobTitle,
    status: invoice.status,
    paymentReminders: invoice.paymentReminders
      ? {
          enabled: invoice.paymentReminders.enabled,
          frequency: invoice.paymentReminders.frequency,
          nextReminderDate:
            invoice.paymentReminders.nextReminderDate instanceof Date
              ? invoice.paymentReminders.nextReminderDate.toISOString()
              : invoice.paymentReminders.nextReminderDate,
          lastReminderSent:
            invoice.paymentReminders.lastReminderSent instanceof Date
              ? invoice.paymentReminders.lastReminderSent.toISOString()
              : invoice.paymentReminders.lastReminderSent,
          reminderHistory:
            invoice.paymentReminders.reminderHistory?.map((entry: any) => {
              // Create a new plain object without MongoDB properties
              const plainEntry: any = {};
              if (entry.sentAt !== undefined) {
                plainEntry.sentAt =
                  entry.sentAt instanceof Date
                    ? entry.sentAt.toISOString()
                    : String(entry.sentAt);
              }
              if (entry.emailTemplate !== undefined) {
                plainEntry.emailTemplate = entry.emailTemplate;
              }
              if (entry.success !== undefined) {
                plainEntry.success = entry.success;
              }
              if (entry.sequence !== undefined) {
                plainEntry.sequence = entry.sequence;
              }
              if (entry.errorMessage !== undefined) {
                plainEntry.errorMessage = entry.errorMessage;
              }
              return plainEntry;
            }) || [],
        }
      : {
          enabled: false,
          frequency: "none",
        },
    callHistory:
      invoice.callHistory?.map((call: any) => ({
        _id: call._id?.toString(),
        callerId: call.callerId,
        callerName: call.callerName,
        timestamp:
          call.timestamp instanceof Date
            ? call.timestamp.toISOString()
            : call.timestamp,
        outcome: call.outcome,
        notes: call.notes,
        followUpDate:
          call.followUpDate instanceof Date
            ? call.followUpDate.toISOString()
            : call.followUpDate,
        duration: call.duration,
      })) || [],
    emailExists: invoice.emailExists,
    dateIssued: invoice.dateIssued.toISOString().split("T")[0],
    amount: invoice.items.reduce(
      (acc: number, item: { price: number }) => acc + item.price,
      0,
    ),
  }));
};

export const fetchYearlySalesData = async (
  targetYear?: number,
): Promise<YearlySalesData[]> => {
  await connectMongo();
  const year = targetYear || new Date().getFullYear();
  const previousYear = year - 1;

  const matchCurrentYear: MongoMatchStage = {
    $match: {
      dateIssued: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      },
    },
  };

  const matchPreviousYear: MongoMatchStage = {
    $match: {
      dateIssued: {
        $gte: new Date(`${previousYear}-01-01`),
        $lte: new Date(`${previousYear}-12-31`),
      },
    },
  };

  const group: MongoGroupStage = {
    $group: {
      _id: { month: { $month: "$dateIssued" } },
      totalSales: { $sum: { $sum: "$items.price" } },
    },
  };

  const sortByMonth: MongoSortStage = { $sort: { "_id.month": 1 } };

  const currentYearSales = await Invoice.aggregate<SalesAggregation>([
    matchCurrentYear as any,
    group as any,
    sortByMonth,
  ]);

  const previousYearSales = await Invoice.aggregate<SalesAggregation>([
    matchPreviousYear as any,
    group as any,
    sortByMonth,
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const salesData: YearlySalesData[] = months.map((month) => {
    const currentYearSale = currentYearSales.find(
      (sale) => sale._id.month === month,
    );
    const previousYearSale = previousYearSales.find(
      (sale) => sale._id.month === month,
    );
    return {
      date:
        new Date(year, month - 1, 1).toLocaleString("default", {
          month: "short",
        }) +
        " " +
        year.toString().slice(-2),
      "Current Year": currentYearSale ? currentYearSale.totalSales : 0,
      "Previous Year": previousYearSale ? previousYearSale.totalSales : 0,
    };
  });

  return salesData;
};

export interface DisplayAction {
  _id: string;
  type: "audit" | "call";
  action: string;
  description: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  formattedTime: string;
  formattedTimeTitle: string;
  success: boolean;
  severity: "success" | "info" | "warning" | "error";
  invoiceId?: string; // Human-readable invoice ID for navigation
  metadata?: {
    clientName?: string;
    jobTitle?: string;
    callOutcome?: string;
  };
  details?: {
    newValue?: any;
    reason?: string;
    metadata?: any;
    error?: string;
  };
}

export const fetchRecentActions = async (
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string,
): Promise<DisplayAction[]> => {
  await connectMongo();

  try {
    // If no dates provided, default to current month
    let queryStartDate = startDate;
    let queryEndDate = endDate;

    if (!startDate || !endDate) {
      const now = new Date();
      queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      queryStartDate.setHours(0, 0, 0, 0);

      queryEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      queryEndDate.setHours(23, 59, 59, 999);
    }

    // Build the query filter
    const query: any = {
      timestamp: { $gte: queryStartDate, $lte: queryEndDate },
    };

    // Fetch recent audit logs based on date range
    let auditLogs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    // Fetch client names for metadata
    const clientIds = new Set<string>();
    const userIds = new Set<string>();

    auditLogs.forEach((log) => {
      if (log.details?.newValue?.clientId) {
        clientIds.add(log.details.newValue.clientId);
      }
      if (log.details?.metadata?.clientId) {
        clientIds.add(log.details.metadata.clientId);
      }
      // Collect all unique user IDs for Clerk lookup
      if (log.performedBy) {
        userIds.add(log.performedBy);
      }
    });

    const clients = await Client.find({
      _id: { $in: Array.from(clientIds) },
    })
      .select("_id clientName")
      .lean()
      .exec();

    const clientMap = new Map(
      clients.map((c: any) => [c._id?.toString(), c.clientName]),
    );

    // Fetch user names from Clerk
    const userNameMap = await getUserNames(Array.from(userIds));

    // Process audit logs
    const displayActions: DisplayAction[] = auditLogs.map((log) => {
      // Try to get clientId from newValue first, then from metadata
      let clientId = log.details?.newValue?.clientId;
      if (!clientId && log.details?.metadata?.clientId) {
        clientId = log.details.metadata.clientId;
      }
      const clientName = clientId
        ? clientMap.get(clientId.toString())
        : undefined;
      const timestamp = new Date(log.timestamp);
      const jobTitle =
        log.details?.newValue?.jobTitle || log.details?.metadata?.jobTitle;
      const { formatted, title } = formatTimestamp(timestamp);

      // Build rich description based on action type
      let description = formatActionDescription(log.action, clientName);

      if (log.action === "schedule_created" && log.details?.newValue) {
        const jobTitle = log.details.newValue.jobTitle || "Untitled";
        const location = log.details.newValue.location || "";
        const hours = log.details.newValue.hours || 0;
        const dateTime = new Date(log.details.newValue.startDateTime);
        const formattedDate = formatDateShortMonthUTC(dateTime, {
          includeYear: true,
        });
        const formattedTime = formatTimeUTC(dateTime);
        description = `Schedule Created: ${jobTitle} at ${location} on ${formattedDate} at ${formattedTime} for ${hours}h`;
      } else if (log.action === "schedule_confirmed" && log.details?.newValue) {
        const jobTitle = log.details.newValue.jobTitle || "Untitled";
        description = `Schedule Confirmed: ${jobTitle}`;
      } else if (
        log.action === "schedule_unconfirmed" &&
        log.details?.newValue
      ) {
        const jobTitle = log.details.newValue.jobTitle || "Untitled";
        description = `Schedule Unconfirmed: ${jobTitle}`;
      } else if (log.action === "invoice_created" && log.details?.newValue) {
        const jobTitle = log.details.newValue.jobTitle || "Untitled";
        description = `Invoice Created: ${jobTitle}`;
      } else if (log.action === "invoice_emailed" && log.details?.newValue) {
        const jobTitle = log.details.newValue.jobTitle || "Untitled";
        const clientEmail = log.details.newValue.clientEmail || "";
        description = `Invoice Sent: ${jobTitle} to ${clientEmail}`;
      }

      return {
        _id: log._id?.toString() || "",
        type: "audit",
        action: log.action,
        description,
        performedBy: log.performedBy,
        performedByName: userNameMap.get(log.performedBy) || log.performedBy,
        timestamp,
        formattedTime: formatted,
        formattedTimeTitle: title,
        success: log.success,
        severity: getActionSeverity(log.action),
        invoiceId: log.invoiceId, // Store the human-readable invoice ID
        metadata: {
          clientName,
          jobTitle,
        },
        details: {
          newValue: log.details?.newValue,
          reason: log.details?.reason,
          error: log.details?.error,
          metadata: log.details?.metadata
            ? {
                ...log.details.metadata,
                clientId:
                  log.details.metadata.clientId?.toString?.() ||
                  log.details.metadata.clientId,
              }
            : undefined,
        },
      };
    });

    // Enhance audit logs with notes for call_logged_job and call_logged_payment
    displayActions.forEach((action) => {
      if (
        action.action === "call_logged_job" ||
        action.action === "call_logged_payment"
      ) {
        const details = action.details;
        if (details?.newValue) {
          const outcome =
            (CALL_OUTCOME_LABELS as any)[details.newValue.outcome] ||
            details.newValue.outcome;
          const notes = details.newValue.notes
            ? ` - Notes: ${details.newValue.notes}`
            : "";

          if (action.action === "call_logged_job") {
            const jobTitle = details.metadata?.jobTitle || "Untitled";
            action.description = `Job Call Logged for ${jobTitle} - ${outcome}${notes}`;
            action.metadata = {
              ...action.metadata,
              jobTitle: jobTitle,
              callOutcome: outcome,
            };
          } else {
            // For payment calls, show "to" instead of "from"
            const clientName = action.metadata?.clientName || "Client";
            action.description = `Payment Call to ${clientName} - ${outcome}${notes}`;
            action.metadata = {
              ...action.metadata,
              callOutcome: outcome,
            };
          }
        }
      }
    });

    // Apply search filter if provided
    let filtered = displayActions;
    if (searchQuery && searchQuery.trim().length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = displayActions.filter((action) => {
        // Search in description
        if (action.description.toLowerCase().includes(lowerQuery)) return true;
        // Search in job title
        if (
          action.details?.newValue?.jobTitle?.toLowerCase().includes(lowerQuery)
        )
          return true;
        if (action.metadata?.jobTitle?.toLowerCase().includes(lowerQuery))
          return true;
        // Search in client name
        if (action.metadata?.clientName?.toLowerCase().includes(lowerQuery))
          return true;
        // Search in client email
        if (
          action.details?.newValue?.clientEmail
            ?.toLowerCase()
            .includes(lowerQuery)
        )
          return true;
        // Search in invoice ID
        if (
          action.details?.newValue?.invoiceId
            ?.toLowerCase()
            .includes(lowerQuery)
        )
          return true;
        // Search in action label
        if (
          formatActionDescription(action.action)
            .toLowerCase()
            .includes(lowerQuery)
        )
          return true;
        // Search in performed by name
        if (action.performedByName.toLowerCase().includes(lowerQuery))
          return true;
        // Search in location
        if (
          action.details?.newValue?.location?.toLowerCase().includes(lowerQuery)
        )
          return true;
        return false;
      });
    }

    // Sort by timestamp descending
    const sorted = filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // Fully serialize to ensure no ObjectIds or other non-serializable objects
    const serialized = JSON.parse(JSON.stringify(sorted));

    // Re-parse dates since JSON.stringify converts them to strings
    return serialized.map((action: any) => ({
      ...action,
      timestamp: new Date(action.timestamp),
    }));
  } catch (error) {
    console.error("Error fetching actions:", error);
    return [];
  }
};

const formatTimestamp = (date: Date): { formatted: string; title: string } => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  let formatted = "Just now";
  if (diffInMinutes >= 1 && diffInMinutes < 60) {
    formatted = `${diffInMinutes}m ago`;
  } else if (diffInHours >= 1 && diffInHours < 24) {
    formatted = `${diffInHours}h ago`;
  } else if (diffInDays >= 1 && diffInDays < 7) {
    formatted = `${diffInDays}d ago`;
  } else {
    formatted = formatDateShortMonthUTC(date, {
      includeYear: date.getUTCFullYear() !== now.getFullYear(),
    });
  }

  const title = date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return { formatted, title };
};

const formatActionDescription = (
  action: string,
  clientName?: string,
): string => {
  const labels: { [key: string]: string } = {
    invoice_created: "Invoice Created",
    invoice_emailed: "Invoice Sent",
    schedule_created: "Schedule Created",
    schedule_confirmed: "Schedule Confirmed",
    schedule_unconfirmed: "Schedule Unconfirmed",
    call_logged_job: "Job Call Logged",
    call_logged_payment: "Payment Call Logged",
    reminder_configured: "Reminder Configured",
    reminder_sent_auto: "Reminder Sent (Auto)",
    reminder_sent_manual: "Reminder Sent",
    reminder_failed: "Reminder Failed",
    payment_status_changed: "Payment Status Changed",
    payment_info_updated: "Payment Info Updated",
  };
  const baseLabel = labels[action] || action;
  return clientName ? `${baseLabel} for ${clientName}` : baseLabel;
};

const getActionSeverity = (
  action: string,
): "success" | "info" | "warning" | "error" => {
  if (
    action.includes("invoice_created") ||
    action.includes("invoice_emailed")
  ) {
    return "info";
  }
  if (
    action.includes("schedule_created") ||
    action.includes("schedule_confirmed")
  ) {
    return "success";
  }
  if (action.includes("schedule_unconfirmed")) {
    return "warning";
  }
  if (action.includes("call_logged")) {
    return "warning";
  }
  if (action.includes("reminder_sent")) {
    return "info";
  }
  if (action.includes("reminder_failed") || action.includes("failed")) {
    return "error";
  }
  return "info";
};

export interface AnalyticsMetrics {
  totalRevenue: number;
  pendingCount: number;
  overdueCount: number;
  activeClientCount: number;
  paidCount: number;
  jobsDueSoon: number;
}

export interface JobsDueDataType {
  invoicesWithSchedule: DueInvoiceType[];
  scheduledCount: number;
  unscheduledCount: number;
}

/**
 * Combined server function to fetch all jobs due data in a single request.
 * fetchDueInvoices now returns complete data with _id, emailExists, notesExists.
 */
export const fetchJobsDueData = async ({
  month,
  year,
}: {
  month: string | undefined;
  year: string | number;
}): Promise<JobsDueDataType> => {
  try {
    // fetchDueInvoices now returns complete data with JobsDueSoon _id
    const invoicesWithSchedule = await fetchDueInvoices({ month, year });

    if (!Array.isArray(invoicesWithSchedule)) {
      throw new Error("Failed to load invoices");
    }

    // Calculate counts from the already-fetched data
    const scheduledCount = invoicesWithSchedule.filter(
      (invoice) => invoice.isScheduled,
    ).length;
    const unscheduledCount = invoicesWithSchedule.filter(
      (invoice) => !invoice.isScheduled,
    ).length;

    return {
      invoicesWithSchedule,
      scheduledCount,
      unscheduledCount,
    };
  } catch (error) {
    console.error("Error fetching jobs due data:", error);
    return {
      invoicesWithSchedule: [],
      scheduledCount: 0,
      unscheduledCount: 0,
    };
  }
};

export const fetchAnalyticsMetrics = async (): Promise<AnalyticsMetrics> => {
  await connectMongo();

  try {
    // Calculate total revenue (all paid invoices)
    const paidInvoices = await Invoice.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSales: { $sum: "$items.price" } } },
    ]);
    const totalRevenue =
      paidInvoices.length > 0 ? paidInvoices[0].totalSales : 0;
    const revenueWithTax = totalRevenue + totalRevenue * 0.05;

    // Count pending invoices
    const pendingCount = await Invoice.countDocuments({ status: "pending" });

    // Count overdue invoices
    const overdueCount = await Invoice.countDocuments({ status: "overdue" });

    // Total active clients
    const activeClientCount = await Client.countDocuments();

    // Count paid invoices
    const paidCount = await Invoice.countDocuments({ status: "paid" });

    // Jobs due soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const jobsDueSoon = await JobsDueSoon.countDocuments({
      dateDue: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      },
      isScheduled: false,
    });

    return {
      totalRevenue: revenueWithTax,
      pendingCount,
      overdueCount,
      activeClientCount,
      paidCount,
      jobsDueSoon,
    };
  } catch (error) {
    console.error("Error fetching analytics metrics:", error);
    return {
      totalRevenue: 0,
      pendingCount: 0,
      overdueCount: 0,
      activeClientCount: 0,
      paidCount: 0,
      jobsDueSoon: 0,
    };
  }
};

export const getUnscheduledJobs = async () => {
  await connectMongo();
  try {
    const minDate = new Date("2024-01-01T00:00:00.000Z");
    const jobs = await JobsDueSoon.aggregate([
      { $match: { isScheduled: false, dateDue: { $gte: minDate } } },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $match: { "client.isArchived": { $ne: true } } },
      { $sort: { dateDue: 1 } },
    ]);

    return jobs.map((job: any) => ({
      _id: job._id.toString(),
      clientId: job.clientId?.toString(),
      invoiceId: job.invoiceId,
      jobTitle: job.jobTitle,
      dateDue:
        job.dateDue instanceof Date ? job.dateDue.toISOString() : job.dateDue,
      isScheduled: job.isScheduled,
      invoiceRef: job.invoiceRef,
    }));
  } catch (error) {
    console.error("Error fetching unscheduled jobs:", error);
    return [];
  }
};
