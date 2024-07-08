import connectMongo from "./connect";
import { unstable_noStore as noStore } from "next/cache";
import {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
} from "../../models/reactDataSchema";
import { revalidatePath } from "next/cache";
import { formatPhoneNumber } from "./utils";
import { DueInvoiceType, InvoiceType } from "./typeDefinitions";
import { monthNameToNumber } from "./utils";

export const fetchDueInvoices = async ({
  month,
  year,
}: {
  month: string | undefined;
  year: string | number;
}) => {
  await connectMongo();

  const monthNumber = month
    ? monthNameToNumber(month)
    : new Date().getMonth() + 1;

  try {
    const dueInvoices = await Invoice.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$dateDue" }, year] },
          { $eq: [{ $month: "$dateDue" }, monthNumber] },
        ],
      },
    });

    await createOrUpdateJobsDueSoon(dueInvoices);

    const unscheduledJobs = await JobsDueSoon.find({
      isScheduled: false,
      $expr: {
        $and: [
          { $eq: [{ $year: "$dateDue" }, year] },
          { $eq: [{ $month: "$dateDue" }, monthNumber] },
        ],
      },
    }).sort({ dateDue: 1 });

    return await checkEmailAndNotesPresence(
      unscheduledJobs.map((job) => ({
        clientId: job.clientId.toString(),
        invoiceId: job.invoiceId,
        jobTitle: job.jobTitle,
        dateDue: job.dateDue.toISOString(),
        isScheduled: job.isScheduled,
        emailSent: job.emailSent,
      })),
    );
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch due invoices.");
  }
};

export const createOrUpdateJobsDueSoon = async (dueInvoices: InvoiceType[]) => {
  await connectMongo();

  const jobsDueSoonPromises = dueInvoices.map(async (invoice) => {
    const { _id, jobTitle, dateDue } = invoice;

    let jobExists = await JobsDueSoon.findOne({
      invoiceId: _id.toString(),
    });

    if (!jobExists) {
      jobExists = await JobsDueSoon.create({
        clientId: invoice.clientId,
        invoiceId: _id.toString(),
        jobTitle,
        dateDue,
        isScheduled: false,
        emailSent: false,
      });
    }
  });

  await Promise.all(jobsDueSoonPromises);

  revalidatePath("/dashboard");
};

export const getClientCount = async () => {
  await connectMongo();

  try {
    const count = await Client.countDocuments();
    return count;
  } catch (error) {
    console.error("Database Error:", error);
    Error("Failed to fetch client count");
  }
};

export const getOverDueInvoiceAmount = async () => {
  await connectMongo();
  try {
    const result = await Invoice.aggregate([
      { $match: { status: "overdue" } },
      { $unwind: "$items" },
      {
        $group: { _id: null, totalAmount: { $sum: "$items.price" } },
      },
    ]);
    let totalAmount = result.length > 0 ? result[0].totalAmount : 0;
    return (totalAmount += totalAmount * 0.05);
  } catch (error) {
    console.error("Database Error:", error);
    Error("Failed to fetch overdue invoice amount");
  }
};

export const getPendingInvoiceAmount = async () => {
  await connectMongo();
  try {
    const result = await Invoice.aggregate([
      { $match: { status: "pending" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$items.price" },
        },
      },
    ]);
    let totalAmount = result.length > 0 ? result[0].totalAmount : 0;
    return (totalAmount += totalAmount * 0.05);
  } catch (error) {
    console.error("Database Error:", error);
    Error("Failed to fetch pending invoice amount");
  }
};

export const checkEmailAndNotesPresence = async (dueInvoices) => {
  await connectMongo();

  try {
    const clientIds = dueInvoices.map((invoice) => invoice.clientId);
    const invoiceIds = dueInvoices.map((invoice) => invoice.invoiceId);

    const clients = await Client.find({ _id: { $in: clientIds } });
    const invoices = await Invoice.find({ _id: { $in: invoiceIds } });

    const clientEmailMap = clients.reduce((map, client) => {
      map[client._id.toString()] = client.email ? true : false;
      return map;
    }, {});

    const invoiceNotesMap = invoices.reduce((map, invoice) => {
      map[invoice._id.toString()] = invoice.notes ? true : false;
      return map;
    }, {});

    const updatedDueInvoices = dueInvoices.map((invoice) => {
      const emailExists = clientEmailMap[invoice.clientId];
      const notesExists = invoiceNotesMap[invoice.invoiceId];
      return { ...invoice, emailExists, notesExists };
    });

    return updatedDueInvoices;
  } catch (error) {
    console.error("Error finding invoices and clients:", error);
    throw new Error("Failed to check email presence for due invoices.");
  }
};

