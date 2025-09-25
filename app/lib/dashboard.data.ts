"use server";

import connectMongo from "./connect";
import { Client, Invoice, JobsDueSoon } from "../../models/reactDataSchema";
import { formatDateUTC } from "./utils";
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
import { monthNameToNumber } from "./utils";

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

export const getScheduledCount = async (invoiceIds: string[]) => {
  await connectMongo();

  try {
    const count = await JobsDueSoon.countDocuments({
      invoiceId: { $in: invoiceIds },
      isScheduled: true,
    });

    return count;
  } catch (error) {
    console.error("Error getting scheduled count:", error);
    return 0;
  }
};

export const getUnscheduledCount = async (invoiceIds: string[]) => {
  await connectMongo();

  try {
    const count = await JobsDueSoon.countDocuments({
      invoiceId: { $in: invoiceIds },
      isScheduled: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unscheduled count:", error);
    return 0;
  }
};

export const checkScheduleStatus = async (
  dueInvoices: EmailAndNotesCheck[],
): Promise<DueInvoiceType[]> => {
  await connectMongo();

  try {
    const invoiceIds = dueInvoices.map((invoice) => invoice.invoiceId);
    const schedules = await JobsDueSoon.find({
      invoiceId: { $in: invoiceIds },
    });

    const scheduleMap = schedules.reduce(
      (map, schedule) => {
        map[schedule.invoiceId] = schedule.isScheduled;
        return map;
      },
      {} as Record<string, boolean>,
    );

    const updatedInvoices = dueInvoices.map((invoice) => ({
      ...invoice,
      _id: invoice.invoiceId,
      isScheduled: scheduleMap[invoice.invoiceId] || false,
    }));

    return updatedInvoices;
  } catch (error) {
    console.error("Error checking schedule status:", error);
    return dueInvoices.map((invoice) => ({
      ...invoice,
      _id: invoice.invoiceId,
    }));
  }
};

interface EmailAndNotesCheck extends Omit<DueInvoiceType, "_id"> {
  callHistory?: any[];
}

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
    const dueInvoices = await fetchDueInvoicesFromDB(monthNumber, numericYear);
    if (!dueInvoices || dueInvoices.length === 0) return [];

    await createOrUpdateJobsDueSoon(dueInvoices as any[]);
    const jobsDue = await fetchJobsDue(monthNumber, numericYear);
    if (!jobsDue || jobsDue.length === 0) return [];

    const processedJobs = processJobsDue(jobsDue);
    const jobsWithEmailAndNotes =
      await checkEmailAndNotesPresence(processedJobs);
    return jobsWithEmailAndNotes.map((job) => ({ ...job, _id: job.invoiceId }));
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
};

const fetchDueInvoicesFromDB = async (monthNumber: number, year: number) => {
  return await Invoice.find({
    $expr: {
      $and: [
        { $eq: [{ $year: "$dateDue" }, year] },
        { $eq: [{ $month: "$dateDue" }, monthNumber] },
      ],
    },
  }).lean();
};

const fetchJobsDue = async (monthNumber: number, year: number) => {
  const jobs = await JobsDueSoon.find({
    $expr: {
      $and: [
        { $eq: [{ $year: "$dateDue" }, year] },
        { $eq: [{ $month: "$dateDue" }, monthNumber] },
      ],
    },
  })
    .sort({ dateDue: 1 })
    .lean();

  return jobs.map((job) => ({
    ...job,
    dateDue: new Date(
      Date.UTC(
        new Date(job.dateDue).getUTCFullYear(),
        new Date(job.dateDue).getUTCMonth(),
        new Date(job.dateDue).getUTCDate(),
      ),
    ),
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
  })) as any[];
};

const processJobsDue = (jobsDue: JobsDueType[]): EmailAndNotesCheck[] => {
  return jobsDue.map((job) => ({
    clientId: job.clientId?.toString() as string,
    invoiceId: job.invoiceId,
    jobTitle: job.jobTitle,
    dateDue: job.dateDue.toISOString(),
    isScheduled: job.isScheduled,
    emailSent: job.emailSent,
    callHistory: (job as any).callHistory || [], // Include call history
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

export const checkEmailAndNotesPresence = async (
  dueInvoices: EmailAndNotesCheck[],
) => {
  await connectMongo();

  try {
    const { clients, invoices, jobsDueSoon } =
      await fetchClientsInvoicesAndJobsDue(dueInvoices);
    const clientEmailMap = createClientEmailMap(clients);
    const invoiceNotesMap = createInvoiceNotesMap(invoices);
    const emailSentMap = createEmailSentMap(jobsDueSoon);

    return dueInvoices.map((invoice) => ({
      ...invoice,
      emailExists:
        clientEmailMap[invoice.clientId?.toString() as string] || false,
      notesExists: invoiceNotesMap[invoice.invoiceId] || false,
      emailSent: emailSentMap[invoice.invoiceId] || false,
    }));
  } catch (error) {
    console.error("Error checking email and notes presence:", error);
    throw new Error("Failed to check email presence for due invoices.");
  }
};

const fetchClientsInvoicesAndJobsDue = async (
  dueInvoices: EmailAndNotesCheck[],
) => {
  const clientIds = dueInvoices.map((invoice) => invoice.clientId);
  const invoiceIds = dueInvoices.map((invoice) => invoice.invoiceId);

  const [clients, invoices, jobsDueSoon] = await Promise.all([
    Client.find({ _id: { $in: clientIds } }),
    Invoice.find({ _id: { $in: invoiceIds } }),
    JobsDueSoon.find({ invoiceId: { $in: invoiceIds } }),
  ]);

  return { clients, invoices, jobsDueSoon };
};

const createClientEmailMap = (clients: any[]) => {
  return clients.reduce<Record<string, boolean>>((map, client) => {
    map[client._id.toString()] = Boolean(client.email);
    return map;
  }, {});
};

const createInvoiceNotesMap = (invoices: any[]) => {
  return invoices.reduce<Record<string, boolean>>((map, invoice) => {
    map[invoice._id.toString()] = Boolean(invoice.notes);
    return map;
  }, {});
};

const createEmailSentMap = (jobsDueSoon: any[]) => {
  return jobsDueSoon.reduce<Record<string, boolean>>((map, job) => {
    map[job.invoiceId] = Boolean(job.emailSent);
    return map;
  }, {});
};

export const getClientCount = async () => {
  await connectMongo();
  try {
    return await Client.countDocuments();
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
      { $match: { status: "pending", dateIssued: { $lte: today } } },
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
      { $match: { status: "pending", dateIssued: { $lte: today } } },
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
            invoice.paymentReminders.reminderHistory?.map((entry: any) => ({
              sentAt:
                entry.sentAt instanceof Date
                  ? entry.sentAt.toISOString()
                  : String(entry.sentAt),
              emailTemplate: entry.emailTemplate,
              success: entry.success,
              sequence: entry.sequence,
              errorMessage: entry.errorMessage,
              // Explicitly exclude any MongoDB-specific properties
            })) || [],
        }
      : {
          enabled: false,
          frequency: "none",
        },
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
