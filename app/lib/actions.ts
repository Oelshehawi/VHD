"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "./connect";
import {
  JobsDueSoon,
  Client,
  Invoice,
  Schedule,
} from "../../models/reactDataSchema";
import { ClientType, ScheduleType } from "./typeDefinitions";

export async function updateInvoiceScheduleStatus(invoiceId) {
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

export async function deleteClient(clientId) {
  await connectMongo();
  try {
    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) {
      return { message: "Client not found" };
    }

    await Invoice.deleteMany({ clientId: clientId });

    await JobsDueSoon.deleteMany({ clientId: clientId });

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

export async function updateClient(clientId, formData) {
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

export async function deleteInvoice(invoiceId) {
  await connectMongo();
  try {
    const job = await JobsDueSoon.findOne({ invoiceId: invoiceId });
    if (job) {
      await JobsDueSoon.findByIdAndDelete(job._id);
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

export async function createInvoice(invoiceData) {
  await connectMongo();
  try {
    const clientInvoices = await Invoice.find({
      clientId: invoiceData.clientId,
    });

    const invoiceNumber = clientInvoices.length;
    const invoiceId = `${invoiceData.prefix}-${invoiceNumber.toString().padStart(3, "0")}`;

    const newInvoiceData = { ...invoiceData, invoiceId };

    const newInvoice = new Invoice(newInvoiceData);
    await newInvoice.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice");
  }

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
}

export async function updateInvoice(invoiceId, formData) {
  await connectMongo();
  try {
    await Invoice.findByIdAndUpdate(invoiceId, formData);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice with id");
  }
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function createSchedule(scheduleData: ScheduleType) {
  await connectMongo();
  try {
    if (typeof scheduleData.startDateTime === "string") {
      scheduleData.startDateTime = new Date(
        scheduleData.startDateTime,
      ) as Date & string;
    }
    console.log(scheduleData);
    const newSchedule = new Schedule(scheduleData);
    await newSchedule.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create schedule");
  }

  revalidatePath("/schedule");
}

export const deleteJob = async (jobId: string) => {
  await connectMongo;
  try {
    await Schedule.findByIdAndDelete(jobId);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete job with id");
  }

  revalidatePath("/schedule");
};
