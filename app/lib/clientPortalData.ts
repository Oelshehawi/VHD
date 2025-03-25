"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import connectMongo from "./connect";
import { ObjectId } from "mongodb";
import { Invoice, Report, Schedule } from "../../models/reactDataSchema";
import {
  InvoiceType,
  ReportType,
  ScheduleType,
  ClientType,
} from "./typeDefinitions";
import {
  fetchClientById as dataFetchClientById,
  fetchClientInvoices as dataFetchClientInvoices,
  fetchInvoiceById,
} from "./data";

/**
 * Fetch technician data by their Clerk ID
 */
export async function fetchTechnicianByClerkId(technicianId: string) {
  try {
    if (!technicianId) return null;

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(technicianId);

    if (!user) return null;

    return {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unknown",
      email: user.emailAddresses[0]?.emailAddress || "",
    };
  } catch (error) {
    console.error("Error fetching technician data:", error);
    return null;
  }
}

/**
 * Fetch client data for the portal
 */
export async function fetchClientData(clientId: string): Promise<ClientType> {
  try {
    // Verify this is a client portal request
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Use existing fetchClientById function from data.ts
    const client = await dataFetchClientById(clientId);

    // Create client object
    const clientData: ClientType = {
      _id: typeof client._id === "string" ? client._id : client._id.toString(),
      clientName: client.clientName,
      email: client.email,
      phoneNumber: client.phoneNumber,
      prefix: client.prefix,
      notes: client.notes,
    };

    return clientData;
  } catch (error) {
    console.error("Error fetching client data:", error);
    throw new Error("Failed to fetch client data");
  }
}

/**
 * Fetch client's upcoming service schedules
 */
