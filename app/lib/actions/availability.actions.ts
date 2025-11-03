"use server";

import connectMongo from "../connect";
import { TimeOffRequest, Availability, AuditLog } from "../../../models/reactDataSchema";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * Approve a pending time-off request
 * Admin only action
 */
export async function approvePendingTimeOff(
  requestId: string,
  notes?: string,
) {
  try {
    const { userId: adminId } = await auth();

    if (!adminId) {
      throw new Error("Unauthorized: Admin authentication required");
    }

    await connectMongo();

    // Find the request
    const timeOffRequest = await TimeOffRequest.findById(requestId);

    if (!timeOffRequest) {
      throw new Error("Time-off request not found");
    }

    if (timeOffRequest.status !== "pending") {
      throw new Error(`Cannot approve request with status: ${timeOffRequest.status}`);
    }

    // Update request status
    const oldValue = { ...timeOffRequest.toObject() };

    timeOffRequest.status = "approved";
    timeOffRequest.reviewedAt = new Date();
    timeOffRequest.reviewedBy = adminId;
    if (notes) {
      timeOffRequest.notes = notes;
    }

    const updatedRequest = await timeOffRequest.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: "system",
      action: "timeoff_approved",
      timestamp: new Date(),
      performedBy: adminId,
      details: {
        oldValue,
        newValue: updatedRequest,
        metadata: {
          requestId,
          technicianId: timeOffRequest.technicianId,
          dateRange: `${timeOffRequest.startDate} to ${timeOffRequest.endDate}`,
          approverNotes: notes || null,
        },
      },
      success: true,
    });

    revalidatePath("/payroll");

    return {
      success: true,
      message: "Time-off request approved",
      request: updatedRequest ? JSON.parse(JSON.stringify(updatedRequest.toObject())) : null,
    };
  } catch (error) {
    console.error("Error approving time-off request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve request",
    };
  }
}

/**
 * Reject a pending time-off request
 * Admin only action
 */
export async function rejectPendingTimeOff(
  requestId: string,
  notes: string,
) {
  try {
    const { userId: adminId } = await auth();

    if (!adminId) {
      throw new Error("Unauthorized: Admin authentication required");
    }

    await connectMongo();

    // Find the request
    const timeOffRequest = await TimeOffRequest.findById(requestId);

    if (!timeOffRequest) {
      throw new Error("Time-off request not found");
    }

    if (timeOffRequest.status !== "pending") {
      throw new Error(`Cannot reject request with status: ${timeOffRequest.status}`);
    }

    // Update request status
    const oldValue = { ...timeOffRequest.toObject() };

    timeOffRequest.status = "rejected";
    timeOffRequest.reviewedAt = new Date();
    timeOffRequest.reviewedBy = adminId;
    timeOffRequest.notes = notes;

    const updatedRequest = await timeOffRequest.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: "system",
      action: "timeoff_rejected",
      timestamp: new Date(),
      performedBy: adminId,
      details: {
        oldValue,
        newValue: updatedRequest,
        metadata: {
          requestId,
          technicianId: timeOffRequest.technicianId,
          dateRange: `${timeOffRequest.startDate} to ${timeOffRequest.endDate}`,
          rejectionReason: notes,
        },
      },
      success: true,
    });

    revalidatePath("/payroll");

    return {
      success: true,
      message: "Time-off request rejected",
      request: updatedRequest ? JSON.parse(JSON.stringify(updatedRequest.toObject())) : null,
    };
  } catch (error) {
    console.error("Error rejecting time-off request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject request",
    };
  }
}

/**
 * Delete a time-off request
 * Admin only action
 */
