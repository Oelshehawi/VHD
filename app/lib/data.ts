import connectMongo from "./connect";
import {
  Client,
  Invoice,
} from "../../models/reactDataSchema";
import { formatPhoneNumber } from "./utils";



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

export const fetchClientById = async (clientId: string) => {
  await connectMongo();
  try {
    const client = await Client.findOne({ _id: clientId }).lean();
    if (!client) {
      throw new Error("Client not found");
    }
    client._id = client._id.toString();
    client.phoneNumber = formatPhoneNumber(client.phoneNumber);
    return client;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Client could not be found by Id");
  }
};

export const fetchClientInvoices = async (clientId: string) => {
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

export const fetchInvoiceById = async (invoiceId: string) => {
  await connectMongo();
  try {
    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    const invoice = await Invoice.findOne({ _id: invoiceId }).lean();
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    invoice._id = invoice._id.toString();
    // @ts-ignore
    invoice.dateDue = invoice.dateDue.toISOString().split("T")[0];
    // @ts-ignore
    invoice.dateIssued = invoice.dateIssued.toISOString().split("T")[0];  
    invoice.clientId = invoice.clientId.toString();
    invoice.items = formattedItems(invoice.items);
    return invoice;
  } catch (error) {
    console.error("Database Error:", Error);
    Error("Invoice could not be found by Id");
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
  filter: string,
  sort: string,
) {
  await connectMongo();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let matchQuery: any = {
    $or: [
      { invoiceId: { $regex: query, $options: "i" } },
      { jobTitle: { $regex: query, $options: "i" } },
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
    let matchQuery: any = {
      $or: [
        { invoiceId: { $regex: query, $options: "i" } },
        { jobTitle: { $regex: query, $options: "i" } },
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

export const fetchHolidays = async (): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams({
      country: "CA",
      year: new Date().getFullYear().toString(),
    });

    const response = await fetch(
      `https://api.api-ninjas.com/v1/holidays?${queryParams}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": process.env.HOLIDAYS_API_KEY!,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch holidays");
    }

    const data: any[] = await response.json();

    const allowedTypes: any[] = [
      "observance",
      "public_holiday",
      "common_local_holiday",
      "local_holiday",
      "major_holiday",
    ];

    const filteredHolidays = data.filter((holiday: any) =>
      allowedTypes.includes(holiday.type.toLowerCase() as any),
    );

    const manualHolidays: any[] = [
      {
        date: "2024-09-30",
        name: "National Day for Truth and Reconciliation",
        type: "public_holiday",
        country: "Canada",
        iso: "CA",
        year: 2024,
        day: "Monday",
      },
    ];

    return [...filteredHolidays, ...manualHolidays];
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
};
