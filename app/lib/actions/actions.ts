"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  JobsDueSoon,
  Client,
  Invoice,
  Schedule,
} from "../../../models/reactDataSchema";
import { ClientType } from "../typeDefinitions";
import { calculateDueDate } from "../utils";


export async function updateInvoiceScheduleStatus(invoiceId: string) {
  await connectMongo();

  try {
    const updatedJob = await JobsDueSoon.findOneAndUpdate(
      { invoiceId },
      { $set: { isScheduled: true } },
      { new: true },
    );

    if (!updatedJob) {
      throw new Error("Invoice not found or update failed");
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice schedule status");
  }

  revalidatePath("/dashboard");
}

export async function deleteClient(clientId: string) {
  await connectMongo();
  try {
    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) {
      return { message: "Client not found" };
    }

    const invoices = await Invoice.find({ clientId: clientId });

    await Invoice.deleteMany({ clientId: clientId });

    await JobsDueSoon.deleteMany({ clientId: clientId });

    for (const invoice of invoices) {
      await Schedule.deleteMany({ invoiceRef: invoice._id });
    }

    await Client.findByIdAndDelete(clientId);
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to delete client and associated data",
    };
  }
  revalidatePath("/database");
  revalidatePath("/dashboard");
}

export async function updateClient(clientId: string, formData: any) {
  await connectMongo();
  try {
    await Client.findByIdAndUpdate(clientId, formData);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update client with id");
  }
  revalidatePath(`/database/${clientId}`);
}

export async function createClient(clientData: ClientType) {
  await connectMongo();
  try {
    const newClient = new Client(clientData);
    await newClient.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create client");
  }

  revalidatePath("/dashboard");
}

export async function deleteInvoice(invoiceId: string) {
  await connectMongo();
  try {
    const job = await JobsDueSoon.findOne({ invoiceId: invoiceId });
    if (job) {
      await JobsDueSoon.findByIdAndDelete(job._id);
    }
    const scheduledJob = await Schedule.findOne({ invoiceRef: invoiceId });
    if (scheduledJob) {
      await Schedule.findByIdAndDelete(scheduledJob._id);
    }
    await Invoice.findByIdAndDelete(invoiceId);
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to delete invoice and associated data",
    };
  }
  revalidatePath("/database");
  revalidatePath("/dashboard");
}

export async function createInvoice(invoiceData: any) {
  await connectMongo();
  try {
    // Find the invoice with the highest invoiceId for the client
    const latestInvoice = await Invoice.findOne({
      clientId: invoiceData.clientId,
    })
      .sort({ invoiceId: -1 })
      .exec();

    let newInvoiceNumber = 0; // Start at 0 for the first invoice (e.g., HUT-000)

    if (latestInvoice) {
      // Extract the numeric part from the latest invoiceId
      const latestNumber = parseInt(latestInvoice.invoiceId.split("-")[1] as string, 10);
      newInvoiceNumber = latestNumber + 1;
    }

    const newInvoiceId = `${invoiceData.prefix}-${newInvoiceNumber.toString().padStart(3, "0")}`;

    const newInvoiceData = { ...invoiceData, invoiceId: newInvoiceId };

    const newInvoice = new Invoice(newInvoiceData);
    await newInvoice.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice");
  }

  revalidatePath("/invoices");
}

export async function updateInvoice(invoiceId: any, formData: any) {
  await connectMongo();
  try {
    const currentInvoice = await Invoice.findById(invoiceId);

    await Invoice.findByIdAndUpdate(invoiceId, formData);

    let jobsDueSoonUpdate: any = {};

    if (
      formData.dateIssued &&
      formData.dateIssued !== currentInvoice?.dateIssued
    ) {
      const newDateDue = calculateDueDate(
        formData.dateIssued,
        formData.frequency,
      );
      jobsDueSoonUpdate.dateDue = newDateDue;
    }

    if (formData.jobTitle && formData.jobTitle !== currentInvoice?.jobTitle) {
      jobsDueSoonUpdate.jobTitle = formData.jobTitle;
    }

    if (Object.keys(jobsDueSoonUpdate).length > 0) {
      await JobsDueSoon.findOneAndUpdate(
        { invoiceId: invoiceId },
        jobsDueSoonUpdate,
      );
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice with id");
  }

  revalidatePath(`/invoices/${invoiceId}`);
}

export async function getMostRecentInvoice(clientId: string) {
  await connectMongo();
  try {
    const mostRecentInvoice = await Invoice.findOne({ clientId })
      .sort({ dateIssued: -1 })
      .lean();

    if (!mostRecentInvoice) {
      return null;
    }

    return {
      jobTitle: mostRecentInvoice.jobTitle,
      frequency: mostRecentInvoice.frequency,
      location: mostRecentInvoice.location,
      notes: mostRecentInvoice.notes,
      items: mostRecentInvoice.items.map((item: any) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function getClientInvoicesForAutofill(clientId: string) {
  await connectMongo();
  try {
    const invoices = await Invoice.find({ clientId })
      .sort({ dateIssued: -1 }) // Sort by date issued, most recent first
      .lean();

    if (!invoices || invoices.length === 0) {
      return [];
    }

    return invoices.map((invoice: any) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
      items: invoice.items.map((item: any) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      })),
      dateIssued:
        invoice.dateIssued instanceof Date
          ? invoice.dateIssued.toISOString().split("T")[0]
          : typeof invoice.dateIssued === "string"
            ? invoice.dateIssued
            : null,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}