export async function deleteTimeOffRequest(requestId: string) {
  try {
    const { userId: adminId } = await auth();

    if (!adminId) {
      throw new Error("Unauthorized: Admin authentication required");
    }

    await connectMongo();

    // Find the request
    const timeOffRequest = await TimeOffRequest.findById(requestId);

    if (!timeOffRequest) {
      throw new Error("Time-off request not found");
    }

    const oldValue = { ...timeOffRequest.toObject() };

    // Delete the request
    await TimeOffRequest.findByIdAndDelete(requestId);

    // Create audit log
    await AuditLog.create({
      invoiceId: "system",
      action: "timeoff_deleted",
      timestamp: new Date(),
      performedBy: adminId,
      details: {
        oldValue,
        metadata: {
          requestId,
          technicianId: timeOffRequest.technicianId,
          dateRange: `${timeOffRequest.startDate} to ${timeOffRequest.endDate}`,
        },
      },
      success: true,
    });

    revalidatePath("/payroll");

    return {
      success: true,
      message: "Time-off request deleted",
    };
  } catch (error) {
    console.error("Error deleting time-off request:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete request",
    };
  }
}

/**
 * Update an availability entry
 * Can be used by technicians to update their own availability or by managers
 */
export async function updateAvailability(
  availabilityId: string,
  updates: {
    startTime?: string;
    endTime?: string;
    dayOfWeek?: number;
    specificDate?: Date | string;
    isFullDay?: boolean;
    isRecurring?: boolean;
  },
) {
  try {
    const { userId: userId, sessionClaims }: any = await auth();

    if (!userId) {
      throw new Error("Unauthorized: Authentication required");
    }

    await connectMongo();

    // Find the availability entry
    const availability = await Availability.findById(availabilityId);

    if (!availability) {
      throw new Error("Availability entry not found");
    }

    // Check authorization: allow technicians to update their own, or allow managers
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;
    if (availability.technicianId !== userId && !canManage) {
      throw new Error("Unauthorized: Can only update own availability");
    }

    const oldValue = { ...availability.toObject() };

    // Update the availability
    const updatedAvailability = await Availability.findByIdAndUpdate(
      availabilityId,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    // Create audit log
    await AuditLog.create({
      invoiceId: "system",
      action: "availability_updated",
      timestamp: new Date(),
      performedBy: userId,
      details: {
        oldValue,
        newValue: updatedAvailability,
        metadata: {
          availabilityId,
          technicianId: availability.technicianId,
          updatedFields: Object.keys(updates),
        },
      },
      success: true,
    });

    revalidatePath("/payroll");

    return {
      success: true,
      message: "Availability entry updated",
      availability: updatedAvailability ? JSON.parse(JSON.stringify(updatedAvailability)) : null,
    };
  } catch (error) {
    console.error("Error updating availability:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update availability",
    };
  }
}

/**
 * Delete an availability entry
 * Can be used by technicians to remove their own availability or by managers
 */
export async function deleteAvailability(availabilityId: string) {
  try {
    const { userId: userId, sessionClaims }: any = await auth();

    if (!userId) {
      throw new Error("Unauthorized: Authentication required");
    }

    await connectMongo();

    // Find the availability entry
    const availability = await Availability.findById(availabilityId);

    if (!availability) {
      throw new Error("Availability entry not found");
    }

    // Check authorization: allow technicians to delete their own, or allow managers
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;
    if (availability.technicianId !== userId && !canManage) {
      throw new Error("Unauthorized: Can only delete own availability");
    }

    const oldValue = { ...availability.toObject() };

    // Delete the availability
    await Availability.findByIdAndDelete(availabilityId);

    // Create audit log
    await AuditLog.create({
      invoiceId: "system",
      action: "availability_deleted",
      timestamp: new Date(),
      performedBy: userId,
      details: {
        oldValue,
        metadata: {
          availabilityId,
          technicianId: availability.technicianId,
        },
      },
      success: true,
    });

    revalidatePath("/payroll");

    return {
      success: true,
      message: "Availability entry deleted",
    };
  } catch (error) {
    console.error("Error deleting availability:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete availability",
    };
  }
}
