import connectMongo from "./connect";
import {
  Client,
  Invoice,
  Availability,
  TimeOffRequest,
} from "../../models/reactDataSchema";
import { formatPhoneNumber, escapeRegex } from "./utils";
import {
  ClientType,
  Holiday,
  HolidayResponse,
  OBSERVANCES,
  InvoiceType,
  AvailabilityType,
  TimeOffRequestType,
} from "./typeDefinitions";

export const fetchAllClients = async () => {
  await connectMongo();
  try {
    const clients = await Client.find();
    return clients.map((client) => ({
      _id: client._id.toString(),
      clientName: client.clientName,
      email: client.email,
      phoneNumber: formatPhoneNumber(client.phoneNumber),
      prefix: client.prefix,
      notes: client.notes,
    }));
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Failed to fetch all clients");
  }
};

export const fetchClientById = async (
  clientId: string,
): Promise<ClientType> => {
  await connectMongo();
  try {
    const client = await Client.findOne({ _id: clientId }).lean<ClientType>();
    if (!client) {
      throw new Error("Client not found");
    }
    const clientData: ClientType = {
      _id: typeof client._id === "string" ? client._id : client._id.toString(),
      clientName: client.clientName,
      email: client.email,
      emails: client.emails,
      phoneNumber: formatPhoneNumber(client.phoneNumber),
      prefix: client.prefix,
      notes: client.notes,
    };
    return clientData;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Client could not be found by Id");
  }
};

export const fetchClientInvoices = async (clientId: string) => {
  await connectMongo();
  try {
    const invoices = await Invoice.find({ clientId: clientId })
      .sort({ invoiceId: -1 })
      .lean<InvoiceType[]>();

    return invoices.map((invoice) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
    }));
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Client Invoices could not be found by Id");
  }
};

export const fetchAllInvoices = async () => {
  await connectMongo();
  try {
    const invoices = await Invoice.find();

    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    return invoices.map((invoice) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      // @ts-ignore
      dateIssued: invoice.dateIssued.toISOString(),
      // @ts-ignore
      dateDue: invoice.dateDue.toISOString(),
      items: formattedItems(invoice.items),
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
      status: invoice.status,
      clientId: invoice.clientId.toString(),
    }));
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Failed to fetch all invoices");
  }
};

/**
 * Fetch only pending and overdue invoices for scheduling
 * Used by AddJob modal for lazy loading
 */
export const fetchPendingInvoices = async () => {
  await connectMongo();
  try {
    const invoices = await Invoice.find({
      status: { $in: ["pending", "overdue"] },
    }).sort({ dateIssued: -1 });

    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    return invoices.map((invoice) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      // @ts-ignore
      dateIssued: invoice.dateIssued.toISOString(),
      // @ts-ignore
      dateDue: invoice.dateDue.toISOString(),
      items: formattedItems(invoice.items),
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
      status: invoice.status,
      clientId: invoice.clientId.toString(),
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch pending invoices");
  }
};

export const fetchInvoiceById = async (invoiceId: string) => {
  await connectMongo();
  try {
    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        details: item.details,
        price: parseFloat(item.price) || 0,
      }));

    const invoice = await Invoice.findOne({
      _id: invoiceId,
    }).lean<InvoiceType>();
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return {
      ...invoice,
      _id: invoice._id.toString(),
      // @ts-ignore
      dateDue: invoice.dateDue.toISOString().split("T")[0],
      // @ts-ignore
      dateIssued: invoice.dateIssued.toISOString().split("T")[0],
      clientId: invoice.clientId.toString(),
      items: formattedItems(invoice.items),
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
        : undefined,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Invoice could not be found by Id");
  }
};

const ITEMS_PER_PAGE = 7;

export async function fetchFilteredClients(
  query: string,
  currentPage: number,
  sort: 1 | -1,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const escapedQuery = escapeRegex(query);
  let matchQuery = {
    $or: [
      { clientName: { $regex: escapedQuery, $options: "i" } },
      { email: { $regex: escapedQuery, $options: "i" } },
      { phoneNumber: { $regex: escapedQuery, $options: "i" } },
      { notes: { $regex: escapedQuery, $options: "i" } },
    ],
  };

  const sortQuery = { clientName: Number(sort) };

  try {
    const clients = await Client.aggregate([
      { $match: matchQuery },
      // @ts-ignore
      { $sort: sortQuery },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE },
    ]);

    return clients;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch clients.");
  }
}