export async function fetchClientUpcomingSchedules(
  clientId: string,
  limit = 5,
): Promise<ScheduleType[]> {
  // Verify client auth
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await connectMongo();
  try {
    const today = new Date();

    // First, get all invoices for this client
    const clientInvoices = await Invoice.find({
      clientId: new ObjectId(clientId),
    }).lean();

    // Get invoice IDs
    const invoiceIds = clientInvoices.map((invoice) => invoice._id);

    // Now find schedules that reference these invoices
    const schedules = await Schedule.find({
      invoiceRef: { $in: invoiceIds },
      startDateTime: { $gte: today },
    })
      .sort({ startDateTime: 1 })
      .limit(limit)
      .lean();

    return schedules.map((schedule: any) => ({
      _id: schedule._id.toString(),
      invoiceRef: schedule.invoiceRef ? schedule.invoiceRef.toString() : "",
      jobTitle: schedule.jobTitle || "",
      location: schedule.location || "",
      startDateTime: schedule.startDateTime.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      assignedTechnicians: schedule.assignedTechnicians || [],
      confirmed: schedule.confirmed || false,
      hours: schedule.hours || 0,
      payrollPeriod: schedule.payrollPeriod
        ? schedule.payrollPeriod.toString()
        : "",
      deadRun: schedule.deadRun || false,
      technicianNotes: schedule.technicianNotes || "",
      shifts: Array.isArray(schedule.shifts)
        ? schedule.shifts.map((shift: any) => ({
            _id: shift._id.toString(),
            technicianId: shift.technicianId || "",
            clockIn: shift.clockIn || new Date(),
            clockOut: shift.clockOut || new Date(),
            jobDetails: shift.jobDetails || "",
            hoursWorked: shift.hoursWorked || 0,
          }))
        : [],
      photos: Array.isArray(schedule.photos)
        ? schedule.photos.map((photo: any) => ({
            _id: photo._id.toString(),
            url: photo.url || "",
            timestamp: photo.timestamp || new Date(),
            technicianId: photo.technicianId || "",
            type: photo.type || "before",
          }))
        : undefined,
      signature: schedule.signature
        ? {
            _id: schedule.signature._id.toString(),
            url: schedule.signature.url || "",
            timestamp: schedule.signature.timestamp || new Date(),
            signerName: schedule.signature.signerName || "",
            technicianId: schedule.signature.technicianId || "",
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching upcoming schedules:", error);
    throw new Error("Failed to fetch upcoming schedules");
  }
}

/**
 * Fetch client's past service schedules
 */
export async function fetchClientPastSchedules(
  clientId: string,
  limit = 5,
): Promise<ScheduleType[]> {
  // Verify client auth
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await connectMongo();
  try {
    const today = new Date();

    // First, get all invoices for this client
    const clientInvoices = await Invoice.find({
      clientId: new ObjectId(clientId),
    }).lean();

    // Get invoice IDs
    const invoiceIds = clientInvoices.map((invoice) => invoice._id);

    // Now find schedules that reference these invoices
    const schedules = await Schedule.find({
      invoiceRef: { $in: invoiceIds },
      startDateTime: { $lt: today },
    })
      .sort({ startDateTime: -1 })
      .limit(limit)
      .lean();

    return schedules.map((schedule: any) => ({
      _id: schedule._id.toString(),
      invoiceRef: schedule.invoiceRef ? schedule.invoiceRef.toString() : "",
      jobTitle: schedule.jobTitle || "",
      location: schedule.location || "",
      startDateTime: schedule.startDateTime.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      assignedTechnicians: schedule.assignedTechnicians || [],
      confirmed: schedule.confirmed || false,
      hours: schedule.hours || 0,
      payrollPeriod: schedule.payrollPeriod
        ? schedule.payrollPeriod.toString()
        : "",
      deadRun: schedule.deadRun || false,
      technicianNotes: schedule.technicianNotes || "",
      shifts: Array.isArray(schedule.shifts)
        ? schedule.shifts.map((shift: any) => ({
            _id: shift._id.toString(),
            technicianId: shift.technicianId || "",
            clockIn: shift.clockIn || new Date(),
            clockOut: shift.clockOut || new Date(),
            jobDetails: shift.jobDetails || "",
            hoursWorked: shift.hoursWorked || 0,
          }))
        : [],
      photos: Array.isArray(schedule.photos)
        ? schedule.photos.map((photo: any) => ({
            _id: photo._id.toString(),
            url: photo.url || "",
            timestamp: photo.timestamp || new Date(),
            technicianId: photo.technicianId || "",
            type: photo.type || "before",
          }))
        : undefined,
      signature: schedule.signature
        ? {
            _id: schedule.signature._id.toString(),
            url: schedule.signature.url || "",
            timestamp: schedule.signature.timestamp || new Date(),
            signerName: schedule.signature.signerName || "",
            technicianId: schedule.signature.technicianId || "",
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching past schedules:", error);
    throw new Error("Failed to fetch past schedules");
  }
}

/**
 * Fetch client's invoices
 */
export async function fetchClientInvoices(
  clientId: string,
  limit = 10,
): Promise<
  {
    _id: string;
    invoiceId: string;
    dateIssued: Date;
    totalAmount: number;
    status: string;
    jobTitle: string;
  }[]
> {
  // Verify client auth
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await connectMongo();
  try {
    const invoices = await Invoice.find({
      clientId: new ObjectId(clientId),
    })
      .sort({ dateIssued: -1 })
      .limit(limit)
      .lean();

    return invoices.map((invoice: any) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId || "",
      dateIssued: invoice.dateIssued.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      totalAmount:
        invoice.items?.reduce(
          (acc: number, item: any) => acc + (parseFloat(item.price) || 0),
          0,
        ) || 0,
      status: invoice.status || "pending",
      jobTitle: invoice.jobTitle || "",
    }));
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    throw new Error("Failed to fetch client invoices");
  }
}

/**
 * Fetch client's reports
 */
export async function fetchClientReports(
  clientId: string,
  limit = 10,
): Promise<ReportType[]> {
  // Verify client auth
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await connectMongo();
  try {
    // First, get all invoices for this client
    const clientInvoices = await Invoice.find({
      clientId: new ObjectId(clientId),
    }).lean();

    // Get invoice IDs
    const invoiceIds = clientInvoices.map((invoice) => invoice._id);

    // Find reports that reference these invoices
    const reports = await Report.find({
      invoiceId: { $in: invoiceIds },
    })
      .sort({ dateCompleted: -1 })
      .limit(limit)
      .lean();

    return reports.map((report: any) => ({
      _id: report._id.toString(),
      scheduleId: report.scheduleId ? report.scheduleId.toString() : "",
      invoiceId: report.invoiceId ? report.invoiceId.toString() : "",
      dateCompleted: report.dateCompleted.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      lastServiceDate: report.lastServiceDate
        ? report.lastServiceDate.toLocaleString("en-US", {
            timeZone: "UTC",
          })
        : "",
      fuelType: report.fuelType || "",
      cookingVolume: report.cookingVolume || "",
      cookingEquipment: report.cookingEquipment || {},
      inspectionItems: report.inspectionItems || {},
      recommendedCleaningFrequency: report.recommendedCleaningFrequency || 0,
      comments: report.comments || "",
      technicianId: report.technicianId || "",
      equipmentDetails: report.equipmentDetails || {},
      cleaningDetails: report.cleaningDetails || {},
      recommendations: report.recommendations || "",
    }));
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw new Error("Failed to fetch client reports");
  }
}

/**
 * Fetch invoice details
 */
export async function fetchInvoiceDetails(
  invoiceId: string,
  clientId: string,
): Promise<InvoiceType | null> {
  // Verify client auth
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await connectMongo();
  try {
    const invoice = await Invoice.findOne({
      _id: new ObjectId(invoiceId),
      clientId: new ObjectId(clientId),
    }).lean();

    if (!invoice) {
      return null;
    }

    // Cast types explicitly to avoid type errors
    const invoiceDoc = invoice as any;

    // Create a proper InvoiceType object
    const invoiceData: InvoiceType = {
      _id:
        typeof invoiceDoc._id === "string"
          ? invoiceDoc._id
          : invoiceDoc._id.toString(),
      invoiceId: invoiceDoc.invoiceId,
      jobTitle: invoiceDoc.jobTitle || "",
      dateIssued: invoiceDoc.dateIssued,
      dateDue: invoiceDoc.dateDue || invoiceDoc.dateIssued,
      items:
        invoiceDoc.items?.map((item: any) => ({
          description: item.description,
          price: item.price || 0,
        })) || [],
      frequency: invoiceDoc.frequency || 0,
      location: invoiceDoc.location || "",
      notes: invoiceDoc.notes || "",
      status: invoiceDoc.status || "pending",
      clientId:
        typeof invoiceDoc.clientId === "string"
          ? invoiceDoc.clientId
          : invoiceDoc.clientId.toString(),
      paymentEmailSent: invoiceDoc.paymentEmailSent || false,
    };

    // Add photos if they exist
    if (invoiceDoc.photos) {
      invoiceData.photos = invoiceDoc.photos.map((photo: any) => ({
        _id: typeof photo._id === "string" ? photo._id : photo._id.toString(),
        url: photo.url,
        timestamp: photo.timestamp,
        technicianId: photo.technicianId,
        type: photo.type as "before" | "after",
      }));
    }

    // Add signature if it exists
    if (invoiceDoc.signature) {
      invoiceData.signature = invoiceDoc.signature;
    }

    return invoiceData;
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    throw new Error("Failed to fetch invoice details");
  }
}

/**
 * Fetch report details
 */
export async function fetchReportDetails(
  reportId: string,
): Promise<ReportType | null> {
  // Verify client auth
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  await connectMongo();
  try {
    const report = await Report.findOne({
      _id: new ObjectId(reportId),
    }).lean();

    const invoice = await Invoice.findOne({
      _id: report?.invoiceId,
    }).lean();

    if (!report || !invoice) {
      console.log("Report not found or does not belong to client");
      return null;
    }

    // Cast types explicitly to avoid type errors
    const reportDoc = report as any;

    const reportData: ReportType = {
      _id:
        typeof reportDoc._id === "string"
          ? reportDoc._id
          : reportDoc._id.toString(),
      scheduleId:
        typeof reportDoc.scheduleId === "string"
          ? reportDoc.scheduleId
          : reportDoc.scheduleId.toString(),
      invoiceId:
        typeof reportDoc.invoiceId === "string"
          ? reportDoc.invoiceId
          : reportDoc.invoiceId.toString(),
      dateCompleted: reportDoc.dateCompleted.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      technicianId: reportDoc.technicianId || "",
      lastServiceDate:
        reportDoc.lastServiceDate.toLocaleString("en-US", {
          timeZone: "UTC",
        }) || "",
      fuelType: reportDoc.fuelType || "",
      cookingVolume: reportDoc.cookingVolume || "",
      cookingEquipment: reportDoc.cookingEquipment || {},
      equipmentDetails: reportDoc.equipmentDetails || {},
      cleaningDetails: reportDoc.cleaningDetails || {
        hoodCleaned: false,
        filtersCleaned: false,
        ductworkCleaned: false,
        fanCleaned: false,
      },
      recommendedCleaningFrequency: reportDoc.recommendedCleaningFrequency || 0,
      recommendations: reportDoc.recommendations || "",
      comments: reportDoc.comments || "",
      inspectionItems: reportDoc.inspectionItems || {},
      jobTitle: invoice.jobTitle || "",
    };

    return reportData;
  } catch (error) {
    console.error("Error fetching report details:", error);
    throw new Error("Failed to fetch report details");
  }
}
