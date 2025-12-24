"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Estimate } from "../../../models/reactDataSchema";
import { EstimateType } from "../typeDefinitions";
import { generateEstimateNumber } from "../estimates.data";
import { createInvoice } from "./actions";
import { calculateDueDate } from "../utils";

// Type for creating new estimates (without _id)
type CreateEstimateData = Omit<
  EstimateType,
  "_id" | "estimateNumber" | "createdDate"
>;

export async function createEstimate(estimateData: CreateEstimateData) {
  await connectMongo();
  try {
    const estimateNumber = await generateEstimateNumber();

    // Ensure all required fields are present and properly typed
    const estimateToSave = {
      ...estimateData,
      estimateNumber,
      createdDate: new Date(),
      // Ensure items array is properly structured
      items:
        estimateData.items?.map((item) => ({
          description: item.description,
          details: item.details || "",
          price: Number(item.price),
        })) || [],
      // Calculate totals from items with proper rounding
      subtotal:
        Math.round(
          (estimateData.items?.reduce(
            (sum: number, item: any) => sum + (Number(item.price) || 0),
            0,
          ) || 0) * 100,
        ) / 100,
      gst:
        Math.round(
          (estimateData.items?.reduce(
            (sum: number, item: any) => sum + (Number(item.price) || 0),
            0,
          ) || 0) *
            0.05 *
            100,
        ) / 100,
      total:
        Math.round(
          (estimateData.items?.reduce(
            (sum: number, item: any) => sum + (Number(item.price) || 0),
            0,
          ) || 0) *
            1.05 *
            100,
        ) / 100,
      // Ensure services array is properly structured
      services: estimateData.services || [],
      // Ensure status is valid
      status: estimateData.status || "draft",
    };

    const newEstimate = new Estimate(estimateToSave as any);
    await newEstimate.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create estimate");
  }

  revalidatePath("/estimates");
}

