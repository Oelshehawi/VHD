"use server";

import { Client } from "../../../models/index";
import { revalidatePath } from "next/cache";

export async function archiveClient(
  clientId: string,
  archiveReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await Client.findByIdAndUpdate(clientId, {
      isArchived: true,
      archiveReason: archiveReason,
      archivedAt: new Date(),
    });

    // Revalidate relevant paths
    revalidatePath("/database");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to archive client:", error);
    return { success: false, error: "Failed to archive client" };
  }
}

export async function unarchiveClient(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatedClient = await Client.findByIdAndUpdate(clientId, {
      isArchived: false,
      $unset: {
        archiveReason: 1,
        archivedAt: 1,
      },
    });

    if (!updatedClient) {
      return { success: false, error: "Client not found" };
    }

    // Revalidate relevant paths
    // Revalidate relevant paths
    revalidatePath("/database");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to unarchive client:", error);
    return { success: false, error: "Failed to unarchive client" };
  }
}