export async function fetchClientsPages(query: string) {
  await connectMongo();
  try {
    const escapedQuery = escapeRegex(query);
    const matchQuery = {
      $or: [
        { clientName: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: escapedQuery, $options: "i" } },
        { phoneNumber: { $regex: escapedQuery, $options: "i" } },
        { notes: { $regex: escapedQuery, $options: "i" } },
      ],
    };

    const countResult = await Client.aggregate([
      { $match: matchQuery },
      { $count: "total" },
    ]);

    const totalClients = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalClients / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of clients.");
  }
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  filter: string,
  sort: string,
) {
  await connectMongo();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const escapedQuery = escapeRegex(query);

  let matchQuery: any = {
    $or: [
      { invoiceId: { $regex: escapedQuery, $options: "i" } },
      { jobTitle: { $regex: escapedQuery, $options: "i" } },
    ],
  };

  let sortQuery: any = { invoiceId: 1, jobTitle: 1 };

  if (filter === "pending") {
    matchQuery.status = { $regex: filter, $options: "i" };
  }
  if (sort === "dateIssuedasc") {
    sortQuery = { dateIssued: 1 };
  }

  if (sort === "dateIssueddes") {
    sortQuery = { dateIssued: -1 };
  }

  try {
    const invoices = await Invoice.aggregate([
      { $match: matchQuery },
      { $sort: sortQuery },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE },
    ]);

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(
  query: string,
  filter: string,
  sort: string,
) {
  await connectMongo();
  try {
    const escapedQuery = escapeRegex(query);
    let matchQuery: any = {
      $or: [
        { invoiceId: { $regex: escapedQuery, $options: "i" } },
        { jobTitle: { $regex: escapedQuery, $options: "i" } },
      ],
    };

    let sortQuery: any = { invoiceId: 1, jobTitle: 1 };

    if (filter === "pending") {
      matchQuery.status = { $regex: filter, $options: "i" };
    }
    if (sort === "dateIssuedasc") {
      sortQuery = { dateIssued: 1 };
    }

    if (sort === "dateIssueddes") {
      sortQuery = { dateIssued: -1 };
    }

    const countResult = await Invoice.aggregate([
      { $match: matchQuery },
      { $count: "total" },
    ]);

    const totalInvoices = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalInvoices / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export const fetchHolidays = async (): Promise<Holiday[]> => {
  try {
    const response = await fetch(
      `https://canada-holidays.ca/api/v1/provinces/BC`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch holidays");
    }

    const data: HolidayResponse = await response.json();

    // Mark statutory holidays
    const statutoryHolidays = data.province.holidays.map((holiday) => ({
      ...holiday,
      type: "statutory" as const,
    }));

    // Combine statutory holidays with observances
    const allHolidays = [...statutoryHolidays, ...OBSERVANCES];

    // Sort by date
    return allHolidays.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
};

/**
 * Fetch all technician availability
 */
export async function fetchTechnicianAvailability(): Promise<
  AvailabilityType[]
> {
  await connectMongo();
  try {
    const availability = await Availability.find().lean<AvailabilityType[]>();
    return JSON.parse(JSON.stringify(availability));
  } catch (error) {
    console.error("Error fetching availability:", error);
    throw new Error("Failed to fetch technician availability");
  }
}

/**
 * Fetch availability for a specific technician
 */
export async function fetchTechnicianAvailabilityById(
  technicianId: string,
): Promise<AvailabilityType[]> {
  await connectMongo();
  try {
    const availability = await Availability.find({ technicianId }).lean<
      AvailabilityType[]
    >();
    return JSON.parse(JSON.stringify(availability));
  } catch (error) {
    console.error("Error fetching technician availability:", error);
    throw new Error("Failed to fetch technician availability");
  }
}

/**
 * Check if a technician is available at a specific date and time
 */
export async function isTechnicianAvailable(
  technicianId: string,
  date: Date,
  startTime?: string,
  endTime?: string,
): Promise<boolean> {
  await connectMongo();
  try {
    const dayOfWeek = date.getDay();

    // Check for specific date blocks
    const specificDateBlock = await Availability.findOne({
      technicianId,
      specificDate: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    });

    if (specificDateBlock) {
      return false; // Unavailable due to specific date block
    }

    // Check for recurring patterns
    const recurringBlocks = await Availability.find({
      technicianId,
      isRecurring: true,
      dayOfWeek,
    });

    if (recurringBlocks.length > 0) {
      if (startTime && endTime) {
        // Check for time conflicts
        const [reqStart] = startTime.split(":").map(Number);
        const [reqEnd] = endTime.split(":").map(Number);

        for (const block of recurringBlocks) {
          if (block.isFullDay) {
            return false; // Full day unavailable
          }

          const [blockStart] = block.startTime.split(":").map(Number);
          const [blockEnd] = block.endTime.split(":").map(Number);

          // Check if time ranges overlap
          if (
            reqStart &&
            reqEnd &&
            blockStart &&
            blockEnd &&
            reqStart < blockEnd &&
            reqEnd > blockStart
          ) {
            return false; // Time conflict
          }
        }
      } else {
        // If no specific time provided, check for any blocks
        const hasFullDayBlock = recurringBlocks.some((b) => b.isFullDay);
        if (hasFullDayBlock) {
          return false;
        }
      }
    }

    return true; // Available
  } catch (error) {
    console.error("Error checking technician availability:", error);
    throw new Error("Failed to check technician availability");
  }
}

/**
 * Fetch all pending time-off requests
 */
export async function fetchPendingTimeOffRequests(): Promise<
  TimeOffRequestType[]
> {
  await connectMongo();
  try {
    const requests = await TimeOffRequest.find({ status: "pending" })
      .sort({ requestedAt: -1 })
      .lean<TimeOffRequestType[]>();

    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    console.error("Error fetching pending time-off requests:", error);
    throw new Error("Failed to fetch pending time-off requests");
  }
}

/**
 * Fetch all time-off requests with optional filtering
 */
export async function fetchTimeOffRequests(
  status?: "pending" | "approved" | "rejected",
): Promise<TimeOffRequestType[]> {
  await connectMongo();
  try {
    const query = status ? { status } : {};
    const requests = await TimeOffRequest.find(query)
      .sort({ requestedAt: -1 })
      .lean<TimeOffRequestType[]>();

    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    console.error("Error fetching time-off requests:", error);
    throw new Error("Failed to fetch time-off requests");
  }
}

/**
 * Get count of pending time-off requests
 * Useful for badge notification
 */
export async function getPendingTimeOffCount(): Promise<number> {
  await connectMongo();
  try {
    const count = await TimeOffRequest.countDocuments({ status: "pending" });
    return count;
  } catch (error) {
    console.error("Error getting pending time-off count:", error);
    return 0;
  }
}