export async function updateEstimate(
  estimateId: string,
  estimateData: Partial<EstimateType>,
) {
  await connectMongo();

  try {
    // Clean and validate the update data
    const updateData: any = { ...estimateData };
    // Handle clientId - if empty string, set to null/undefined
    if (updateData.clientId === "" || updateData.clientId === null) {
      updateData.clientId = undefined;
    }

    // Ensure items array is properly structured if provided
    if (updateData.items) {
      updateData.items = updateData.items.map((item: any) => ({
        description: item.description,
        details: item.details || "",
        price: Number(item.price),
      }));

      // Calculate totals from items with proper rounding
      const subtotal =
        Math.round(
          updateData.items.reduce(
            (sum: number, item: any) => sum + (Number(item.price) || 0),
            0,
          ) * 100,
        ) / 100;
      const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
      const total = Math.round((subtotal + gst) * 100) / 100;

      updateData.subtotal = subtotal;
      updateData.gst = gst;
      updateData.total = total;
    }

    // Ensure services array is properly structured if provided
    if (updateData.services && !Array.isArray(updateData.services)) {
      updateData.services = [];
    }

    await Estimate.findByIdAndUpdate(estimateId, updateData);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update estimate");
  }

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${estimateId}`);
}

export async function deleteEstimate(estimateId: string) {
  await connectMongo();
  try {
    const estimateExists = await Estimate.exists({ _id: estimateId });
    if (!estimateExists) {
      return { message: "Estimate not found" };
    }

    await Estimate.findByIdAndDelete(estimateId);
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to delete estimate" };
  }

  revalidatePath("/estimates");
}

export async function updateEstimateStatus(
  estimateId: string,
  status: EstimateType["status"],
) {
  await connectMongo();
  try {
    await Estimate.findByIdAndUpdate(estimateId, { status });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update estimate status");
  }

  revalidatePath("/estimates");
}

// Type for invoice creation data from estimate conversion
interface InvoiceCreationData {
  jobTitle: string;
  location: string;
  frequency: number;
  dateIssued?: string; // yyyy-MM-dd format
  notes?: string;
  items: { description: string; details?: string; price: number }[];
}

// Type for client creation data from estimate conversion
interface ClientCreationData {
  clientName: string;
  email: string;
  emails?: { primary: string };
  phoneNumber: string;
  prefix: string;
  notes?: string;
}

// Type for optional schedule creation data
interface ScheduleCreationData {
  startDateTime?: Date;
  assignedTechnicians?: string[];
  technicianNotes?: string;
}

export async function convertEstimateToClientAndInvoice(
  estimateId: string,
  clientData: ClientCreationData,
  invoiceData: InvoiceCreationData,
  scheduleData?: ScheduleCreationData,
): Promise<{ clientId: string; invoiceId: string; scheduleId?: string }> {
  await connectMongo();

  // Validate required fields
  if (!clientData.clientName?.trim()) {
    throw new Error("Client name is required");
  }
  if (!clientData.email?.trim()) {
    throw new Error("Client email is required");
  }
  if (!clientData.phoneNumber?.trim()) {
    throw new Error("Client phone number is required");
  }
  if (!clientData.prefix?.trim()) {
    throw new Error("Invoice prefix is required");
  }
  if (!invoiceData.jobTitle?.trim()) {
    throw new Error("Job title is required");
  }
  if (!invoiceData.location?.trim()) {
    throw new Error("Location is required");
  }

  try {
    // Import Client, Invoice, and Schedule models
    const { Client, Invoice, Schedule } =
      await import("../../../models/reactDataSchema");

    // Step 1: Create the client
    const newClient = new Client({
      clientName: clientData.clientName.trim(),
      email: clientData.email.trim(),
      emails: { primary: clientData.email.trim() },
      phoneNumber: clientData.phoneNumber.trim(),
      prefix: clientData.prefix.trim().toUpperCase(),
      notes: clientData.notes?.trim() || "",
    } as any); // _id is auto-generated by Mongoose
    const savedClient = await newClient.save();
    const clientId = savedClient._id.toString();

    // Step 2: Create the invoice
    // Find the latest invoice for this client to generate the next invoice number
    const latestInvoice = await Invoice.findOne({ clientId: savedClient._id })
      .sort({ invoiceId: -1 })
      .exec();

    let newInvoiceNumber = 0;
    if (latestInvoice) {
      const latestNumber = parseInt(
        latestInvoice.invoiceId.split("-")[1] as string,
        10,
      );
      newInvoiceNumber = latestNumber + 1;
    }

    const invoiceIdStr = `${clientData.prefix.trim().toUpperCase()}-${newInvoiceNumber.toString().padStart(3, "0")}`;

    // Use passed dateIssued or default to today
    const dateIssued = invoiceData.dateIssued
      ? new Date(invoiceData.dateIssued)
      : new Date();

    // Calculate due date based on frequency (times per year)
    // Using calculateDueDate which correctly computes 12/frequency months
    const dateDueStr = calculateDueDate(
      dateIssued.toISOString().split("T")[0],
      invoiceData.frequency || 2,
    );
    // Parse dateDueStr as UTC to avoid timezone offset issues
    let dateDue: Date;
    if (dateDueStr) {
      const [year, month, day] = dateDueStr.split("-").map(Number);
      dateDue = new Date(Date.UTC(year!, month! - 1, day!));
    } else {
      dateDue = new Date(dateIssued);
    }

    const newInvoice = new Invoice({
      invoiceId: invoiceIdStr,
      clientId: savedClient._id,
      jobTitle: invoiceData.jobTitle.trim(),
      location: invoiceData.location.trim(),
      dateIssued,
      dateDue,
      frequency: invoiceData.frequency || 2,
      items: invoiceData.items.map((item) => ({
        description: item.description,
        details: item.details || "",
        price: Number(item.price),
      })),
      notes: invoiceData.notes?.trim() || "",
      status: "pending",
    } as any); // _id is auto-generated by Mongoose
    await newInvoice.save();

    // Step 3: Optionally create a schedule
    let scheduleId: string | undefined;
    if (scheduleData?.startDateTime) {
      // Convert local time to UTC while preserving the time values
      // (project uses "local time stored as UTC" pattern)
      const localDate = new Date(scheduleData.startDateTime);
      const startDateTimeUTC = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes(),
          localDate.getSeconds(),
        ),
      );
      const newSchedule = new Schedule({
        invoiceRef: newInvoice._id,
        jobTitle: invoiceData.jobTitle.trim(),
        location: invoiceData.location.trim(),
        startDateTime: startDateTimeUTC,
        assignedTechnicians: scheduleData.assignedTechnicians || [],
        technicianNotes: scheduleData.technicianNotes?.trim() || "",
        confirmed: false,
      } as any);
      const savedSchedule = await newSchedule.save();
      scheduleId = savedSchedule._id.toString();
    }

    // Step 4: Update the estimate with the converted invoice reference
    await Estimate.findByIdAndUpdate(estimateId, {
      convertedToInvoice: newInvoice._id,
    });

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);
    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    revalidatePath("/schedule");

    return { clientId, invoiceId: invoiceIdStr, scheduleId };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to convert estimate to client and invoice");
  }
}