export const fetchYearlySalesData = async () => {
  await connectMongo();
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const matchCurrentYear = {
    $match: {
      dateIssued: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    },
  };

  const matchLastYear = {
    $match: {
      dateIssued: {
        $gte: new Date(`${lastYear}-01-01`),
        $lte: new Date(`${lastYear}-12-31`),
      },
    },
  };

  const group = {
    $group: {
      _id: { month: { $month: "$dateIssued" } },
      totalSales: { $sum: { $sum: "$items.price" } },
    },
  };

  const sortByMonth = { $sort: { "_id.month": 1 } };

  const currentYearSales = await Invoice.aggregate([
    matchCurrentYear,
    group,
    sortByMonth,
  ]);

  const lastYearSales = await Invoice.aggregate([
    matchLastYear,
    group,
    sortByMonth,
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const salesData = months.map((month) => {
    const currentYearSale = currentYearSales.find(
      (sale) => sale._id.month === month,
    );
    const lastYearSale = lastYearSales.find((sale) => sale._id.month === month);
    return {
      date:
        new Date(currentYear, month - 1, 1).toLocaleString("default", {
          month: "short",
        }) +
        " " +
        currentYear.toString().slice(-2),
      "This Year": currentYearSale ? currentYearSale.totalSales : 0,
      "Last Year": lastYearSale ? lastYearSale.totalSales : 0,
    };
  });

  return salesData;
};

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

export const fetchClientById = async (clientId) => {
  await connectMongo();
  try {
    const client = await Client.findOne({ _id: clientId }).lean();
    client._id = client._id.toString();
    client.phoneNumber = formatPhoneNumber(client.phoneNumber);
    return client;
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Client could not be found by Id");
  }
};

export const fetchClientInvoices = async (clientId) => {
  await connectMongo();
  try {
    const invoices = await Invoice.find({ clientId: clientId }).lean();

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

    const formattedItems = (items) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    return invoices.map((invoice) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      dateIssued: invoice.dateIssued.toISOString(),
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

export const fetchInvoiceById = async (invoiceId) => {
  await connectMongo();
  try {
    const formattedItems = (items) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    const invoice = await Invoice.findOne({ _id: invoiceId }).lean();
    invoice._id = invoice._id.toString();
    invoice.dateDue = invoice.dateDue.toISOString().split("T")[0];
    invoice.dateIssued = invoice.dateIssued.toISOString().split("T")[0];
    invoice.clientId = invoice.clientId.toString();
    invoice.items = formattedItems(invoice.items);
    return invoice;
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Invoice could not be found by Id");
  }
};

export const fetchAllScheduledJobs = async () => {
  await connectMongo();
  try {
    const scheduledJobs = await Schedule.find();
    return scheduledJobs.map((job) => ({
      _id: job._id.toString(),
      invoiceRef: job.invoiceRef.toString(),
      jobTitle: job.jobTitle,
      location: job.location,
      assignedTechnician: job.assignedTechnician,
      startDateTime: job.startDateTime,
      confirmed: job.confirmed,
    }));
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Failed to fetch all scheduled jobs");
    return [];
  }
};

const ITEMS_PER_PAGE = 10;

export async function fetchFilteredClients(
  query: string,
  currentPage: number,
  sort: 1 | -1,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  let matchQuery = {
    $or: [
      { clientName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phoneNumber: { $regex: query, $options: "i" } },
      { notes: { $regex: query, $options: "i" } },
    ],
  };

  try {
    const clients = await Client.aggregate([
      { $match: matchQuery },
      { $sort: { clientName: Number(sort) } },
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
    const matchQuery = {
      $or: [
        { clientName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phoneNumber: { $regex: query, $options: "i" } },
        { notes: { $regex: query, $options: "i" } },
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
  statusFilter: string,
) {
  await connectMongo();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const matchQuery = {
    $or: [
      { invoiceId: { $regex: query, $options: "i" } },
      { jobTitle: { $regex: query, $options: "i" } },
      { status: { $regex: query, $options: "i" } },
    ],
  };

  if (statusFilter) {
    matchQuery.$and = [{ status: statusFilter }];
  }


  try {
    const invoices = await Invoice.aggregate([
      { $match: matchQuery },
      { $sort: { jobTitle: 1 } },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE },
    ]);

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string, statusFilter: string) {
  await connectMongo();
  try {
    const matchQuery = {
      $or: [
        { invoiceId: { $regex: query, $options: 'i' } },
        { jobTitle: { $regex: query, $options: 'i' } },
        { status: { $regex: query, $options: 'i' } },
      ],
    };

    if (statusFilter) {
      matchQuery.$and = [{ status: statusFilter }];
    }

    const countResult = await Invoice.aggregate([
      { $match: matchQuery },
      { $count: 'total' },
    ]);

    const totalInvoices = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalInvoices / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}
