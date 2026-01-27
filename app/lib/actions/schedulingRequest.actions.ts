"use server";

import connectMongo from "../connect";
import { SchedulingRequest } from "../../../models";
import { SchedulingRequestType } from "../typeDefinitions";

const normalizeDate = (value?: Date | string | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export async function getSchedulingRequestsForJobsDueSoon(
  jobsDueSoonId: string,
): Promise<{
  success: boolean;
  requests: SchedulingRequestType[];
  error?: string;
}> {
  await connectMongo();
  try {
    const requests = await SchedulingRequest.find({
      jobsDueSoonId,
    })
      .sort({ requestedAt: -1, createdAt: -1 })
      .lean();

    const serialized = requests.map((request) => ({
      _id: request._id?.toString(),
      clientId: request.clientId?.toString(),
      invoiceId: request.invoiceId?.toString(),
      jobsDueSoonId: request.jobsDueSoonId?.toString(),
      primarySelection: {
        date: normalizeDate(request.primarySelection?.date) || "",
        requestedTime: request.primarySelection?.requestedTime,
      },
      backupSelection: {
        date: normalizeDate(request.backupSelection?.date) || "",
        requestedTime: request.backupSelection?.requestedTime,
      },
      addressConfirmed: request.addressConfirmed,
      parkingNotes: request.parkingNotes,
      accessNotes: request.accessNotes,
      specialInstructions: request.specialInstructions,
      preferredContact: request.preferredContact,
      customContactMethod: request.customContactMethod,
      onSiteContactName: request.onSiteContactName,
      onSiteContactPhone: request.onSiteContactPhone,
      suggestedUsual: request.suggestedUsual,
      status: request.status,
      requestedAt: normalizeDate(request.requestedAt) || "",
      reviewedAt: normalizeDate(request.reviewedAt),
      reviewedBy: request.reviewedBy,
      reviewNotes: request.reviewNotes,
      confirmedScheduleId: request.confirmedScheduleId?.toString(),
      confirmedDate: normalizeDate(request.confirmedDate),
      confirmedTime: request.confirmedTime,
      alternativesOffered: request.alternativesOffered?.map((selection) => ({
        date: normalizeDate(selection?.date) || "",
        requestedTime: selection?.requestedTime,
      })),
      confirmationEmailSent: request.confirmationEmailSent,
      confirmationEmailSentAt: normalizeDate(request.confirmationEmailSentAt),
      createdAt: normalizeDate(request.createdAt),
      updatedAt: normalizeDate(request.updatedAt),
    })) as SchedulingRequestType[];

    return { success: true, requests: serialized };
  } catch (error) {
    console.error("Failed to fetch scheduling requests:", error);
    return {
      success: false,
      requests: [],
      error: "Failed to fetch scheduling requests",
    };
  }
}
